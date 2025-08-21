import { NextResponse } from "next/server";
import { EXTERNAL_APIS, TOMESTONE_API_KEY } from '@/lib/constants';

// Tomestone.gg API response structures based on api-docs.json
// Corrected to reflect that the root response is the character object itself
interface TomestoneProfileCharacter {
  id: number; // Changed from string to number
  name: string;
  server: string;
  avatar: string;
  // Corrected to match the nested structure from the logs
  achievementPoints: {
    id: number;
    points: number; // Total achievement points
    unrankedPoints: number; // This appears to be the total achievements completed
    rankPosition: number;
    rankPercent: number;
    cssRankClassName: string;
  } | null; // Made achievementPoints nullable
  // Other fields from the Tomestone.gg response can be added if needed,
  // but for now, we only extract what's necessary for our Character interface.
}

// The Tomestone API directly returns the character object, not { character: CharacterObject }
type TomestoneProfileResponse = TomestoneProfileCharacter;

// FFXIVCollect API response structures for character achievements
// This interface is for the /characters/{ID}/achievements endpoint
interface FFXIVCollectCharacterAchievementItem {
  id: number;
  name: string; // Full achievement data is returned
  description: string;
  points: number;
  category: { id: number; name: string };
  patch: string;
  icon: string;
  owned: boolean; // Indicates if this character owns it
  obtained_at: string | null; // Date obtained, or null if not owned
}

// This endpoint returns a direct array of FFXIVCollectCharacterAchievementItem
type FFXIVCollectCharacterAchievementsResponse = FFXIVCollectCharacterAchievementItem[];


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
      lastUpdated: new Date().toISOString(), // Add lastUpdated for mock data
    },
    completedAchievements,
    _isMockData: true,
    _error: errorReason || "Using demo data - Tomestone.gg API may be temporarily unavailable or rate-limited."
  };
}

