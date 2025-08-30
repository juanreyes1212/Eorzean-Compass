import { NextResponse } from "next/server";
import { calculateTSRGScore } from '@/lib/tsrg-matrix';
import { EXTERNAL_APIS } from '@/lib/constants';
import { securityHeaders } from '@/lib/security';

// FFXIVCollect API response structures
interface FFXIVCollectAchievement {
  id: number;
  name: string;
  description: string;
  points: number;
  category: { id: number; name: string };
  type: { id: number; name: string };
  patch: string;
  icon: string;
  owned: string; // Rarity percentage as string
  order: number;
}

interface FFXIVCollectResponse {
  results: FFXIVCollectAchievement[];
  total: number;
}

// Cache for achievements data
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

// Fetch all achievements from FFXIVCollect (master list)
async function fetchAllAchievementsFromFFXIVCollect(): Promise<any[]> {
  console.log("[Achievements API] Starting FFXIVCollect fetch for all achievements...");
  
  let allAchievements: FFXIVCollectAchievement[] = [];
  let page = 1;
  const limit = 100; // FFXIVCollect supports higher limits
  let totalAchievementsCount = 0;

  while (true) {
    const offset = (page - 1) * limit;
    const url = `${EXTERNAL_APIS.FFXIV_COLLECT_BASE}/achievements?limit=${limit}&offset=${offset}`;
    
    try {
      console.log(`[Achievements API] Fetching FFXIVCollect page ${page} (offset: ${offset})...`);
      
      const response = await fetchWithTimeout(url, {
        headers: {
          'User-Agent': `Eorzean-Compass/1.0 (${process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.netlify.app'})`,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`FFXIVCollect HTTP ${response.status}: ${response.statusText} - ${errorBody}`);
      }

      const data: FFXIVCollectResponse = await response.json();

      if (!data.results || !Array.isArray(data.results)) {
        console.error(`[Achievements API] Invalid data structure from FFXIVCollect for page ${page}.`);
        break;
      }

      if (page === 1) {
        totalAchievementsCount = data.total;
        console.log(`[Achievements API] FFXIVCollect reported total achievements: ${totalAchievementsCount}`);
      }

      allAchievements = allAchievements.concat(data.results);
      console.log(`[Achievements API] Fetched FFXIVCollect page ${page}, total so far: ${allAchievements.length}/${totalAchievementsCount}`);
      
      // Stop if we've fetched all available achievements or reached a reasonable limit
      if (data.results.length < limit || allAchievements.length >= totalAchievementsCount) {
        console.log("[Achievements API] Reached end of FFXIVCollect achievements data.");
        break;
      }
      
      page++;
      
      // Small delay to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Safety limit to prevent infinite loops
      if (page > 50) {
        console.log("[Achievements API] Reached safety limit of 50 pages.");
        break;
      }
    } catch (error) {
      console.error(`[Achievements API] FFXIVCollect fetch failed for page ${page}:`, error instanceof Error ? error.message : error);
      
      // If we have some achievements, continue with what we have
      if (allAchievements.length > 0) {
        console.log(`[Achievements API] Continuing with ${allAchievements.length} achievements from FFXIVCollect despite error.`);
        break;
      }
      
      throw error; // Re-throw if we have no achievements at all
    }
  }

  if (allAchievements.length === 0) {
    throw new Error("No achievements were fetched from FFXIVCollect.");
  }

  console.log(`[Achievements API] Successfully fetched ${allAchievements.length} achievements from FFXIVCollect.`);
  
  // Process FFXIVCollect achievements into our format
  return allAchievements.map(achievement => {
    const categoryName = achievement.category?.name || 'Unknown';
    const isObtainable = !categoryName.toLowerCase().includes('legacy') && 
                         !categoryName.toLowerCase().includes('seasonal') &&
                         !categoryName.toLowerCase().includes('discontinued');
    
    return {
      id: achievement.id,
      name: achievement.name || 'Unknown Achievement',
      description: achievement.description || 'No description available',
      category: categoryName,
      points: Math.max(0, achievement.points || 0),
      patch: achievement.patch || 'Unknown',
      isObtainable,
      icon: achievement.icon || null,
      rarity: achievement.owned ? parseFloat(achievement.owned) : null,
      order: achievement.order || 0
    };
  });
}

// Fetch completion status from FFXIVCollect using Lodestone ID
async function fetchCompletionStatusFromFFXIVCollect(lodestoneId: number): Promise<{
  ownedIds: Set<number>;
  missingIds: Set<number>;
}> {
  console.log(`[Achievements API] Fetching completion status from FFXIVCollect for Lodestone ID: ${lodestoneId}`);
  
  try {
    // Fetch owned achievements first
    const ownedUrl = `${EXTERNAL_APIS.FFXIV_COLLECT_BASE}/characters/${lodestoneId}/achievements/owned`;
    console.log(`[Achievements API] Fetching owned from: ${ownedUrl}`);
    
    const ownedResponse = await fetchWithTimeout(ownedUrl, {
      headers: {
        'User-Agent': `Eorzean-Compass/1.0 (${process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.netlify.app'})`,
        'Accept': 'application/json',
      }
    });

    console.log(`[Achievements API] Owned response status: ${ownedResponse.status}`);

    let ownedIds = new Set<number>();
    let missingIds = new Set<number>();

    // Process owned achievements
    if (ownedResponse.ok) {
      const ownedData = await ownedResponse.json();
      console.log(`[Achievements API] Owned data type:`, typeof ownedData, `Array:`, Array.isArray(ownedData));
      
      if (Array.isArray(ownedData)) {
        ownedIds = new Set(ownedData.map((achievement: any) => {
          const id = Number(achievement.id || achievement.achievement_id || achievement);
          return id;
        }));
        console.log(`[Achievements API] Found ${ownedIds.size} owned achievements`);
        console.log(`[Achievements API] Sample owned IDs:`, Array.from(ownedIds).slice(0, 10));
      } else {
        console.warn(`[Achievements API] Owned data is not an array:`, ownedData);
      }
    } else {
      const errorText = await ownedResponse.text();
      console.warn(`[Achievements API] Owned achievements request failed: ${ownedResponse.status} - ${errorText}`);
    }

    // Fetch missing achievements for completeness
    const missingUrl = `${EXTERNAL_APIS.FFXIV_COLLECT_BASE}/characters/${lodestoneId}/achievements/missing`;
    console.log(`[Achievements API] Fetching missing from: ${missingUrl}`);
    
    const missingResponse = await fetchWithTimeout(missingUrl, {
      headers: {
        'User-Agent': `Eorzean-Compass/1.0 (${process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.netlify.app'})`,
        'Accept': 'application/json',
      }
    });

    console.log(`[Achievements API] Missing response status: ${missingResponse.status}`);
    
    if (missingResponse.ok) {
      const missingData = await missingResponse.json();
      console.log(`[Achievements API] Missing data type:`, typeof missingData, `Array:`, Array.isArray(missingData));
      
      if (Array.isArray(missingData)) {
        missingIds = new Set(missingData.map((achievement: any) => {
          const id = Number(achievement.id || achievement.achievement_id || achievement);
          return id;
        }));
        console.log(`[Achievements API] Found ${missingIds.size} missing achievements`);
      } else {
        console.warn(`[Achievements API] Missing data is not an array:`, missingData);
      }
    } else {
      const errorText = await missingResponse.text();
      console.warn(`[Achievements API] Missing achievements request failed: ${missingResponse.status} - ${errorText}`);
    }

    console.log(`[Achievements API] Completion status: ${ownedIds.size} owned, ${missingIds.size} missing`);
    return { ownedIds, missingIds };

  } catch (error) {
    console.error("[Achievements API] FFXIVCollect completion status fetch failed:", error);
    throw error;
  }
}

// Generate mock achievements as fallback
function generateMockAchievements(): any[] {
  console.log("[Achievements API] Generating mock achievements as fallback...");
  
  const categories = ["Battle", "Character", "Items", "Crafting & Gathering", "Quests", "Exploration", "PvP", "Grand Company", "Legacy"];
  const achievements = [];
  
  for (let i = 1; i <= 2500; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const isObtainable = category !== "Legacy" && Math.random() > 0.05;
    
    achievements.push({
      id: i,
      name: `Mock Achievement ${i}`,
      description: `This is a mock achievement for testing purposes. Category: ${category}`,
      category,
      points: Math.floor(Math.random() * 15) * 5,
      patch: `${Math.floor(Math.random() * 6) + 1}.${Math.floor(Math.random() * 5)}`,
      isObtainable,
      icon: `/images/achievements/061000/061${String(i).padStart(3, '0')}.png`,
      rarity: Math.random() * 100,
      order: i
    });
  }
  
  console.log(`[Achievements API] Generated ${achievements.length} mock achievements.`);
  return achievements;
}

export async function GET(request: Request) {
  // Add security headers
  const headers = new Headers(securityHeaders);
  
  console.log("[Achievements API] Starting achievements fetch...");
  
  // Get lodestoneId from query params (passed from character API)
  const { searchParams } = new URL(request.url);
  const lodestoneIdParam = searchParams.get('lodestoneId');
  const lodestoneId = lodestoneIdParam ? Number(lodestoneIdParam) : null;
  
  console.log(`[Achievements API] Lodestone ID: ${lodestoneId}`);
  
  // Check cache first
  const now = Date.now();
  if (achievementsCache && (now - cacheTimestamp) < CACHE_DURATION && !lodestoneId) {
    console.log("[Achievements API] Returning cached achievements data.");
    return NextResponse.json(achievementsCache, { headers });
  }

  let processedAchievements: any[] = [];
  let completionStatus: { ownedIds: Set<number>; missingIds: Set<number> } | null = null;

  try {
    console.log("[Achievements API] Fetching master achievement list from FFXIVCollect...");
    processedAchievements = await fetchAllAchievementsFromFFXIVCollect();
    
    console.log(`[Achievements API] FFXIVCollect returned ${processedAchievements.length} achievements`);
    
    // If we have a lodestone ID, get completion status
    if (lodestoneId) {
      console.log(`[Achievements API] Fetching completion status for Lodestone ID: ${lodestoneId}`);
      completionStatus = await fetchCompletionStatusFromFFXIVCollect(lodestoneId);
      console.log(`[Achievements API] Got completion status: ${completionStatus.ownedIds.size} owned, ${completionStatus.missingIds.size} missing`);
    }
    
  } catch (ffxivCollectError) {
    console.error("[Achievements API] FFXIVCollect failed:", ffxivCollectError);
    
    // Return error instead of mock data to surface the real issue
    return NextResponse.json(
      { error: `Failed to fetch achievements: ${ffxivCollectError instanceof Error ? ffxivCollectError.message : 'Unknown error'}` },
      { status: 500, headers }
    );
  }

  console.log(`[Achievements API] Processing ${processedAchievements.length} achievements for TSR-G scoring...`);

  // Add TSR-G scores and completion status
  const achievementsWithTSRG = processedAchievements
    .filter(achievement => achievement.id && achievement.name)
    .map(achievement => {
      const isCompleted = completionStatus ? completionStatus.ownedIds.has(Number(achievement.id)) : false;
      
      if (isCompleted) {
        console.log(`[Achievements API] Marking achievement ${achievement.id} (${achievement.name}) as completed`);
      }
      
      return {
        ...achievement,
        isCompleted,
        tsrg: calculateTSRGScore(achievement),
      };
    });

  const completedCount = achievementsWithTSRG.filter(a => a.isCompleted).length;
  console.log(`[Achievements API] Final achievements with TSR-G: ${achievementsWithTSRG.length}, completed: ${completedCount}`);
  
  if (completedCount > 0) {
    console.log(`[Achievements API] Sample completed achievements:`, 
      achievementsWithTSRG.filter(a => a.isCompleted).slice(0, 5).map(a => ({ id: a.id, name: a.name }))
    );
  }

  // Only cache if we don't have character-specific completion data
  if (!lodestoneId) {
    achievementsCache = processedAchievements.map(achievement => ({
      ...achievement,
      tsrg: calculateTSRGScore(achievement),
    }));
    cacheTimestamp = now;
  }
  
  console.log(`[Achievements API] Final result: ${achievementsWithTSRG.length} achievements with ${completedCount} completed.`);

  return NextResponse.json(achievementsWithTSRG, { headers });
}