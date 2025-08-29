import { NextResponse } from "next/server";
import { EXTERNAL_APIS, TOMESTONE_API_KEY } from '@/lib/constants';
import { CompletedAchievement } from '@/lib/types'; // Import the type
import { validateCharacterName, validateServerName, apiRateLimiter, securityHeaders } from '@/lib/security';

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
// This interface is for the /characters/{ID}/achievements/owned endpoint
// Based on user's Postman example, it returns full achievement objects, with 'owned' being rarity.
interface FFXIVCollectOwnedAchievementItem {
  id: number;
  name: string;
  description: string;
  points: number;
  order: number;
  patch: string;
  owned: string; // This is the rarity percentage, e.g., "3.1%"
  icon: string;
  category: { id: number; name: string };
  type: { id: number; name: string };
  reward?: any; // Optional reward field
}

// This endpoint returns a direct array of FFXIVCollectOwnedAchievementItem
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
  
  const completedAchievements: CompletedAchievement[] = []; // Explicitly type the array here
  const totalAchievements = 2500; // Matches the total in generateMockAchievements

  // Generate a consistent set of completed achievements for mock data
  // For demo purposes, let's say achievements with an even ID are completed
  // and some random ones to make it more dynamic.
  const completionCount = Math.floor(totalAchievements * 0.3); // Roughly 30% completion
  const completedIds = new Set<number>();
  while (completedIds.size < completionCount) {
    const randomId = Math.floor(Math.random() * totalAchievements) + 1;
    completedIds.add(randomId);
  }

  completedIds.forEach(id => {
    completedAchievements.push({ id });
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
      achievementPoints: completedAchievements.length * 10, // Mock points
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

  // Use sanitized inputs
  const sanitizedName = nameValidation.isValid ? nameParam.trim() : nameParam;
  const sanitizedServer = serverParam;

  console.log(`[API Character] TOMESTONE_API_KEY status: ${TOMESTONE_API_KEY ? 'Present' : 'Missing'}`);

  let realCharacterData: TomestoneProfileCharacter | null = null;
  let completedAchievementsFromAPI: CompletedAchievement[] = []; // Explicitly type this array
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
          { status: 404, headers }
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

  // --- Step 2: Fetch Completed Achievements from FFXIVCollect (if Lodestone ID obtained) ---
  if (lodestoneId && isRealData) {
    try {
      // Use the '/achievements/owned' endpoint to get the list of completed achievement IDs
      // This endpoint returns full achievement objects, where presence in list means owned.
      const ffxivCollectAchievementsUrl = `${EXTERNAL_APIS.FFXIV_COLLECT_BASE}/characters/${lodestoneId}/achievements/owned`;
      
      console.log(`[API Character] Attempting to fetch owned achievements from FFXIVCollect: ${ffxivCollectAchievementsUrl}`);
      
      const achievementsResponse = await fetchWithTimeout(ffxivCollectAchievementsUrl, {
        headers: {
          'User-Agent': `Eorzean-Compass/1.0 (${process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.netlify.app'})`,
          'Accept': 'application/json',
        }
      }, 15000);

      console.log(`[API Character] FFXIVCollect Owned Achievements fetch completed. Status: ${achievementsResponse.status}`);

      if (!achievementsResponse.ok) {
        const errorBody = await achievementsResponse.text();
        console.error(`[API Character Error] FFXIVCollect Owned Achievements fetch failed: ${achievementsResponse.status} ${achievementsResponse.statusText}. Body: ${errorBody.substring(0, 200)}...`);
        
        if (achievementsResponse.status === 403 || errorBody.includes("private profile")) {
          apiErrorReason = (apiErrorReason ? apiErrorReason + "; " : "") + "Character's achievements are private on Lodestone. Please make them public to view real data.";
        } else {
          throw new Error(`FFXIVCollect owned achievements fetch failed with status ${achievementsResponse.status}`);
        }
      } else {
        const ffxivCollectData: FFXIVCollectCharacterOwnedAchievementsResponse = await achievementsResponse.json();
        console.log(`[API Character] Raw FFXIVCollect owned achievements data received (count: ${ffxivCollectData.length}, first 5 data entries): ${JSON.stringify(ffxivCollectData.slice(0,5), null, 2)}`);

        if (Array.isArray(ffxivCollectData) && ffxivCollectData.every(item => typeof item === 'object' && item !== null && 'id' in item)) {
          // Map to CompletedAchievement, only including the ID
          completedAchievementsFromAPI = ffxivCollectData.map(item => ({
            id: item.id,
          }));
          console.log(`[API Character] Successfully parsed ${completedAchievementsFromAPI.length} real completed achievements from FFXIVCollect (no dates).`);
        } else {
          console.warn("[API Character] FFXIVCollect Owned Achievements data is not a valid array of results. Will use mock completed achievements.");
          apiErrorReason = (apiErrorReason ? apiErrorReason + "; " : "") + "FFXIVCollect did not return a valid owned achievements list.";
        }
      }

    } catch (ffxivCollectError) {
      console.error("[API Character Error] FFXIVCollect owned achievements API call failed:", ffxivCollectError instanceof Error ? ffxivCollectError.message : ffxivCollectError);
      apiErrorReason = (apiErrorReason ? apiErrorReason + "; " : "") + `FFXIVCollect unavailable for owned achievements: ${ffxivCollectError instanceof Error ? ffxivCollectError.message : 'Unknown error'}.`;
    }
  } else {
    console.warn("[API Character] Skipping FFXIVCollect owned achievements call because Tomestone.gg profile fetch failed or Lodestone ID is missing.");
  }

  // --- Final Data Construction ---
  let finalCharacterData;
  let finalCompletedAchievements: CompletedAchievement[] = []; // Explicitly type this array
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
      // Use the count from FFXIVCollect if available, otherwise Tomestone's unrankedPoints, then 0
      achievementsCompleted: completedAchievementsFromAPI.length > 0 
        ? completedAchievementsFromAPI.length 
        : (realCharacterData.achievementPoints?.unrankedPoints || 0),
      totalAchievements: 2500, // Placeholder/Estimate
      lastUpdated: now,
    };
    
    // If FFXIVCollect owned achievements failed or were private, use mock completed achievements
    // Otherwise, use the data fetched from FFXIVCollect
    if (apiErrorReason?.includes("private profile") || completedAchievementsFromAPI.length === 0) {
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