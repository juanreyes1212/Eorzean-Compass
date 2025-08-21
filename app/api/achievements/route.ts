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
  const achievementNames = [
    "The Ultimate Hunter", "Master Crafter", "Dungeon Delver", "PvP Champion", "Explorer Extraordinaire",
    "Quest Seeker", "Item Collector", "Beast Slayer", "Gathering Guru", "Trial Conqueror"
  ];
  const achievementSuffixes = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  const achievements = [];
  
  for (let i = 1; i <= 2500; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const isObtainable = category !== "Legacy" && Math.random() > 0.05; // 95% obtainable
    
    // Generate a more varied name
    const baseName = achievementNames[Math.floor(Math.random() * achievementNames.length)];
    const suffix = achievementSuffixes[Math.floor(Math.random() * achievementSuffixes.length)];
    const name = `${baseName} ${suffix}`;

    // Generate a semi-realistic icon path (using FFXIV Collect pattern for mock)
    const iconVariant = String(i).padStart(6, '0');
    const iconPath = `/images/achievements/061000/061${iconVariant.slice(-3)}.png`; // Relative path for mock
    
    achievements.push({
      id: i,
      name: name,
      description: `This is a ${category.toLowerCase()} achievement that tests your skills in FFXIV. It involves ${name.toLowerCase().replace(/ .*/, '')} activities.`,
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

// Removed fetchAchievementsFromTomestone as it's not the correct endpoint for all achievements.

async function fetchAchievementsFromFFXIVCollect(): Promise<any[]> {
  console.log("Attempting to fetch achievements from FFXIV Collect API...");
  
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

  // Deduplicate achievements by ID to ensure uniqueness
  const uniqueAchievementsMap = new Map<number, FFXIVCollectAchievement>();
  allAchievements.forEach(ach => {
    if (ach.id) {
      uniqueAchievementsMap.set(ach.id, ach);
    }
  });
  const uniqueAchievements = Array.from(uniqueAchievementsMap.values());
  console.log(`Deduplicated achievements: ${uniqueAchievements.length} unique achievements.`);


  console.log(`Successfully fetched ${uniqueAchievements.length} achievements from FFXIV Collect.`);
  return uniqueAchievements.map(achievement => {
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
    // Directly attempt to fetch from FFXIV Collect as the primary source for all achievements
    processedAchievements = await fetchAchievementsFromFFXIVCollect();
    source = 'ffxivcollect';
  } catch (ffxivCollectError) {
    console.error("FFXIV Collect achievements API failed:", ffxivCollectError);
    processedAchievements = generateMockAchievements();
    source = 'mock';
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