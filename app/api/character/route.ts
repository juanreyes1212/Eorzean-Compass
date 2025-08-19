import { NextResponse } from "next/server";
import { EXTERNAL_APIS, TOMESTONE_API_KEY } from '@/lib/constants';

// Tomestone.gg API response structures based on api-docs.json
interface TomestoneProfileCharacter {
  id: string;
  name: string;
  server: string;
  avatar: string;
  achievement_points: number; // Total achievement points
  achievements_completed: number; // Total achievements completed
}

interface TomestoneProfileResponse {
  character: TomestoneProfileCharacter;
}

interface TomestoneCharacterAchievementsData {
  character: {
    id: string;
    name: string;
    server: string;
    avatar: string;
    achievement_points?: number;
    achievements_completed?: number;
  };
  achievements?: Array<{ // This is the array we need for completed achievements
    id: number;
    date: string; // ISO 8601 date string
  }>;
}

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
  
  const completedAchievements = [];
  const totalAchievements = 2500;
  
  for (let i = 1; i <= totalAchievements; i++) {
    if ((parseInt(characterId) + i) % 10 < 4) { // Roughly 40% completion
      completedAchievements.push({
        id: i,
        completionDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  }

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
    },
    completedAchievements,
    _isMockData: true,
    _error: errorReason || "Using demo data - Tomestone.gg API may be temporarily unavailable or rate-limited."
  };
}

