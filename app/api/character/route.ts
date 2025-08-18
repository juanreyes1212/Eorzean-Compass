import { NextResponse } from "next/server";
import { EXTERNAL_APIS } from '@/lib/constants'; // Import EXTERNAL_APIS

interface XIVAPICharacterSearchResult {
  Results: Array<{
    ID: number;
    Name: string;
    Server: string;
    Avatar: string;
  }>;
}

interface XIVAPICharacterData {
  Character: {
    ID: number;
    Name: string;
    Server: string;
    Avatar: string;
  };
  Achievements: {
    List: Array<{
      ID: number;
      Date: number;
    }>;
  };
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
  // Generate a deterministic ID based on name and server
  let hash = 0;
  const str = (name + server).toLowerCase();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const characterId = Math.abs(hash).toString().padStart(8, '0');
  
  // Generate mock completed achievements (about 40% of 2500)
  const completedAchievements = [];
  const totalAchievements = 2500;
  
  for (let i = 1; i <= totalAchievements; i++) {
    if ((parseInt(characterId) + i) % 10 < 4) { // 40% chance
      completedAchievements.push({
        id: i,
        completionDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  }

  console.log(`Generated mock data for ${name}:`, {
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
    _error: "Using demo data - XIVAPI may be temporarily unavailable"
  };
}

export async function POST(request: Request) {
  let requestBody: any = {};
  
  try {
    // Safely parse the request body
    const bodyText = await request.text();
    if (bodyText) {
      try {
        requestBody = JSON.parse(bodyText);
      } catch (parseError) {
        console.error("Failed to parse request body as JSON:", parseError);
        return NextResponse.json(
          { error: "Invalid JSON in request body" },
          { status: 400 }
        );
      }
    }
    
    const { name, server } = requestBody;
    
    if (!name || !server || typeof name !== 'string' || typeof server !== 'string') {
      return NextResponse.json(
        { error: "Valid name and server strings are required" },
        { status: 400 }
      );
    }

    // Validate server name against known servers
    const validServers = [
      "Adamantoise", "Cactuar", "Faerie", "Gilgamesh", "Jenova", "Midgardsormr", "Sargatanas", "Siren",
      "Balmung", "Brynhildr", "Coeurl", "Diabolos", "Goblin", "Malboro", "Mateus", "Zalera",
      "Behemoth", "Excalibur", "Exodus", "Famfrit", "Hyperion", "Lamia", "Leviathan", "Ultros"
    ];
    
    if (!validServers.includes(server)) {
      return NextResponse.json(
        { error: "Invalid server name" },
        { status: 400 }
      );
    }

    console.log(`Searching for character: ${name} on ${server}`);

    // Try XIVAPI first for ALL characters (not just test ones)
    try {
      // Step 1: Search for character to get Lodestone ID
      const searchUrl = `${EXTERNAL_APIS.XIVAPI_BASE}/character/search?name=${encodeURIComponent(name)}&server=${encodeURIComponent(server)}`;
      
      console.log(`Calling XIVAPI search: ${searchUrl}`);
      
      const searchResponse = await fetchWithTimeout(searchUrl, {
        headers: {
          'User-Agent': `Eorzean-Compass/1.0 (${process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.vercel.app'})`,
          'Accept': 'application/json',
          'Referer': process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.vercel.app'
        }
      }, 10000);

      if (!searchResponse.ok) {
        console.warn(`XIVAPI search failed: ${searchResponse.status} ${searchResponse.statusText}`);
        throw new Error(`XIVAPI search failed with status ${searchResponse.status}`);
      }

      // Safely parse the search response
      const searchResponseText = await searchResponse.text();
      let searchData: XIVAPICharacterSearchResult;
      
      try {
        searchData = JSON.parse(searchResponseText);
      } catch (parseError) {
        console.warn("Failed to parse XIVAPI search response as JSON:", parseError);
        throw new Error("Invalid JSON response from XIVAPI search");
      }
      
      if (!searchData.Results || !Array.isArray(searchData.Results) || searchData.Results.length === 0) {
        return NextResponse.json(
          { error: "Character not found. Please check the name and server spelling." },
          { status: 404 }
        );
      }

      // Find exact match (case-insensitive)
      const character = searchData.Results.find(
        char => char.Name.toLowerCase() === name.toLowerCase() && 
                 char.Server.toLowerCase() === server.toLowerCase()
      ) || searchData.Results[0]; // Fallback to first result

      if (!character.ID) {
        throw new Error("Invalid character data from XIVAPI");
      }

      console.log(`Found character: ${character.Name} (ID: ${character.ID})`);

      // Step 2: Fetch character's achievement data
      const characterUrl = `${EXTERNAL_APIS.XIVAPI_BASE}/character/${character.ID}?data=AC`;
      
      console.log(`Calling XIVAPI character: ${characterUrl}`);
      
      const characterResponse = await fetchWithTimeout(characterUrl, {
        headers: {
          'User-Agent': `Eorzean-Compass/1.0 (${process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.vercel.app'})`,
          'Accept': 'application/json',
          'Referer': process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.vercel.app'
        }
      }, 15000);

      if (!characterResponse.ok) {
        console.warn(`XIVAPI character fetch failed: ${characterResponse.status} ${characterResponse.statusText}`);
        throw new Error(`XIVAPI character fetch failed with status ${characterResponse.status}`);
      }

      // Safely parse the character response
      const characterResponseText = await characterResponse.text();
      let characterData: XIVAPICharacterData;
      
      try {
        characterData = JSON.parse(characterResponseText);
      } catch (parseError) {
        console.warn("Failed to parse XIVAPI character response as JSON:", parseError);
        throw new Error("Invalid JSON response from XIVAPI character endpoint");
      }
      
      // Process completed achievements with validation
      const completedAchievements = (characterData.Achievements?.List || [])
        .filter(achievement => achievement.ID && achievement.Date)
        .map(achievement => ({
          id: achievement.ID,
          completionDate: new Date(achievement.Date * 1000).toISOString()
        }));

      console.log(`Successfully fetched ${completedAchievements.length} completed achievements from XIVAPI for ${character.Name}`);

      // Calculate achievement points (rough estimate - FFXIV doesn't provide exact points via API)
      const achievementPoints = completedAchievements.length * 10;

      const data = {
        character: {
          id: character.ID.toString(),
          name: character.Name,
          server: character.Server,
          avatar: character.Avatar || "/placeholder.svg?height=96&width=96&text=Avatar",
          achievementPoints,
          achievementsCompleted: completedAchievements.length,
          totalAchievements: 2500, // Approximate total
        },
        completedAchievements,
        _isRealData: true, // Flag to indicate this is real data
      };

      console.log(`Successfully fetched REAL character data:`, {
        name: data.character.name,
        completedCount: data.completedAchievements?.length || 0,
        sampleCompletedIds: data.completedAchievements?.slice(0, 10).map(a => a.id) || []
      });

      return NextResponse.json(data);

    } catch (apiError) {
      console.warn("XIVAPI failed, falling back to mock data:", apiError);
      
      // Only fall back to mock data if XIVAPI is completely unavailable
      console.log(`Generating mock data for ${name} on ${server} due to API failure: ${apiError}`);
      const mockData = generateMockCharacterData(name, server);
      
      return NextResponse.json({
        ...mockData,
        _error: `XIVAPI unavailable: ${apiError instanceof Error ? apiError.message : 'Unknown error'}. Showing demo data.`
      });
    }

  } catch (error) {
    console.error("Unexpected error processing character request:", error);
    
    // If all else fails, try to generate mock data with the request body
    if (requestBody.name && requestBody.server) {
      console.log("Generating fallback mock data due to error");
      const mockData = generateMockCharacterData(requestBody.name, requestBody.server);
      return NextResponse.json({
        ...mockData,
        _error: "API temporarily unavailable, showing demo data",
      });
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}