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
const MAX_ACHIEVEMENTS_TO_FETCH = 3000; // Cap the total number of achievements to fetch

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
  const categories = ["Battle", "Character", "Items", "Crafting & Gathering", "Quests", "Exploration", "PvP", "Grand Company", "Legacy"];
  const baseNames = [
    "The Ultimate Hunter", "Master Crafter", "Dungeon Delver", "PvP Champion", "Explorer Extraordinaire",
    "Quest Seeker", "Item Collector", "Beast Slayer", "Gathering Guru", "Trial Conqueror",
    "FATE Finisher", "Levemate", "Triple Triad Master", "Mahjong Mogul", "Ocean Fisher",
    "Deep Dungeon Diver", "Eureka Explorer", "Bozjan Battler", "Relic Reborn", "Mount Collector"
  ];
  const adjectives = ["Grand", "Epic", "Legendary", "Swift", "Mighty", "Hidden", "Glorious", "Unseen", "Eternal", "Valiant"];
  const nouns = ["Journey", "Feat", "Triumph", "Conquest", "Odyssey", "Saga", "Venture", "Pursuit", "Challenge", "Legacy"];
  const achievements = [];
  
  for (let i = 1; i <= 2500; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const isObtainable = category !== "Legacy" && Math.random() > 0.05; // 95% obtainable
    
    // Generate a more varied and unique name
    const namePart1 = baseNames[Math.floor(Math.random() * baseNames.length)];
    const namePart2 = adjectives[Math.floor(Math.random() * adjectives.length)];
    const namePart3 = nouns[Math.floor(Math.random() * nouns.length)];
    const name = `${namePart1}: ${namePart2} ${namePart3} ${i}`; // Add unique ID to ensure uniqueness

    // Generate a more varied description
    const descriptionTemplates = [
      `Complete the arduous task of ${namePart1.toLowerCase()} to earn this prestigious award.`,
      `Prove your ${namePart2.toLowerCase()} skills in ${category.toLowerCase()} by achieving this remarkable ${namePart3.toLowerCase()}.`,
      `This achievement signifies your dedication to ${category.toLowerCase()} and your mastery of ${namePart1.toLowerCase()} challenges.`,
      `A testament to your ${namePart2.toLowerCase()} spirit and your relentless ${namePart3.toLowerCase()} across Eorzea.`,
      `Only the most ${adjectives[Math.floor(Math.random() * adjectives.length)].toLowerCase()} adventurers can claim this ${nouns[Math.floor(Math.random() * nouns.length)].toLowerCase()}.`
    ];
    const description = descriptionTemplates[Math.floor(Math.random() * descriptionTemplates.length)];

    // Generate a semi-realistic icon path (using FFXIV Collect pattern for mock)
    const iconId = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0'); // Random 3-digit number
    const iconCategory = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0'); // Random 3-digit number for category
    const iconPath = `/images/achievements/061${iconCategory}/061${iconId}.png`; // Relative path for mock
    
    achievements.push({
      id: i,
      name: name,
      description: description,
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

async function fetchAchievementsFromFFXIVCollect(): Promise<any[]> {
  console.log("Attempting to fetch achievements from FFXIV Collect API...");
  
  let allAchievements: FFXIVCollectAchievement[] = [];
  let page = 1;
  const limit = 100; // FFXIV Collect default limit
  let totalAchievementsCount = 0; // To store the total count from the first response

  while (allAchievements.length < MAX_ACHIEVEMENTS_TO_FETCH) {
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

      if (page === 1) {
        totalAchievementsCount = data.total; // Get total count from first page
        console.log(`FFXIV Collect reported total achievements: ${totalAchievementsCount}`);
      }

      allAchievements = allAchievements.concat(data.results);
      console.log(`Fetched FFXIV Collect page ${page}, total achievements so far: ${allAchievements.length}`);
      
      // Stop if we've fetched all available or reached our cap
      if (data.results.length < limit || allAchievements.length >= totalAchievementsCount || allAchievements.length >= MAX_ACHIEVEMENTS_TO_FETCH) {
        console.log("Reached end of FFXIV Collect data or fetched maximum allowed achievements.");
        break;
      }
      
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

  // Cache all fetched achievements, as the fetching logic now ensures it's a complete set
  achievementsCache = achievementsWithTSRG;
  cacheTimestamp = now;
  console.log(`Achievements cached from ${source} source. Total: ${achievementsWithTSRG.length}`);

  return NextResponse.json(achievementsWithTSRG);
}