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
  // Tomestone.gg does not explicitly have 'isObtainable' in the schema,
  // so we'll infer it or keep the existing logic.
}

interface TomestoneAchievementSearchResult {
  results: TomestoneAchievement[];
  count: number;
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
    const iconPath = `https://ffxivcollect.com/images/achievements/061000/061${iconVariant.slice(-3)}.png`;
    
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

export async function GET() {
  try {
    const now = Date.now();
    if (achievementsCache && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log("Returning cached achievements data");
      return NextResponse.json(achievementsCache);
    }

    console.log("Fetching achievements from Tomestone.gg API...");
    
    if (!TOMESTONE_API_KEY) {
      console.error("TOMESTONE_API_KEY is not set. Cannot call Tomestone.gg API for achievements.");
      const mockAchievements = generateMockAchievements().map(achievement => ({
        ...achievement,
        tsrg: calculateTSRGScore(achievement),
      }));
      achievementsCache = mockAchievements;
      cacheTimestamp = now;
      return NextResponse.json(mockAchievements);
    }

    try {
      let allAchievements: TomestoneAchievement[] = [];
      let page = 1;
      let hasMore = true;
      const maxPages = 50; // Prevent infinite loops
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
              console.log(`Rate limited, waiting ${waitTime}ms before retry ${retryCount + 1}`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
          } catch (error) {
            console.error(`Attempt ${retryCount + 1} failed for page ${page}:`, error);
            
            if (retryCount === maxRetries - 1) {
              if (allAchievements.length > 0) {
                console.log(`Failed to fetch page ${page}, but we have ${allAchievements.length} achievements. Stopping here.`);
                hasMore = false;
                break;
              } else {
                throw new Error(`Failed to fetch achievements after ${maxRetries} attempts`);
              }
            }
            
            const waitTime = Math.pow(2, retryCount) * 1000;
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
          
          retryCount++;
        }

        if (!response || !response.ok) {
          break;
        }

        const data: TomestoneAchievementSearchResult = await response.json();

        if (!data.results || !Array.isArray(data.results)) {
          console.error(`Invalid data structure for page ${page}`);
          break;
        }

        allAchievements = allAchievements.concat(data.results);
        
        console.log(`Fetched page ${page}, total achievements so far: ${allAchievements.length}`);
        
        hasMore = data.results.length === 100 && allAchievements.length < MAX_CACHE_SIZE;
        page++;
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      if (allAchievements.length === 0) {
        throw new Error("No achievements were fetched from Tomestone.gg");
      }

      console.log(`Total achievements fetched from Tomestone.gg: ${allAchievements.length}`);

      const processedAchievements = allAchievements
        .filter(achievement => achievement.id && achievement.name)
        .map(achievement => {
          // Tomestone.gg provides category as a string, not an object
          const categoryName = achievement.category || 'Unknown';
          // isObtainable logic remains the same, as it's not directly from API
          const isObtainable = !categoryName.toLowerCase().includes('legacy') && 
                              !categoryName.toLowerCase().includes('seasonal') &&
                              !categoryName.toLowerCase().includes('discontinued') &&
                              !categoryName.toLowerCase().includes('feast');

          const baseAchievement = {
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

          const tsrg = calculateTSRGScore(baseAchievement);

          return {
            ...baseAchievement,
            tsrg,
          };
        });

      if (processedAchievements.length <= MAX_CACHE_SIZE) {
        achievementsCache = processedAchievements;
        cacheTimestamp = now;
      } else {
        console.warn(`Achievement list too large (${processedAchievements.length}), not caching`);
      }

      return NextResponse.json(processedAchievements);

    } catch (apiError) {
      console.warn("Tomestone.gg API failed for achievements, falling back to mock data:", apiError);
      
      const mockAchievements = generateMockAchievements().map(achievement => ({
        ...achievement,
        tsrg: calculateTSRGScore(achievement),
      }));
      
      achievementsCache = mockAchievements;
      cacheTimestamp = now;
      
      return NextResponse.json(mockAchievements);
    }

  } catch (error) {
    console.error("Error in achievements endpoint:", error);
    
    if (achievementsCache && achievementsCache.length > 0) {
      console.log("Returning stale cached data due to error");
      return NextResponse.json(achievementsCache);
    }
    
    console.log("Generating mock achievements as last resort");
    const mockAchievements = generateMockAchievements().map(achievement => ({
      ...achievement,
      tsrg: calculateTSRGScore(achievement),
    }));
    return NextResponse.json(mockAchievements);
  }
}