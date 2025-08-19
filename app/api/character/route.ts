import { NextResponse } from "next/server";
import { EXTERNAL_APIS, TOMESTONE_API_KEY } from '@/lib/constants';

// Tomestone.gg API response structures based on api-docs.json
interface TomestoneCharacterSearchResult {
  characters: Array<{
    id: string;
    name: string;
    server: string;
    avatar: string;
  }>;
}

interface TomestoneCharacterData {
  character: {
    id: string;
    name: string;
    server: string;
    avatar: string;
    // The docs show 'achievement_points' and 'achievements_completed' directly on character
    achievement_points?: number;
    achievements_completed?: number;
  };
  // This is the crucial part: does this endpoint actually return an 'achievements' array?
  achievements?: Array<{ // Made optional, as it might not always be present or might be empty
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
function generateMockCharacterData(name: string, server: string) {
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
    _error: "Using demo data - Tomestone.gg API may be temporarily unavailable or rate-limited."
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const server = searchParams.get('server');
    
    console.log(`[API Request] Received request for ${name} on ${server}`);

    if (!name || !server || typeof name !== 'string' || typeof server !== 'string') {
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
    
    if (!validServers.includes(server)) {
      console.error(`[API Error] Invalid server name provided: ${server}`);
      return NextResponse.json(
        { error: "Invalid server name" },
        { status: 400 }
      );
    }

    console.log(`[Tomestone API] Attempting to fetch real data for: ${name} on ${server}`);

    if (!TOMESTONE_API_KEY) {
      console.warn("[Tomestone API] TOMESTONE_API_KEY is not set. Falling back to mock data.");
      const mockData = generateMockCharacterData(name, server);
      return NextResponse.json({
        ...mockData,
        _error: "Tomestone.gg API key is missing. Showing demo data.",
      });
    }
    
    // Log API key presence (without logging the key itself)
    console.log(`[Tomestone API] API Key status: ${TOMESTONE_API_KEY ? 'Present' : 'Missing'}`);


    try {
      // Step 1: Search for character to get ID from Tomestone.gg
      const searchUrl = `${EXTERNAL_APIS.TOMESTONE_BASE}/character/search?name=${encodeURIComponent(name)}&server=${encodeURIComponent(server)}`;
      
      console.log(`[Tomestone API] Calling search endpoint: ${searchUrl}`);
      
      const searchResponse = await fetchWithTimeout(searchUrl, {
        headers: {
          'Authorization': `Bearer ${TOMESTONE_API_KEY}`,
          'User-Agent': `Eorzean-Compass/1.0 (https://eorzean-compass.netlify.app)`,
          'Accept': 'application/json',
          'Referer': process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.netlify.app'
        }
      }, 10000);

      console.log(`[Tomestone API] Search response status: ${searchResponse.status}`);

      if (!searchResponse.ok) {
        const errorBody = await searchResponse.text();
        console.error(`[Tomestone API Error] Search failed: ${searchResponse.status} ${searchResponse.statusText}. Body: ${errorBody}`);
        throw new Error(`Tomestone.gg search failed with status ${searchResponse.status}`);
      }

      const searchData: TomestoneCharacterSearchResult = await searchResponse.json();
      console.log(`[Tomestone API] Search data received: ${JSON.stringify(searchData, null, 2)}`);
      
      if (!searchData.characters || !Array.isArray(searchData.characters) || searchData.characters.length === 0) {
        console.warn(`[Tomestone API] Search returned no characters for ${name} on ${server}.`);
        return NextResponse.json(
          { error: "Character not found. Please check the name and server spelling." },
          { status: 404 }
        );
      }

      const character = searchData.characters.find(
        char => char.name.toLowerCase() === name.toLowerCase() && 
                 char.server.toLowerCase() === server.toLowerCase()
      ) || searchData.characters[0]; // Fallback to first result if exact match not found

      if (!character.id) {
        console.error("[Tomestone API Error] Search result missing character ID.");
        throw new Error("Invalid character data from Tomestone.gg search result");
      }

      console.log(`[Tomestone API] Found character: ${character.name} (ID: ${character.id})`);

      // Step 2: Fetch character's achievement data from Tomestone.gg using GET /character/{id}
      // Note: The Tomestone.gg API documentation (api-docs.json) indicates that
      // the /character/{id} endpoint with ?data=achievements should return a list of completed achievements.
      // If this is not happening, the API's behavior might have changed or the documentation is incomplete.
      const characterUrl = `${EXTERNAL_APIS.TOMESTONE_BASE}/character/${character.id}?data=achievements`;
      
      console.log(`[Tomestone API] Calling character data endpoint: ${characterUrl}`);
      
      const characterResponse = await fetchWithTimeout(characterUrl, {
        headers: {
          'Authorization': `Bearer ${TOMESTONE_API_KEY}`,
          'User-Agent': `Eorzean-Compass/1.0 (https://eorzean-compass.netlify.app)`,
          'Accept': 'application/json',
          'Referer': process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.netlify.app'
        }
      }, 15000);

      console.log(`[Tomestone API] Character data response status: ${characterResponse.status}`);

      if (!characterResponse.ok) {
        const errorBody = await characterResponse.text();
        console.error(`[Tomestone API Error] Character data fetch failed: ${characterResponse.status} ${characterResponse.statusText}. Body: ${errorBody}`);
        throw new Error(`Tomestone.gg character fetch failed with status ${characterResponse.status}`);
      }

      const tomestoneCharacterData: TomestoneCharacterData = await characterResponse.json();
      console.log(`[Tomestone API] Raw Tomestone character data received: ${JSON.stringify(tomestoneCharacterData, null, 2)}`);
      
      const completedAchievements = (tomestoneCharacterData.achievements || [])
        .filter(achievement => achievement.id && achievement.date)
        .map(achievement => ({
          id: achievement.id,
          completionDate: new Date(achievement.date).toISOString()
        }));

      // Use achievement_points and achievements_completed from the character object if available,
      // otherwise derive from the completedAchievements array.
      const achievementPoints = tomestoneCharacterData.character?.achievement_points || completedAchievements.length * 10;
      const achievementsCompleted = tomestoneCharacterData.character?.achievements_completed || completedAchievements.length;
      const totalAchievements = 2500; // Placeholder/Estimate as total not in this specific doc

      const data = {
        character: {
          id: character.id,
          name: character.name,
          server: character.server,
          avatar: character.avatar || "/placeholder.svg?height=96&width=96&text=Avatar",
          achievementPoints,
          achievementsCompleted,
          totalAchievements,
        },
        completedAchievements,
        _isRealData: true,
      };

      console.log(`[Tomestone API] Successfully fetched REAL character data from Tomestone.gg:`, {
        name: data.character.name,
        completedCount: data.completedAchievements?.length || 0,
        sampleCompletedIds: data.completedAchievements?.slice(0, 10).map(a => a.id) || []
      });

      return NextResponse.json(data);

    } catch (apiError) {
      console.error("[Tomestone API Error] Tomestone.gg API call failed, falling back to mock data:", apiError instanceof Error ? apiError.message : apiError);
      
      const mockData = generateMockCharacterData(name, server);
      
      return NextResponse.json({
        ...mockData,
        _error: `Tomestone.gg API unavailable: ${apiError instanceof Error ? apiError.message : 'Unknown error'}. Showing demo data.`
      });
    }

  } catch (error) {
    console.error("[API Error] Unexpected error processing character request:", error instanceof Error ? error.message : error);
    
    const nameParam = new URL(request.url).searchParams.get('name') || 'Unknown';
    const serverParam = new URL(request.url).searchParams.get('server') || 'Unknown';

    console.log("[MOCK DATA] Generating fallback mock data due to unexpected error.");
    const mockData = generateMockCharacterData(nameParam, serverParam);
    return NextResponse.json({
      ...mockData,
      _error: "Internal server error, showing demo data",
    });
  }
}