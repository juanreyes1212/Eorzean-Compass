import { NextResponse } from "next/server";
import { EXTERNAL_APIS, TOMESTONE_API_KEY } from '@/lib/constants';
import { CompletedAchievement } from '@/lib/types';
import { validateCharacterName, validateServerName, apiRateLimiter, securityHeaders } from '@/lib/security';

// Tomestone.gg API response structures
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

interface TomestoneCompletedAchievement {
  id: number;
  name: string;
  description: string;
  points: number;
  category: string;
  patch: string;
  icon: string;
  rarity?: number;
  completedAt?: string; // Date when achievement was completed
  progress?: any; // Any progress data if available
}

interface TomestoneCharacterAchievementsResponse {
  results: TomestoneCompletedAchievement[];
  total: number;
  page: number;
  limit: number;
}

// FFXIVCollect fallback structures
interface FFXIVCollectOwnedAchievementItem {
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
  reward?: any;
}

type FFXIVCollectCharacterOwnedAchievementsResponse = FFXIVCollectOwnedAchievementItem[];

// Add timeout wrapper for fetch requests
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 15000): Promise<Response> {
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
  
  const completedAchievements: CompletedAchievement[] = [];
  const totalAchievements = 2500;

  // Generate a consistent set of completed achievements for mock data
  const completionCount = Math.floor(totalAchievements * 0.3); // Roughly 30% completion
  const completedIds = new Set<number>();
  while (completedIds.size < completionCount) {
    const randomId = Math.floor(Math.random() * totalAchievements) + 1;
    completedIds.add(randomId);
  }

  completedIds.forEach(id => {
    completedAchievements.push({ 
      id,
      completedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    });
  });

  console.log(`[MOCK DATA] Generated mock data for ${name}:`, {
    completedCount: completedAchievements.length,
    sampleIds: completedAchievements.slice(0, 5).map(a => a.id)
  });

  return {
    character: {
      id: characterId,
      name: name,
      server: server,
      avatar: "/placeholder.svg?height=96&width=96&text=Avatar",
      achievementPoints: completedAchievements.length * 10,
      achievementsCompleted: completedAchievements.length,
      totalAchievements,
      lastUpdated: new Date().toISOString(),
    },
    completedAchievements,
    _isMockData: true,
    _error: errorReason || "Using demo data - Tomestone.gg API may be temporarily unavailable or rate-limited."
  };
}

