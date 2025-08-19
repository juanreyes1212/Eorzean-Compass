import { NextResponse } from "next/server";
import { EXTERNAL_APIS, TOMESTONE_API_KEY } from '@/lib/constants';

// Tomestone.gg API response structures based on api-docs.json
// Updated to reflect the /profile endpoint response
interface TomestoneProfileCharacter {
  id: string;
  name: string;
  server: string;
  avatar: string;
  achievement_points: number; // Total achievement points
  achievements_completed: number; // Total achievements completed
  // Note: The /profile endpoint does NOT return an array of individual completed achievements.
  // We will have to mock this part.
}

interface TomestoneProfileResponse {
  character: TomestoneProfileCharacter;
  // Other profile data might be here, but we only care about 'character' for now.
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

  try {
    // Directly use the /character/profile endpoint
    const profileUrl = `${EXTERNAL_APIS.TOMESTONE_BASE}/character/profile/${encodeURIComponent(serverParam)}/${encodeURIComponent(nameParam)}`;
    
    console.log(`[Tomestone API] Calling profile endpoint: ${profileUrl}`);
    
    const profileResponse = await fetchWithTimeout(profileUrl, {
      headers: {
        'Authorization': `Bearer ${TOMESTONE_API_KEY}`,
        'User-Agent': `Eorzean-Compass/1.0 (${process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.netlify.app'})`,
        'Accept': 'application/json',
        'Referer': process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.netlify.app'
      }
    }, 15000); // Increased timeout slightly

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

    const character = tomestoneProfileData.character;

    // IMPORTANT: The /profile endpoint does not provide individual completed achievement IDs.
    // We must generate mock data for completedAchievements.
    const mockCompletedAchievements = generateMockCharacterData(nameParam, serverParam).completedAchievements;
    console.warn("[Tomestone API] Using mock completed achievements as /profile endpoint does not provide them.");

    const data = {
      character: {
        id: character.id,
        name: character.name,
        server: character.server,
        avatar: character.avatar || "/placeholder.svg?height=96&width=96&text=Avatar",
        achievementPoints: character.achievement_points || 0,
        achievementsCompleted: character.achievements_completed || 0,
        totalAchievements: 2500, // Placeholder/Estimate as total not in this specific doc
      },
      completedAchievements: mockCompletedAchievements, // Always mock this part
      _isRealData: true,
      _error: "Note: Completed achievement list is mocked as Tomestone.gg /profile endpoint does not provide it."
    };

    console.log(`[Tomestone API] Successfully fetched REAL character profile from Tomestone.gg:`, {
      name: data.character.name,
      achievementPoints: data.character.achievementPoints,
      achievementsCompleted: data.character.achievementsCompleted,
      // Note: completedAchievements will be mock data
    });

    return NextResponse.json(data);

  } catch (apiError) {
    console.error("[Tomestone API Error] Tomestone.gg API call failed, falling back to mock data:", apiError instanceof Error ? apiError.message : apiError);
    
    return NextResponse.json(generateMockCharacterData(nameParam, serverParam, `Tomestone.gg API unavailable: ${apiError instanceof Error ? apiError.message : 'Unknown error'}.`));
  }
}