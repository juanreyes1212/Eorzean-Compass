import { NextResponse } from "next/server";
import { EXTERNAL_APIS, TOMESTONE_API_KEY } from '@/lib/constants'; // Import TOMESTONE_API_KEY

// Assuming Tomestone.gg API response structures
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
    // Tomestone.gg might provide more fields, but we'll stick to what's needed
  };
  achievements: Array<{
    id: number;
    date: string; // Assuming ISO string date
  }>;
  // Tomestone.gg might provide total achievement points or counts,
  // but we'll calculate/estimate if not directly available.
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
      achievementPoints: completedAchievements.length * 10, // Estimate
      achievementsCompleted: completedAchievements.length,
      totalAchievements,
    },
    completedAchievements,
    _isMockData: true,
    _error: "Using demo data - Tomestone.gg API may be temporarily unavailable or rate-limited."
  };
}

export async function POST(request: Request) {
  let requestBody: any = {};
  
  try {
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

    console.log(`Searching for character: ${name} on ${server} using Tomestone.gg`);

    // Check for API Key
    if (!TOMESTONE_API_KEY) {
      console.error("TOMESTONE_API_KEY is not set. Cannot call Tomestone.gg API.");
      const mockData = generateMockCharacterData(name, server);
      return NextResponse.json({
        ...mockData,
        _error: "Tomestone.gg API key is missing. Showing demo data.",
      });
    }

    try {
      // Step 1: Search for character to get ID from Tomestone.gg
      const searchUrl = `${EXTERNAL_APIS.TOMESTONE_BASE}/character/search?name=${encodeURIComponent(name)}&server=${encodeURIComponent(server)}`;
      
      console.log(`Calling Tomestone.gg search: ${searchUrl}`);
      
      const searchResponse = await fetchWithTimeout(searchUrl, {
        headers: {
          'Authorization': `Bearer ${TOMESTONE_API_KEY}`,
          'User-Agent': `Eorzean-Compass/1.0 (${process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.vercel.app'})`,
          'Accept': 'application/json',
          'Referer': process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.vercel.app'
        }
      }, 10000);

      if (!searchResponse.ok) {
        console.warn(`Tomestone.gg search failed: ${searchResponse.status} ${searchResponse.statusText}`);
        throw new Error(`Tomestone.gg search failed with status ${searchResponse.status}`);
      }

      const searchResponseText = await searchResponse.text();
      let searchData: TomestoneCharacterSearchResult;
      
      try {
        searchData = JSON.parse(searchResponseText);
      } catch (parseError) {
        console.warn("Failed to parse Tomestone.gg search response as JSON:", parseError);
        throw new Error("Invalid JSON response from Tomestone.gg search");
      }
      
      if (!searchData.characters || !Array.isArray(searchData.characters) || searchData.characters.length === 0) {
        return NextResponse.json(
          { error: "Character not found. Please check the name and server spelling." },
          { status: 404 }
        );
      }

      const character = searchData.characters.find(
        char => char.name.toLowerCase() === name.toLowerCase() && 
                 char.server.toLowerCase() === server.toLowerCase()
      ) || searchData.characters[0];

      if (!character.id) {
        throw new Error("Invalid character data from Tomestone.gg");
      }

      console.log(`Found character: ${character.name} (ID: ${character.id})`);

      // Step 2: Fetch character's achievement data from Tomestone.gg
      const characterUrl = `${EXTERNAL_APIS.TOMESTONE_BASE}/character/${character.id}?data=achievements`;
      
      console.log(`Calling Tomestone.gg character data: ${characterUrl}`);
      
      const characterResponse = await fetchWithTimeout(characterUrl, {
        headers: {
          'Authorization': `Bearer ${TOMESTONE_API_KEY}`,
          'User-Agent': `Eorzean-Compass/1.0 (${process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.vercel.app'})`,
          'Accept': 'application/json',
          'Referer': process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.vercel.app'
        }
      }, 15000);

      if (!characterResponse.ok) {
        console.warn(`Tomestone.gg character fetch failed: ${characterResponse.status} ${characterResponse.statusText}`);
        throw new Error(`Tomestone.gg character fetch failed with status ${characterResponse.status}`);
      }

      const characterResponseText = await characterResponse.text();
      let tomestoneCharacterData: TomestoneCharacterData;
      
      try {
        tomestoneCharacterData = JSON.parse(characterResponseText);
      } catch (parseError) {
        console.warn("Failed to parse Tomestone.gg character response as JSON:", parseError);
        throw new Error("Invalid JSON response from Tomestone.gg character endpoint");
      }
      
      const completedAchievements = (tomestoneCharacterData.achievements || [])
        .filter(achievement => achievement.id && achievement.date)
        .map(achievement => ({
          id: achievement.id,
          completionDate: new Date(achievement.date).toISOString()
        }));

      // Tomestone.gg might provide total achievement points/counts directly.
      // If not, we'll use a placeholder or estimate.
      const achievementPoints = completedAchievements.length * 10; // Placeholder/Estimate
      const totalAchievements = 2500; // Placeholder/Estimate

      const data = {
        character: {
          id: character.id,
          name: character.name,
          server: character.server,
          avatar: character.avatar || "/placeholder.svg?height=96&width=96&text=Avatar",
          achievementPoints,
          achievementsCompleted: completedAchievements.length,
          totalAchievements,
        },
        completedAchievements,
        _isRealData: true,
      };

      console.log(`Successfully fetched REAL character data from Tomestone.gg:`, {
        name: data.character.name,
        completedCount: data.completedAchievements?.length || 0,
        sampleCompletedIds: data.completedAchievements?.slice(0, 10).map(a => a.id) || []
      });

      return NextResponse.json(data);

    } catch (apiError) {
      console.warn("Tomestone.gg API failed, falling back to mock data:", apiError);
      
      const mockData = generateMockCharacterData(name, server);
      
      return NextResponse.json({
        ...mockData,
        _error: `Tomestone.gg API unavailable: ${apiError instanceof Error ? apiError.message : 'Unknown error'}. Showing demo data.`
      });
    }

  } catch (error) {
    console.error("Unexpected error processing character request:", error);
    
    if (requestBody.name && requestBody.server) {
      console.log("Generating fallback mock data due to unexpected error");
      const mockData = generateMockCharacterData(requestBody.name, requestBody.server);
      return NextResponse.json({
        ...mockData,
        _error: "Internal server error, showing demo data",
      });
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}