import { NextResponse } from "next/server";
import { EXTERNAL_APIS, TOMESTONE_API_KEY } from '@/lib/constants';
import { CompletedAchievement } from '@/lib/types';
import { validateCharacterName, validateServerName, apiRateLimiter, securityHeaders } from '@/lib/security';

// Tomestone.gg API response structures (for getting Lodestone ID only)
interface TomestoneProfileCharacter {
  id: number;
  name: string;
  server: string;
  avatar: string;
  achievementPoints: {
    id: number;
    points: number;
    unrankedPoints: number;
    rankPosition: number;
    rankPercent: number;
    cssRankClassName: string;
  } | null;
}

// FFXIVCollect achievement structures
interface FFXIVCollectAchievement {
  id: number;
  name: string;
  description: string;
  points: number;
  order: number;
  patch: string;
  owned: string;
  icon: string;
  category: { id: number; name: string };
  type: { id: number; name: string };
}

// Add timeout wrapper for fetch requests
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 20000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

// Generate mock character data for testing/fallback
function generateMockCharacterData(name: string, server: string, errorReason?: string) {
  let hash = 0;
  const str = (name + server).toLowerCase();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const characterId = Math.abs(hash).toString().padStart(8, '0');
  
  // Generate consistent completed achievements for demo
  const completedAchievements: CompletedAchievement[] = [];
  const completionCount = Math.floor(Math.random() * 500) + 200; // 200-700 completed
  const completedIds = new Set<number>();
  
  while (completedIds.size < completionCount) {
    const randomId = Math.floor(Math.random() * 2500) + 1;
    completedIds.add(randomId);
  }

  completedIds.forEach(id => {
    completedAchievements.push({ 
      id,
      completedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    });
  });

  console.log(`[Character API] Generated mock data for ${name}: ${completedAchievements.length} completed achievements`);

  return {
    character: {
      id: characterId,
      name: name,
      server: server,
      avatar: "/placeholder.svg?height=96&width=96&text=Avatar",
      achievementPoints: completedAchievements.length * 10,
      achievementsCompleted: completedAchievements.length,
      totalAchievements: 2500,
      lastUpdated: new Date().toISOString(),
    },
    completedAchievements,
    _isMockData: true,
    _error: errorReason || "Using demo data - Tomestone.gg API may be temporarily unavailable."
  };
}