export async function GET(request: Request) {
  const nameParam = new URL(request.url).searchParams.get('name');
  const serverParam = new URL(request.url).searchParams.get('server');

  console.log(`[API Character] Received request for ${nameParam} on ${serverParam}`);

  if (!nameParam || !serverParam || typeof nameParam !== 'string' || typeof serverParam !== 'string') {
    console.error("[API Character Error] Missing or invalid name/server parameters.");
    return NextResponse.json(
      { error: "Valid name and server strings are required" },
      { status: 400 }
    );
  }

  const validServers = [
    "Adamantoise", "Cactuar", "Faerie", "Gilgamesh", "Jenova", "Midgardsormr", "Sargatanas", "Siren",
    "Balmung", "Brynhildr", "Coeurl", "Diabolos", "Goblin", "Malboro", "Mateus", "Zalera",
    "Behemoth", "Excalibur", "Exodus", "Famfrit", "Primal", "Lamia", "Leviathan", "Ultros"
  ];
  
  if (!validServers.includes(serverParam)) {
    console.error(`[API Character Error] Invalid server name provided: ${serverParam}`);
    return NextResponse.json(
      { error: "Invalid server name" },
      { status: 400 }
    );
  }

  console.log(`[API Character] TOMESTONE_API_KEY status: ${TOMESTONE_API_KEY ? 'Present' : 'Missing'}`);

  let realCharacterData: TomestoneProfileCharacter | null = null;
  // Change to store the full objects from FFXIVCollect, then filter them
  let ffxivCollectAllCharacterAchievements: FFXIVCollectCharacterAchievementItem[] = [];
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
        // If character not found by Tomestone.gg, return 404 directly
        return NextResponse.json(
          { error: "Character not found. Please check the name and server spelling." },
          { status: 404 }
        );
      }
      throw new Error(`Tomestone.gg profile fetch failed with status ${profileResponse.status}`);
    }

    // Parse the response directly as TomestoneProfileCharacter
    const tomestoneProfileData: TomestoneProfileResponse = await profileResponse.json();
    console.log(`[API Character] Raw Tomestone profile data received: ${JSON.stringify(tomestoneProfileData, null, 2)}`);
    
    // Check if the parsed data has the expected structure, allowing achievementPoints to be null
    if (!tomestoneProfileData || !tomestoneProfileData.id || tomestoneProfileData.achievementPoints === undefined) {
      console.error("[API Character Error] Tomestone.gg profile data missing expected fields (id or achievementPoints property).");
      throw new Error("Invalid character data from Tomestone.gg profile result");
    }

    realCharacterData = tomestoneProfileData; // Assign directly
    lodestoneId = realCharacterData.id; // Extract Lodestone ID
    isRealData = true; // Mark as real data if profile fetch is successful

  } catch (profileError) {
    console.error("[API Character Error] Tomestone.gg profile API call failed:", profileError instanceof Error ? profileError.message : profileError);
    apiErrorReason = `Tomestone.gg API unavailable for profile: ${profileError instanceof Error ? profileError.message : 'Unknown error'}.`;
    isRealData = false; // If profile fetch fails, we cannot proceed with real data
  }

  // --- Step 2: Fetch ALL Achievements for Character from FFXIVCollect (if Lodestone ID obtained) ---
  if (lodestoneId && isRealData) {
    try {
      // Use the '/achievements' endpoint to get all achievements with character-specific ownership status
      const ffxivCollectAchievementsUrl = `${EXTERNAL_APIS.FFXIV_COLLECT_BASE}/characters/${lodestoneId}/achievements`;
      
      console.log(`[API Character] Attempting to fetch ALL achievements for character from FFXIVCollect: ${ffxivCollectAchievementsUrl}`);
      
      const achievementsResponse = await fetchWithTimeout(ffxivCollectAchievementsUrl, {
        headers: {
          'User-Agent': `Eorzean-Compass/1.0 (${process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.netlify.app'})`,
          'Accept': 'application/json',
        }
      }, 15000);

      console.log(`[API Character] FFXIVCollect Character Achievements fetch completed. Status: ${achievementsResponse.status}`);

      if (!achievementsResponse.ok) {
        const errorBody = await achievementsResponse.text();
        console.error(`[API Character Error] FFXIVCollect Character Achievements fetch failed: ${achievementsResponse.status} ${achievementsResponse.statusText}. Body: ${errorBody.substring(0, 200)}...`);
        
        if (achievementsResponse.status === 403 || errorBody.includes("private profile")) {
          apiErrorReason = (apiErrorReason ? apiErrorReason + "; " : "") + "Character's achievements are private on Lodestone. Please make them public to view real data.";
        } else {
          throw new Error(`FFXIVCollect character achievements fetch failed with status ${achievementsResponse.status}`);
        }
      } else {
        const ffxivCollectData: FFXIVCollectCharacterAchievementsResponse = await achievementsResponse.json();
        console.log(`[API Character] Raw FFXIVCollect character achievements data received (count: ${ffxivCollectData.length}, first 5 data entries): ${JSON.stringify(ffxivCollectData.slice(0,5), null, 2)}`);

        if (Array.isArray(ffxivCollectData) && ffxivCollectData.every(item => typeof item === 'object' && item !== null && 'id' in item && 'owned' in item && 'obtained_at' in item)) {
          ffxivCollectAllCharacterAchievements = ffxivCollectData;
          console.log(`[API Character] Successfully parsed ${ffxivCollectAllCharacterAchievements.length} character achievements from FFXIVCollect.`);
        } else {
          console.warn("[API Character] FFXIVCollect Character Achievements data is not a valid array of results. Will use mock completed achievements.");
          apiErrorReason = (apiErrorReason ? apiErrorReason + "; " : "") + "FFXIVCollect did not return a valid character achievements list.";
        }
      }

    } catch (ffxivCollectError) {
      console.error("[API Character Error] FFXIVCollect character achievements API call failed:", ffxivCollectError instanceof Error ? ffxivCollectError.message : ffxivCollectError);
      apiErrorReason = (apiErrorReason ? apiErrorReason + "; " : "") + `FFXIVCollect unavailable for character achievements: ${ffxivCollectError instanceof Error ? ffxivCollectError.message : 'Unknown error'}.`;
    }
  } else {
    console.warn("[API Character] Skipping FFXIVCollect character achievements call because Tomestone.gg profile fetch failed or Lodestone ID is missing.");
  }

  // --- Final Data Construction ---
  let finalCharacterData;
  let finalCompletedAchievements: Array<{ id: number; completionDate: string | null }> = [];
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
      achievementsCompleted: realCharacterData.achievementPoints?.unrankedPoints || 0,
      totalAchievements: 2500, // Placeholder/Estimate
      lastUpdated: now,
    };
    
    // If FFXIVCollect character achievements failed or were private, use mock completed achievements
    // Otherwise, filter the fetched achievements for owned ones
    if (apiErrorReason?.includes("private profile") || ffxivCollectAllCharacterAchievements.length === 0) {
      const mockCompleted = generateMockCharacterData(nameParam, serverParam).completedAchievements;
      finalCompletedAchievements = mockCompleted;
      finalIsMockData = true;
      finalError = apiErrorReason || "Using demo completed achievements due to API issue.";
    } else {
      finalCompletedAchievements = ffxivCollectAllCharacterAchievements
        .filter(item => item.owned && item.obtained_at) // Only include owned achievements with a date
        .map(item => ({
          id: item.id,
          completionDate: item.obtained_at,
        }));
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
  });
}