export async function GET(request: Request) {
  const nameParam = new URL(request.url).searchParams.get('name');
  const serverParam = new URL(request.url).searchParams.get('server');

  console.log(`[API Request] Received request for ${nameParam} on ${serverParam}`);

  if (!nameParam || !serverParam || typeof nameParam !== 'string' || typeof serverParam !== 'string') {
    console.error("[API Error] Missing or invalid name/server parameters.");
    return NextResponse.json(
      { error: "Valid name and server strings are required" },
      { status: 400 }
    );
  }

  const validServers = [
    "Adamantoise", "Cactuar", "Faerie", "Gilgamesh", "Jenova", "Midgardsormr", "Sargatanas", "Siren",
    "Balmung", "Brynhildr", "Coeurl", "Diabolos", "Goblin", "Malboro", "Mateus", "Zalera",
    "Behemoth", "Excalibur", "Exodus", "Famfrit", "Hyperion", "Lamia", "Leviathan", "Ultros"
  ];
  
  if (!validServers.includes(serverParam)) {
    console.error(`[API Error] Invalid server name provided: ${serverParam}`);
    return NextResponse.json(
      { error: "Invalid server name" },
      { status: 400 }
    );
  }

  if (!TOMESTONE_API_KEY) {
    console.warn("[Tomestone API] TOMESTONE_API_KEY is not set. Falling back to mock data.");
    return NextResponse.json(generateMockCharacterData(nameParam, serverParam, "Tomestone.gg API key is missing."));
  }
  
  console.log(`[Tomestone API] API Key status: ${TOMESTONE_API_KEY ? 'Present' : 'Missing'}`);

  let realCharacterData: TomestoneProfileCharacter | null = null;
  let completedAchievements: Array<{ id: number; completionDate: string }> = [];
  let isRealData = false;
  let apiErrorReason: string | undefined;

  try {
    // Step 1: Fetch Character Profile to get basic info and ID
    const profileUrl = `${EXTERNAL_APIS.TOMESTONE_BASE}/character/profile/${encodeURIComponent(serverParam)}/${encodeURIComponent(nameParam)}`;
    
    console.log(`[Tomestone API] Calling profile endpoint: ${profileUrl}`);
    
    const profileResponse = await fetchWithTimeout(profileUrl, {
      headers: {
        'Authorization': `Bearer ${TOMESTONE_API_KEY}`,
        'User-Agent': `Eorzean-Compass/1.0 (${process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.netlify.app'})`,
        'Accept': 'application/json',
        'Referer': process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.netlify.app'
      }
    }, 15000);

    console.log(`[Tomestone API] Profile response status: ${profileResponse.status}`);

    if (!profileResponse.ok) {
      const errorBody = await profileResponse.text();
      console.error(`[Tomestone API Error] Profile fetch failed: ${profileResponse.status} ${profileResponse.statusText}. Body: ${errorBody}`);
      if (profileResponse.status === 404) {
        return NextResponse.json(
          { error: "Character not found. Please check the name and server spelling." },
          { status: 404 }
        );
      }
      throw new Error(`Tomestone.gg profile fetch failed with status ${profileResponse.status}`);
    }

    const tomestoneProfileData: TomestoneProfileResponse = await profileResponse.json();
    console.log(`[Tomestone API] Raw Tomestone profile data received: ${JSON.stringify(tomestoneProfileData, null, 2)}`);
    
    if (!tomestoneProfileData.character || !tomestoneProfileData.character.id) {
      console.error("[Tomestone API Error] Profile data missing character object or ID.");
      throw new Error("Invalid character data from Tomestone.gg profile result");
    }

    realCharacterData = tomestoneProfileData.character;
    isRealData = true;

    // Step 2: Fetch detailed completed achievements using the character ID
    const characterAchievementsUrl = `${EXTERNAL_APIS.TOMESTONE_BASE}/character/${realCharacterData.id}?data=achievements`;
    
    console.log(`[Tomestone API] Calling character achievements endpoint: ${characterAchievementsUrl}`);
    
    const achievementsResponse = await fetchWithTimeout(characterAchievementsUrl, {
      headers: {
        'Authorization': `Bearer ${TOMESTONE_API_KEY}`,
        'User-Agent': `Eorzean-Compass/1.0 (${process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.netlify.app'})`,
        'Accept': 'application/json',
        'Referer': process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.netlify.app'
      }
    }, 15000);

    console.log(`[Tomestone API] Achievements response status: ${achievementsResponse.status}`);

    if (!achievementsResponse.ok) {
      const errorBody = await achievementsResponse.text();
      console.error(`[Tomestone API Error] Achievements fetch failed: ${achievementsResponse.status} ${achievementsResponse.statusText}. Body: ${errorBody}`);
      apiErrorReason = `Failed to fetch achievements: ${achievementsResponse.status} ${achievementsResponse.statusText}`;
      // Do NOT throw here, just use mock achievements
    } else {
      const tomestoneAchievementsData: TomestoneCharacterAchievementsData = await achievementsResponse.json();
      console.log(`[Tomestone API] Raw Tomestone achievements data received: ${JSON.stringify(tomestoneAchievementsData, null, 2)}`);

      if (tomestoneAchievementsData.achievements && Array.isArray(tomestoneAchievementsData.achievements)) {
        completedAchievements = tomestoneAchievementsData.achievements
          .filter(achievement => achievement.id && achievement.date)
          .map(achievement => ({
            id: achievement.id,
            completionDate: new Date(achievement.date).toISOString()
          }));
        console.log(`[Tomestone API] Successfully fetched ${completedAchievements.length} real completed achievements.`);
      } else {
        console.warn("[Tomestone API] Achievements array not found or invalid in response. Generating mock completed achievements.");
        apiErrorReason = "Tomestone.gg did not return a valid achievements list.";
      }
    }

  } catch (apiError) {
    console.error("[Tomestone API Error] Tomestone.gg API call failed:", apiError instanceof Error ? apiError.message : apiError);
    apiErrorReason = `Tomestone.gg API unavailable: ${apiError instanceof Error ? apiError.message : 'Unknown error'}.`;
    // If any real API call fails, we fall back to mock data for everything
    isRealData = false;
    realCharacterData = null; // Ensure we don't use partial real data if the flow broke
  }

  // Final data construction
  let finalCharacterData;
  let finalCompletedAchievements;
  let finalIsMockData = false;
  let finalError: string | undefined;

  if (isRealData && realCharacterData) {
    // If profile was real, use it. If achievements fetch failed, use mock achievements.
    finalCharacterData = {
      id: realCharacterData.id,
      name: realCharacterData.name,
      server: realCharacterData.server,
      avatar: realCharacterData.avatar || "/placeholder.svg?height=96&width=96&text=Avatar",
      achievementPoints: realCharacterData.achievement_points || 0,
      achievementsCompleted: realCharacterData.achievements_completed || 0,
      totalAchievements: 2500, // Placeholder/Estimate
    };
    
    if (completedAchievements.length > 0) {
      finalCompletedAchievements = completedAchievements;
      finalError = apiErrorReason; // If there was an error but we still got some achievements
    } else {
      // If real profile but no real achievements, generate mock achievements
      const mock = generateMockCharacterData(nameParam, serverParam, apiErrorReason);
      finalCompletedAchievements = mock.completedAchievements;
      finalIsMockData = true; // Mark as mock if achievements are mocked
      finalError = apiErrorReason || mock._error;
    }
    
    // If we got real profile data, but had to mock achievements, still indicate real profile
    if (finalIsMockData) {
      isRealData = false; // Override to false if any part is mocked
    }

  } else {
    // If initial profile fetch failed, use full mock data
    const mock = generateMockCharacterData(nameParam, serverParam, apiErrorReason);
    finalCharacterData = mock.character;
    finalCompletedAchievements = mock.completedAchievements;
    finalIsMockData = true;
    finalError = apiErrorReason || mock._error;
  }

  return NextResponse.json({
    character: finalCharacterData,
    completedAchievements: finalCompletedAchievements,
    _isRealData: isRealData, // This will be true only if both profile and achievements were real
    _isMockData: finalIsMockData,
    _error: finalError,
  });
}