// Fetch completed achievements from FFXIVCollect using Lodestone ID
async function fetchCompletedAchievementsFromFFXIVCollect(lodestoneId: number): Promise<CompletedAchievement[]> {
  console.log(`[Character API] Fetching completed achievements from FFXIVCollect for Lodestone ID: ${lodestoneId}`);
  
  try {
    const ownedUrl = `${EXTERNAL_APIS.FFXIV_COLLECT_BASE}/characters/${lodestoneId}/achievements/owned`;
    console.log(`[Character API] FFXIVCollect owned URL: ${ownedUrl}`);
    
    const response = await fetchWithTimeout(ownedUrl, {
      headers: {
        'User-Agent': `Eorzean-Compass/1.0 (${process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.netlify.app'})`,
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Character API] FFXIVCollect owned achievements failed: ${response.status} - ${errorText}`);
      
      if (response.status === 404) {
        throw new Error("Character not found on FFXIVCollect. The character may not exist or achievements may be private.");
      }
      
      throw new Error(`FFXIVCollect HTTP ${response.status}: ${response.statusText}`);
    }

    const ownedAchievements: FFXIVCollectAchievement[] = await response.json();
    console.log(`[Character API] FFXIVCollect returned ${ownedAchievements.length} owned achievements`);
    
    if (!Array.isArray(ownedAchievements)) {
      throw new Error("Invalid response format from FFXIVCollect owned achievements");
    }

    // Convert to our format
    const completedAchievements: CompletedAchievement[] = ownedAchievements.map(achievement => ({
      id: achievement.id,
      completedAt: new Date().toISOString(), // FFXIVCollect doesn't provide completion dates
    }));

    console.log(`[Character API] Processed ${completedAchievements.length} completed achievements from FFXIVCollect`);
    console.log(`[Character API] Sample completed achievement IDs:`, completedAchievements.slice(0, 10).map(a => a.id));
    
    return completedAchievements;
    
  } catch (error) {
    console.error("[Character API] FFXIVCollect completed achievements fetch failed:", error);
    throw error;
  }
}

export async function GET(request: Request) {
  // Add security headers
  const headers = new Headers(securityHeaders);
  
  console.log("[Character API] Starting simplified character fetch...");
  
  // Rate limiting
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
  if (!apiRateLimiter.isAllowed(clientIP)) {
    console.warn(`[Character API] Rate limit exceeded for IP: ${clientIP}`);
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      { status: 429, headers }
    );
  }
  
  const nameParam = new URL(request.url).searchParams.get('name');
  const serverParam = new URL(request.url).searchParams.get('server');

  console.log(`[Character API] Received request for ${nameParam} on ${serverParam}`);

  if (!nameParam || !serverParam || typeof nameParam !== 'string' || typeof serverParam !== 'string') {
    console.error("[Character API] Missing or invalid name/server parameters.");
    return NextResponse.json(
      { error: "Valid name and server strings are required" },
      { status: 400, headers }
    );
  }
  
  // Validate and sanitize inputs
  const nameValidation = validateCharacterName(nameParam);
  if (!nameValidation.isValid) {
    console.error(`[Character API] Name validation failed: ${nameValidation.error}`);
    return NextResponse.json(
      { error: nameValidation.error },
      { status: 400, headers }
    );
  }
  
  const serverValidation = validateServerName(serverParam);
  if (!serverValidation.isValid) {
    console.error(`[Character API] Server validation failed: ${serverValidation.error}`);
    return NextResponse.json(
      { error: serverValidation.error },
      { status: 400, headers }
    );
  }

  const sanitizedName = nameParam.trim();
  const sanitizedServer = serverParam;

  console.log(`[Character API] TOMESTONE_API_KEY status: ${TOMESTONE_API_KEY ? 'Present' : 'Missing'}`);

  let realCharacterData: TomestoneProfileCharacter | null = null;
  let completedAchievementsFromAPI: CompletedAchievement[] = [];
  let isRealData = false;
  let apiErrorReason: string | undefined;
  let lodestoneId: number | null = null;

  // Step 1: Get Lodestone ID from Tomestone.gg
  try {
    if (!TOMESTONE_API_KEY) {
      console.warn("[Character API] No Tomestone API key available");
      throw new Error("Tomestone.gg API key is missing.");
    }

    const profileUrl = `${EXTERNAL_APIS.TOMESTONE_BASE}/character/profile/${encodeURIComponent(sanitizedServer)}/${encodeURIComponent(sanitizedName)}`;
    
    console.log(`[Character API] Fetching Lodestone ID from Tomestone.gg: ${profileUrl}`);
    
    const profileResponse = await fetchWithTimeout(profileUrl, {
      headers: {
        'Authorization': `Bearer ${TOMESTONE_API_KEY}`,
        'User-Agent': `Eorzean-Compass/1.0 (${process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.netlify.app'})`,
        'Accept': 'application/json',
      }
    });

    console.log(`[Character API] Tomestone profile response: ${profileResponse.status}`);

    if (!profileResponse.ok) {
      const errorBody = await profileResponse.text();
      console.error(`[Character API] Tomestone profile failed: ${profileResponse.status} - ${errorBody.substring(0, 200)}`);
      
      if (profileResponse.status === 404) {
        return NextResponse.json(
          { error: "Character not found. Please check the name and server spelling." },
          { status: 404, headers }
        );
      }
      throw new Error(`Tomestone profile fetch failed: ${profileResponse.status}`);
    }

    const tomestoneProfileData: TomestoneProfileCharacter = await profileResponse.json();
    console.log(`[Character API] Got Lodestone ID: ${tomestoneProfileData.id} for ${tomestoneProfileData.name}`);
    
    if (!tomestoneProfileData || !tomestoneProfileData.id) {
      console.error("[Character API] Invalid character data from Tomestone:", tomestoneProfileData);
      throw new Error("Invalid character data from Tomestone.gg");
    }

    realCharacterData = tomestoneProfileData;
    lodestoneId = realCharacterData.id;
    isRealData = true;

  } catch (profileError) {
    console.error("[Character API] Tomestone profile failed:", profileError instanceof Error ? profileError.message : profileError);
    apiErrorReason = `Tomestone.gg profile unavailable: ${profileError instanceof Error ? profileError.message : 'Unknown error'}.`;
    isRealData = false;
  }

  // Step 2: Get completed achievements from FFXIVCollect using Lodestone ID
  if (lodestoneId && isRealData) {
    console.log(`[Character API] Fetching completed achievements from FFXIVCollect for Lodestone ID: ${lodestoneId}`);
    try {
      completedAchievementsFromAPI = await fetchCompletedAchievementsFromFFXIVCollect(lodestoneId);
      console.log(`[Character API] Successfully fetched ${completedAchievementsFromAPI.length} completed achievements from FFXIVCollect`);
      
    } catch (completedError) {
      console.error("[Character API] FFXIVCollect completed achievements failed:", completedError);
      apiErrorReason = (apiErrorReason ? apiErrorReason + "; " : "") + `FFXIVCollect achievements unavailable: ${completedError instanceof Error ? completedError.message : 'Unknown error'}.`;
      // Don't set isRealData to false here - we still have valid character data
    }
  }

  // Final Data Construction
  let finalCharacterData;
  let finalCompletedAchievements: CompletedAchievement[] = [];
  let finalIsMockData = false;
  let finalError: string | undefined;
  const now = new Date().toISOString();

  if (isRealData && realCharacterData) {
    console.log("[Character API] Constructing real character data...");
    finalCharacterData = {
      id: realCharacterData.id.toString(),
      name: realCharacterData.name,
      server: realCharacterData.server,
      avatar: realCharacterData.avatar || "/placeholder.svg?height=96&width=96&text=Avatar",
      achievementPoints: realCharacterData.achievementPoints?.points || 0,
      achievementsCompleted: completedAchievementsFromAPI.length,
      totalAchievements: 2500, // Will be updated by achievements API
      lastUpdated: now,
    };
    
    finalCompletedAchievements = completedAchievementsFromAPI;
    finalIsMockData = false;
    finalError = apiErrorReason;

  } else {
    console.log("[Character API] Generating mock character data...");
    const mock = generateMockCharacterData(nameParam, serverParam, apiErrorReason);
    finalCharacterData = mock.character;
    finalCompletedAchievements = mock.completedAchievements;
    finalIsMockData = true;
    finalError = apiErrorReason || mock._error;
  }

  console.log(`[Character API] Final response: ${finalCompletedAchievements.length} completed achievements, isRealData=${isRealData}`);
  console.log(`[Character API] Sample completed achievement IDs:`, finalCompletedAchievements.slice(0, 10).map(a => a.id));
  
  return NextResponse.json({
    character: finalCharacterData,
    completedAchievements: finalCompletedAchievements,
    _isRealData: isRealData,
    _isMockData: finalIsMockData,
    _error: finalError,
  }, { headers });
}