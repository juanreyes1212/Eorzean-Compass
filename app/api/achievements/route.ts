import { NextResponse } from "next/server";
import { calculateTSRGScore } from '@/lib/tsrg-matrix';
import { EXTERNAL_APIS } from '@/lib/constants';
import { securityHeaders } from '@/lib/security';

// FFXIVCollect achievement structure from owned/missing endpoints
interface FFXIVCollectAchievement {
  id: number;
  name: string;
  description: string;
  points: number;
  order: number;
  patch: string;
  owned: string; // Rarity percentage as string
  icon: string;
  category: { id: number; name: string };
  type: { id: number; name: string };
  reward?: any;
}

// Cache for achievements data (without character-specific completion status)
let achievementsCache: any[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

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

// Build master achievement list from owned + missing endpoints
async function buildAchievementListFromOwnedMissing(lodestoneId: number): Promise<{
  allAchievements: any[];
  ownedCount: number;
  missingCount: number;
}> {
  console.log(`[Achievements API] Building achievement list from owned/missing for Lodestone ID: ${lodestoneId}`);
  
  const allAchievements: FFXIVCollectAchievement[] = [];
  let ownedCount = 0;
  let missingCount = 0;

  try {
    // Fetch owned achievements
    const ownedUrl = `${EXTERNAL_APIS.FFXIV_COLLECT_BASE}/characters/${lodestoneId}/achievements/owned`;
    console.log(`[Achievements API] Fetching owned from: ${ownedUrl}`);
    
    const ownedResponse = await fetchWithTimeout(ownedUrl, {
      headers: {
        'User-Agent': `Eorzean-Compass/1.0 (${process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.netlify.app'})`,
        'Accept': 'application/json',
      }
    });

    if (ownedResponse.ok) {
      const ownedData = await ownedResponse.json();
      console.log(`[Achievements API] Owned response type:`, typeof ownedData, `Array:`, Array.isArray(ownedData));
      
      if (Array.isArray(ownedData)) {
        ownedData.forEach((achievement: FFXIVCollectAchievement) => {
          if (achievement.id && achievement.name) {
            allAchievements.push(achievement);
            ownedCount++;
          }
        });
        console.log(`[Achievements API] Added ${ownedCount} owned achievements`);
      } else {
        console.warn(`[Achievements API] Owned data is not an array:`, ownedData);
      }
    } else {
      const errorText = await ownedResponse.text();
      console.error(`[Achievements API] Owned achievements failed: ${ownedResponse.status} - ${errorText}`);
      throw new Error(`Failed to fetch owned achievements: ${ownedResponse.status}`);
    }

    // Fetch missing achievements
    const missingUrl = `${EXTERNAL_APIS.FFXIV_COLLECT_BASE}/characters/${lodestoneId}/achievements/missing`;
    console.log(`[Achievements API] Fetching missing from: ${missingUrl}`);
    
    const missingResponse = await fetchWithTimeout(missingUrl, {
      headers: {
        'User-Agent': `Eorzean-Compass/1.0 (${process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.netlify.app'})`,
        'Accept': 'application/json',
      }
    });

    if (missingResponse.ok) {
      const missingData = await missingResponse.json();
      console.log(`[Achievements API] Missing response type:`, typeof missingData, `Array:`, Array.isArray(missingData));
      
      if (Array.isArray(missingData)) {
        missingData.forEach((achievement: FFXIVCollectAchievement) => {
          if (achievement.id && achievement.name) {
            allAchievements.push(achievement);
            missingCount++;
          }
        });
        console.log(`[Achievements API] Added ${missingCount} missing achievements`);
      } else {
        console.warn(`[Achievements API] Missing data is not an array:`, missingData);
      }
    } else {
      const errorText = await missingResponse.text();
      console.error(`[Achievements API] Missing achievements failed: ${missingResponse.status} - ${errorText}`);
      throw new Error(`Failed to fetch missing achievements: ${missingResponse.status}`);
    }

  } catch (error) {
    console.error("[Achievements API] Error building achievement list:", error);
    throw error;
  }

  console.log(`[Achievements API] Built complete list: ${allAchievements.length} total (${ownedCount} owned, ${missingCount} missing)`);
  
  return {
    allAchievements,
    ownedCount,
    missingCount
  };
}

// Fallback to general achievements list if character-specific fails
async function fetchGeneralAchievementsList(): Promise<any[]> {
  console.log("[Achievements API] Fetching general achievements list as fallback...");
  
  // Check cache first for general list
  const now = Date.now();
  if (achievementsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log("[Achievements API] Using cached general achievements list");
    return achievementsCache;
  }

  let allAchievements: FFXIVCollectAchievement[] = [];
  let page = 1;
  const limit = 100;

  try {
    while (true) {
      const offset = (page - 1) * limit;
      const url = `${EXTERNAL_APIS.FFXIV_COLLECT_BASE}/achievements?limit=${limit}&offset=${offset}`;
      
      console.log(`[Achievements API] Fetching general page ${page} (offset: ${offset})...`);
      
      const response = await fetchWithTimeout(url, {
        headers: {
          'User-Agent': `Eorzean-Compass/1.0 (${process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.netlify.app'})`,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`FFXIVCollect HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.results || !Array.isArray(data.results) || data.results.length === 0) {
        console.log("[Achievements API] Reached end of general achievements data");
        break;
      }

      allAchievements = allAchievements.concat(data.results);
      console.log(`[Achievements API] General fetch page ${page}, total: ${allAchievements.length}`);
      
      if (data.results.length < limit) break;
      
      page++;
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (page > 50) break; // Safety limit
    }

    // Cache the general list
    achievementsCache = allAchievements;
    cacheTimestamp = now;
    
    console.log(`[Achievements API] Cached ${allAchievements.length} general achievements`);
    return allAchievements;

  } catch (error) {
    console.error("[Achievements API] General achievements fetch failed:", error);
    throw error;
  }
}

// Process FFXIVCollect achievement into our format
function processFFXIVCollectAchievement(achievement: FFXIVCollectAchievement, isCompleted: boolean): any {
  const categoryName = achievement.category?.name || 'Unknown';
  const typeName = achievement.type?.name || 'Unknown';
  
  // Determine if obtainable based on category and type
  const isObtainable = !categoryName.toLowerCase().includes('legacy') && 
                       !categoryName.toLowerCase().includes('seasonal') &&
                       !categoryName.toLowerCase().includes('discontinued') &&
                       !typeName.toLowerCase().includes('legacy');

  const processed = {
    id: achievement.id,
    name: achievement.name || 'Unknown Achievement',
    description: achievement.description || 'No description available',
    category: categoryName,
    points: Math.max(0, achievement.points || 0),
    patch: achievement.patch || 'Unknown',
    isObtainable,
    isCompleted,
    icon: achievement.icon || null,
    rarity: achievement.owned ? parseFloat(achievement.owned.replace('%', '')) : null,
    order: achievement.order || 0
  };

  return {
    ...processed,
    tsrg: calculateTSRGScore(processed)
  };
}

export async function GET(request: Request) {
  const headers = new Headers(securityHeaders);
  
  console.log("[Achievements API] === STARTING ACHIEVEMENTS FETCH ===");
  
  const { searchParams } = new URL(request.url);
  const lodestoneIdParam = searchParams.get('lodestoneId');
  const lodestoneId = lodestoneIdParam ? Number(lodestoneIdParam) : null;
  
  console.log(`[Achievements API] Lodestone ID: ${lodestoneId}`);

  try {
    let processedAchievements: any[] = [];

    if (lodestoneId) {
      console.log(`[Achievements API] Using character-specific approach with Lodestone ID: ${lodestoneId}`);
      
      try {
        // Build list from owned + missing endpoints
        const { allAchievements, ownedCount, missingCount } = await buildAchievementListFromOwnedMissing(lodestoneId);
        
        console.log(`[Achievements API] Processing ${allAchievements.length} achievements (${ownedCount} owned, ${missingCount} missing)`);
        
        // Process achievements with completion status
        processedAchievements = allAchievements.map((achievement, index) => {
          // First ownedCount achievements are completed, rest are not
          const isCompleted = index < ownedCount;
          return processFFXIVCollectAchievement(achievement, isCompleted);
        });

        console.log(`[Achievements API] Character-specific processing complete: ${processedAchievements.length} achievements`);
        const completedInProcessed = processedAchievements.filter(a => a.isCompleted).length;
        console.log(`[Achievements API] Marked as completed: ${completedInProcessed}`);

      } catch (characterError) {
        console.warn(`[Achievements API] Character-specific fetch failed, falling back to general list:`, characterError);
        
        // Fallback to general list without completion status
        const generalAchievements = await fetchGeneralAchievementsList();
        processedAchievements = generalAchievements.map(achievement => 
          processFFXIVCollectAchievement(achievement, false)
        );
        
        console.log(`[Achievements API] Fallback processing complete: ${processedAchievements.length} achievements (no completion status)`);
      }

    } else {
      console.log(`[Achievements API] No Lodestone ID provided, using general achievements list`);
      
      // No character specified, get general list
      const generalAchievements = await fetchGeneralAchievementsList();
      processedAchievements = generalAchievements.map(achievement => 
        processFFXIVCollectAchievement(achievement, false)
      );
      
      console.log(`[Achievements API] General processing complete: ${processedAchievements.length} achievements`);
    }

    // Final validation and sorting
    const validAchievements = processedAchievements
      .filter(achievement => achievement.id && achievement.name)
      .sort((a, b) => a.order - b.order); // Sort by order for consistent display

    const finalCompletedCount = validAchievements.filter(a => a.isCompleted).length;
    console.log(`[Achievements API] === FINAL RESULT ===`);
    console.log(`[Achievements API] Total achievements: ${validAchievements.length}`);
    console.log(`[Achievements API] Completed achievements: ${finalCompletedCount}`);
    console.log(`[Achievements API] Completion rate: ${validAchievements.length > 0 ? Math.round((finalCompletedCount / validAchievements.length) * 100) : 0}%`);
    
    if (finalCompletedCount > 0) {
      console.log(`[Achievements API] Sample completed:`, 
        validAchievements.filter(a => a.isCompleted).slice(0, 5).map(a => ({ id: a.id, name: a.name }))
      );
    }

    return NextResponse.json(validAchievements, { headers });

  } catch (error) {
    console.error("[Achievements API] Complete failure:", error);
    
    return NextResponse.json(
      { 
        error: `Failed to fetch achievements: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: "Unable to fetch from FFXIVCollect API"
      },
      { status: 500, headers }
    );
  }
}