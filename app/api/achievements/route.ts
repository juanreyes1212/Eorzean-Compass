import { NextResponse } from "next/server";
import { calculateTSRGScore } from '@/lib/tsrg-matrix';
import { EXTERNAL_APIS, TOMESTONE_API_KEY } from '@/lib/constants';

// Tomestone.gg API response structures based on api-docs.json
interface TomestoneAchievement {
  id: number;
  name: string;
  description: string;
  points: number;
  category: string; // Tomestone.gg provides category as a string directly
  patch: string;
  icon: string; // Full URL to icon
  rarity?: number; // Rarity is a number
}

interface TomestoneAchievementSearchResult {
  results: TomestoneAchievement[];
  count: number;
}

// FFXIV Collect API response structures
interface FFXIVCollectAchievement {
  id: number;
  name: string;
  description: string;
  points: number;
  category: { name: string }; // FFXIV Collect has category as an object
  patch: string;
  icon: string; // Relative path to icon
  rarity?: number; // Rarity is a number
}

interface FFXIVCollectAchievementSearchResult {
  results: FFXIVCollectAchievement[];
  total: number;
}

// Cache for achievements data with size limit
let achievementsCache: any[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_CACHE_SIZE = 10000; // Maximum number of achievements to cache

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

// Generate mock achievements data with icons
function generateMockAchievements(): any[] {
  const categories = ["Battle", "Character", "Items", "Crafting & Gathering", "Quests", "Exploration", "PvP", "Grand Company"];
  const achievements = [];
  
  for (let i = 1; i <= 2500; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const isObtainable = category !== "Legacy" && Math.random() > 0.05; // 95% obtainable
    
    // Generate a semi-realistic icon path (using FFXIV Collect pattern for mock)
    const iconVariant = String(i).padStart(6, '0');
    const iconPath = `/images/achievements/061000/061${iconVariant.slice(-3)}.png`; // Relative path for mock
    
    achievements.push({
      id: i,
      name: `Achievement ${i}`,
      description: `This is a ${category.toLowerCase()} achievement that tests your skills in FFXIV.`,
      category,
      points: Math.floor(Math.random() * 15) * 5, // Points in multiples of 5, up to 70
      patch: `${Math.floor(Math.random() * 6) + 1}.${Math.floor(Math.random() * 5)}`,
      isObtainable,
      icon: iconPath, // Add icon path
      rarity: Math.random() * 100, // Mock rarity
    });
  }
  
  return achievements;
}

async function fetchAchievementsFromTomestone(): Promise<any[]> {
  console.log("Attempting to fetch achievements from Tomestone.gg API...");
  
  if (!TOMESTONE_API_KEY) {
    throw new Error("TOMESTONE_API_KEY is not set for Tomestone.gg API.");
  }

  let allAchievements: TomestoneAchievement[] = [];
  let page = 1;
  let hasMore = true;
  const maxPages = 50; // Prevent excessive requests
  const maxRetries = 3;

  while (hasMore && page <= maxPages) {
    const url = `${EXTERNAL_APIS.TOMESTONE_BASE}/achievements?page=${page}&limit=100`;
    
    let response: Response | null = null;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        response = await fetchWithTimeout(url, {
          headers: {
            'Authorization': `Bearer ${TOMESTONE_API_KEY}`,
            'User-Agent': `Eorzean-Compass/1.0 (${process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.netlify.app'})`,
            'Accept': 'application/json',
            'Referer': process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.netlify.app'
          }
        });
        
        if (response.ok) {
          break;
        } else if (response.status === 429) {
          const waitTime = Math.pow(2, retryCount) * 2000;
          console.warn(`Tomestone.gg rate limited (page ${page}), waiting ${waitTime}ms before retry ${retryCount + 1}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          const errorBody = await response.text();
          throw new Error(`Tomestone.gg HTTP ${response.status}: ${response.statusText} - ${errorBody}`);
        }
      } catch (error) {
        console.error(`Tomestone.gg fetch attempt ${retryCount + 1} failed for page ${page}:`, error instanceof Error ? error.message : error);
        if (retryCount === maxRetries - 1) {
          throw new Error(`Failed to fetch from Tomestone.gg after ${maxRetries} attempts for page ${page}.`);
        }
        const waitTime = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      retryCount++;
    }

    if (!response || !response.ok) {
      console.warn(`Stopping Tomestone.gg fetch due to persistent errors on page ${page}.`);
      break;
    }

    const data: TomestoneAchievementSearchResult = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      console.error(`Invalid data structure from Tomestone.gg for page ${page}.`);
      break;
    }

    allAchievements = allAchievements.concat(data.results);
    
    console.log(`Fetched Tomestone.gg page ${page}, total achievements so far: ${allAchievements.length}`);
    
    hasMore = data.results.length === 100 && allAchievements.length < MAX_CACHE_SIZE;
    page++;
    
    await new Promise(resolve => setTimeout(resolve, 200)); // Small delay to be polite
  }

  if (allAchievements.length === 0) {
    throw new Error("No achievements were fetched from Tomestone.gg.");
  }

  console.log(`Successfully fetched ${allAchievements.length} achievements from Tomestone.gg.`);
  return allAchievements.map(achievement => {
    const categoryName = achievement.category || 'Unknown';
    const isObtainable = !categoryName.toLowerCase().includes('legacy') && 
                         !categoryName.toLowerCase().includes('seasonal') &&
                         !categoryName.toLowerCase().includes('discontinued') &&
                         !categoryName.toLowerCase().includes('feast');
    return {
      id: achievement.id,
      name: achievement.name || 'Unknown Achievement',
      description: achievement.description || 'No description available',
      category: categoryName,
      points: Math.max(0, achievement.points || 0),
      patch: achievement.patch || 'Unknown',
      isObtainable,
      icon: achievement.icon || null,
      rarity: achievement.rarity || null,
    };
  });
}

async function fetchAchievementsFromFFXIVCollect(): Promise<any[]> {
  console.log("Attempting to fetch achievements from FFXIV Collect API (fallback)...");
  
  let allAchievements: FFXIVCollectAchievement[] = [];
  let page = 1;
  let hasMore = true;
  const limit = 100; // FFXIV Collect default limit
  const maxPages = 50; // Prevent excessive requests

  while (hasMore && page <= maxPages) {
    const offset = (page - 1) * limit;
    const url = `${EXTERNAL_APIS.FFXIV_COLLECT_BASE}/achievements?limit=${limit}&offset=${offset}`;
    
    try {
      const response = await fetchWithTimeout(url);
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`FFXIV Collect HTTP ${response.status}: ${response.statusText} - ${errorBody}`);
      }
      const data: FFXIVCollectAchievementSearchResult = await response.json();

      if (!data.results || !Array.isArray(data.results)) {
        console.error(`Invalid data structure from FFXIV Collect for page ${page}.`);
        break;
      }

      allAchievements = allAchievements.concat(data.results);
      console.log(`Fetched FFXIV Collect page ${page}, total achievements so far: ${allAchievements.length}`);
      
      hasMore = data.results.length === limit && allAchievements.length < MAX_CACHE_SIZE;
      page++;
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    } catch (error) {
      console.error(`FFXIV Collect fetch failed for page ${page}:`, error instanceof Error ? error.message : error);
      break; // Stop fetching on first error
    }
  }

  if (allAchievements.length === 0) {
    throw new Error("No achievements were fetched from FFXIV Collect.");
  }

  console.log(`Successfully fetched ${allAchievements.length} achievements from FFXIV Collect.`);
  return allAchievements.map(achievement => {
    const categoryName = achievement.category?.name || 'Unknown';
    const isObtainable = !categoryName.toLowerCase().includes('legacy') && 
                         !categoryName.toLowerCase().includes('seasonal'); // FFXIV Collect specific logic
    return {
      id: achievement.id,
      name: achievement.name || 'Unknown Achievement',
      description: achievement.description || 'No description available',
      category: categoryName,
      points: Math.max(0, achievement.points || 0),
      patch: achievement.patch || 'Unknown',
      isObtainable,
      icon: achievement.icon || null, // This will be a relative path
      rarity: achievement.rarity || null,
    };
  });
}

export async function GET() {
  const now = Date.now();
  if (achievementsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log("Returning cached achievements data.");
    return NextResponse.json(achievementsCache);
  }

  let processedAchievements: any[] = [];
  let source = 'mock';

  try {
    processedAchievements = await fetchAchievementsFromTomestone();
    source = 'tomestone';
  } catch (tomestoneError) {
    console.error("Tomestone.gg achievements API failed:", tomestoneError);
    try {
      processedAchievements = await fetchAchievementsFromFFXIVCollect();
      source = 'ffxivcollect';
    } catch (ffxivCollectError) {
      console.error("FFXIV Collect achievements API failed:", ffxivCollectError);
      processedAchievements = generateMockAchievements();
      source = 'mock';
    }
  }

  const achievementsWithTSRG = processedAchievements
    .filter(achievement => achievement.id && achievement.name)
    .map(achievement => ({
      ...achievement,
      tsrg: calculateTSRGScore(achievement),
    }));

  if (achievementsWithTSRG.length <= MAX_CACHE_SIZE) {
    achievementsCache = achievementsWithTSRG;
    cacheTimestamp = now;
    console.log(`Achievements cached from ${source} source.`);
  } else {
    console.warn(`Achievement list too large (${achievementsWithTSRG.length}), not caching.`);
  }

  return NextResponse.json(achievementsWithTSRG);
}