export async function GET(request: Request) {
  // Add security headers
  const headers = new Headers(securityHeaders);
  
  // Rate limiting
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
  if (!apiRateLimiter.isAllowed(clientIP)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      { status: 429, headers }
    );
  }
  
  const nameParam = new URL(request.url).searchParams.get('name');
  const serverParam = new URL(request.url).searchParams.get('server');

  console.log(`[API Character] Received request for ${nameParam} on ${serverParam}`);

  if (!nameParam || !serverParam || typeof nameParam !== 'string' || typeof serverParam !== 'string') {
    console.error("[API Character Error] Missing or invalid name/server parameters.");
    return NextResponse.json(
      { error: "Valid name and server strings are required" },
      { status: 400, headers }
    );
  }
  
  // Validate and sanitize inputs
  const nameValidation = validateCharacterName(nameParam);
  if (!nameValidation.isValid) {
    return NextResponse.json(
      { error: nameValidation.error },
      { status: 400, headers }
    );
  }
  
  const serverValidation = validateServerName(serverParam);
  if (!serverValidation.isValid) {
    return NextResponse.json(
      { error: serverValidation.error },
      { status: 400, headers }
    );
  }

  const sanitizedName = nameValidation.isValid ? nameParam.trim() : nameParam;
  const sanitizedServer = serverParam;

  console.log(`[API Character] TOMESTONE_API_KEY status: ${TOMESTONE_API_KEY ? 'Present' : 'Missing'}`);

  let realCharacterData: TomestoneProfileCharacter | null = null;
  let completedAchievementsFromAPI: CompletedAchievement[] = [];
  let isRealData = false;
  let apiErrorReason: string | undefined;
  let lodestoneId: number | null = null;

  // --- Step 1: Fetch Character Profile from Tomestone.gg (to get Lodestone ID and basic info) ---
  try {
    if (!TOMESTONE_API_KEY) {
      throw new Error("Tomestone.gg API key is missing.");
    }

    const profileUrl = `${EXTERNAL_APIS.TOMESTONE_BASE}/character/profile/${encodeURIComponent(serverParam)}/${encodeURIComponent(nameParam)}`;
    
    console.log(`[API Character] Attempting to fetch profile from Tomestone.gg: ${profileUrl}`);
    
    const profileResponse = await fetchWithTimeout(profileUrl, {
      headers: {
        'Authorization': `Bearer ${TOMESTONE_API_KEY}`,
        'User-Agent': `Eorzean-Compass/1.0 (${process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.netlify.app'})`,
        'Accept': 'application/json',
        'Referer': process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.netlify.app'
      }
    }, 15000);

    console.log(`[API Character] Tomestone.gg Profile fetch completed. Status: ${profileResponse.status}`);

    if (!profileResponse.ok) {
      const errorBody = await profileResponse.text();
      console.error(`[API Character Error] Tomestone.gg Profile fetch failed: ${profileResponse.status} ${profileResponse.statusText}. Body: ${errorBody.substring(0, 200)}...`);
      if (profileResponse.status === 404) {
        return NextResponse.json(
          { error: "Character not found. Please check the name and server spelling." },
          { status: 404, headers }
        );
      }
      throw new Error(`Tomestone.gg profile fetch failed with status ${profileResponse.status}`);
    }

    const tomestoneProfileData: TomestoneProfileCharacter = await profileResponse.json();
    console.log(`[API Character] Raw Tomestone profile data received: ${JSON.stringify(tomestoneProfileData, null, 2)}`);
    
    if (!tomestoneProfileData || !tomestoneProfileData.id || tomestoneProfileData.achievementPoints === undefined) {
      console.error("[API Character Error] Tomestone.gg profile data missing expected fields (id or achievementPoints property).");
      throw new Error("Invalid character data from Tomestone.gg profile result");
    }

    realCharacterData = tomestoneProfileData;
    lodestoneId = realCharacterData.id;
    isRealData = true;

  } catch (profileError) {
    console.error("[API Character Error] Tomestone.gg profile API call failed:", profileError instanceof Error ? profileError.message : profileError);
    apiErrorReason = `Tomestone.gg API unavailable for profile: ${profileError instanceof Error ? profileError.message : 'Unknown error'}.`;
    isRealData = false;
  }

  // --- Step 2: Fetch Completed Achievements from Tomestone.gg (if Lodestone ID obtained) ---
  if (lodestoneId && isRealData) {
    try {
      const tomestoneAchievementsUrl = `${EXTERNAL_APIS.TOMESTONE_BASE}/character/${lodestoneId}/achievements`;
      
      console.log(`[API Character] Attempting to fetch completed achievements from Tomestone.gg: ${tomestoneAchievementsUrl}`);
      
      const achievementsResponse = await fetchWithTimeout(tomestoneAchievementsUrl, {
        headers: {
          'Authorization': `Bearer ${TOMESTONE_API_KEY}`,
          'User-Agent': `Eorzean-Compass/1.0 (${process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.netlify.app'})`,
          'Accept': 'application/json',
        }
      }, 20000);

      console.log(`[API Character] Tomestone.gg Achievements fetch completed. Status: ${achievementsResponse.status}`);

      if (!achievementsResponse.ok) {
        const errorBody = await achievementsResponse.text();
        console.error(`[API Character Error] Tomestone.gg Achievements fetch failed: ${achievementsResponse.status} ${achievementsResponse.statusText}. Body: ${errorBody.substring(0, 200)}...`);
        
        if (achievementsResponse.status === 403 || errorBody.includes("private")) {
          apiErrorReason = (apiErrorReason ? apiErrorReason + "; " : "") + "Character's achievements are private on Lodestone. Please make them public to view real data.";
        } else {
          throw new Error(`Tomestone.gg achievements fetch failed with status ${achievementsResponse.status}`);
        }
      } else {
        const tomestoneAchievementsData: TomestoneCharacterAchievementsResponse = await achievementsResponse.json();
        console.log(`[API Character] Raw Tomestone achievements data received (count: ${tomestoneAchievementsData.results?.length || 0})`);

        if (tomestoneAchievementsData.results && Array.isArray(tomestoneAchievementsData.results)) {
          completedAchievementsFromAPI = tomestoneAchievementsData.results.map(item => ({
            id: item.id,
            completedAt: item.completedAt || new Date().toISOString(),
            progress: item.progress
          }));
          console.log(`[API Character] Successfully parsed ${completedAchievementsFromAPI.length} real completed achievements from Tomestone.gg.`);
        } else {
          console.warn("[API Character] Tomestone.gg Achievements data is not a valid array of results.");
          apiErrorReason = (apiErrorReason ? apiErrorReason + "; " : "") + "Tomestone.gg did not return valid achievements data.";
        }
      }

    } catch (tomestoneAchievementsError) {
      console.error("[API Character Error] Tomestone.gg achievements API call failed:", tomestoneAchievementsError instanceof Error ? tomestoneAchievementsError.message : tomestoneAchievementsError);
      apiErrorReason = (apiErrorReason ? apiErrorReason + "; " : "") + `Tomestone.gg unavailable for achievements: ${tomestoneAchievementsError instanceof Error ? tomestoneAchievementsError.message : 'Unknown error'}.`;
    }
  }

  // --- Step 3: Fallback to FFXIVCollect if Tomestone.gg achievements failed ---
  if (lodestoneId && completedAchievementsFromAPI.length === 0 && isRealData) {
    try {
      console.log(`[API Character] Falling back to FFXIVCollect for completed achievements...`);
      const ffxivCollectAchievementsUrl = `${EXTERNAL_APIS.FFXIV_COLLECT_BASE}/characters/${lodestoneId}/achievements/owned`;
      
      const achievementsResponse = await fetchWithTimeout(ffxivCollectAchievementsUrl, {
        headers: {
          'User-Agent': `Eorzean-Compass/1.0 (${process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.netlify.app'})`,
          'Accept': 'application/json',
        }
      }, 15000);

      if (achievementsResponse.ok) {
        const ffxivCollectData: FFXIVCollectCharacterOwnedAchievementsResponse = await achievementsResponse.json();
        
        if (Array.isArray(ffxivCollectData)) {
          completedAchievementsFromAPI = ffxivCollectData.map(item => ({
            id: item.id,
            completedAt: new Date().toISOString(), // FFXIVCollect doesn't provide completion dates
          }));
          console.log(`[API Character] Successfully parsed ${completedAchievementsFromAPI.length} completed achievements from FFXIVCollect fallback.`);
          apiErrorReason = (apiErrorReason ? apiErrorReason + "; " : "") + "Using FFXIVCollect for completed achievements (no completion dates available).";
        }
      } else {
        console.warn(`[API Character] FFXIVCollect fallback also failed: ${achievementsResponse.status}`);
      }
    } catch (ffxivCollectError) {
      console.error("[API Character Error] FFXIVCollect fallback failed:", ffxivCollectError instanceof Error ? ffxivCollectError.message : ffxivCollectError);
    }
  }

  // --- Final Data Construction ---
  let finalCharacterData;
  let finalCompletedAchievements: CompletedAchievement[] = [];
  let finalIsMockData = false;
  let finalError: string | undefined;
  const now = new Date().toISOString();

  if (isRealData && realCharacterData) {
    finalCharacterData = {
      id: realCharacterData.id.toString(),
      name: realCharacterData.name,
      server: realCharacterData.server,
      avatar: realCharacterData.avatar || "/placeholder.svg?height=96&width=96&text=Avatar",
      achievementPoints: realCharacterData.achievementPoints?.points || 0,
      achievementsCompleted: completedAchievementsFromAPI.length > 0 
        ? completedAchievementsFromAPI.length 
        : (realCharacterData.achievementPoints?.unrankedPoints || 0),
      totalAchievements: 2500, // Will be updated by achievements API
      lastUpdated: now,
    };
    
    if (completedAchievementsFromAPI.length === 0) {
      const mockCompleted = generateMockCharacterData(nameParam, serverParam).completedAchievements;
      finalCompletedAchievements = mockCompleted;
      finalIsMockData = true;
      finalError = apiErrorReason || "Using demo completed achievements due to API issue.";
    } else {
      finalCompletedAchievements = completedAchievementsFromAPI;
      finalIsMockData = false;
      finalError = apiErrorReason;
    }

  } else {
    const mock = generateMockCharacterData(nameParam, serverParam, apiErrorReason);
    finalCharacterData = mock.character;
    finalCompletedAchievements = mock.completedAchievements;
    finalIsMockData = true;
    finalError = apiErrorReason || mock._error;
  }

  console.log(`[API Character] Final response: isRealData=${isRealData}, isMockData=${finalIsMockData}, error=${finalError || 'none'}`);
  return NextResponse.json({
    character: finalCharacterData,
    completedAchievements: finalCompletedAchievements,
    _isRealData: isRealData,
    _isMockData: finalIsMockData,
    _error: finalError,
  }, { headers });
}