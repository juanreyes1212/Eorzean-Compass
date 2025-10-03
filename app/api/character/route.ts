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

  let lodestoneId: number | null = null;
  let characterProfile: TomestoneProfileCharacter | null = null;
  let isRealData = false;
  let apiErrorReason: string | undefined;

  // Step 1: Get Lodestone ID from Tomestone.gg (this is all we need from Tomestone)
  try {
    if (!TOMESTONE_API_KEY) {
      console.warn("[Character API] No Tomestone API key available");
      throw new Error("Tomestone.gg API key is missing.");
    }

    const profileUrl = `${EXTERNAL_APIS.TOMESTONE_BASE}/character/profile/${encodeURIComponent(sanitizedServer)}/${encodeURIComponent(sanitizedName)}?update=true`;
    
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
      if (profileResponse.status >= 500) {
        return NextResponse.json(
          { error: "The character search service (Tomestone.gg) is temporarily unavailable. Please try again later." },
          { status: 503, headers }
        );
      }
      throw new Error(`Tomestone API returned status ${profileResponse.status}`);
    }

    characterProfile = await profileResponse.json();
    
    if (!characterProfile || !characterProfile.id) {
      console.error("[Character API] Invalid character data from Tomestone:", characterProfile);
      throw new Error("Invalid character data from Tomestone.gg");
    }

    console.log(`[Character API] Got Lodestone ID: ${characterProfile.id} for ${characterProfile.name}`);

    lodestoneId = characterProfile.id;
    isRealData = true;

  } catch (profileError) {
    console.error("[Character API] Tomestone profile failed:", profileError instanceof Error ? profileError.message : profileError);
    if (profileError instanceof Error && (profileError.message.includes('timeout') || profileError.message.includes('fetch failed'))) {
      return NextResponse.json(
        { error: "The character search service could not be reached. Please check your connection or try again later." },
        { status: 503, headers }
      );
    }
    
    apiErrorReason = `Tomestone.gg profile unavailable: ${profileError instanceof Error ? profileError.message : 'Unknown error'}.`;
    isRealData = false;
  }

  // Step 2: If we have a Lodestone ID, return it for the achievements API to use
  if (lodestoneId && characterProfile) {
    console.log(`[Character API] Successfully got real character data with Lodestone ID: ${lodestoneId}`);
    
    const finalCharacterData = {
      id: lodestoneId.toString(),
      name: characterProfile.name,
      server: characterProfile.server,
      avatar: characterProfile.avatar || "/placeholder.svg?height=96&width=96&text=Avatar",
      achievementPoints: characterProfile.achievementPoints?.unrankedPoints || 0,
      achievementsCompleted: 0, // Will be updated by client after achievements load
      totalAchievements: 0, // Will be updated by client after achievements load
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json({
      character: finalCharacterData,
      lodestoneId: lodestoneId,
      completedAchievements: [], // Will be populated by achievements API
      _isRealData: true,
      _isMockData: false,
    }, { headers });
  }

  // Step 3: Fallback to mock data if Tomestone fails
  console.log("[Character API] Generating mock character data...");
  const mock = generateMockCharacterData(nameParam, serverParam, apiErrorReason);
  
  return NextResponse.json({
    character: mock.character,
    lodestoneId: null, // No real Lodestone ID available
    completedAchievements: mock.completedAchievements,
    _isRealData: false,
    _isMockData: true,
    _error: apiErrorReason || mock._error,
  }, { headers });
}