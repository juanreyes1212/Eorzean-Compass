import { NextResponse } from "next/server";
import { calculateTSRGScore } from '@/lib/tsrg-matrix';

interface FFXIVCollectAchievement {
  id: number;
  name: string;
  description: string;
  points: number;
  category: {
    id: number;
    name: string;
  };
  patch: string;
  icon: string; // Added icon field
  owned?: string;
}

interface FFXIVCollectResponse {
  count: number;
  results: FFXIVCollectAchievement[];
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
    
    // Generate a semi-realistic icon path
    const iconVariant = String(i).padStart(6, '0');
    const iconPath = `/i/061000/061${iconVariant.slice(-3)}.png`;
    
    achievements.push({
      id: i,
      name: `Achievement ${i}`,
      description: `This is a ${category.toLowerCase()} achievement that tests your skills in FFXIV.`,
      category,
      points: Math.floor(Math.random() * 15) * 5, // Points in multiples of 5, up to 70
      patch: `${Math.floor(Math.random() * 6) + 1}.${Math.floor(Math.random() * 5)}`,
      isObtainable,
      icon: iconPath, // Add icon path
    });
  }
  
  return achievements;
}

export async function GET() {
  try {
    // Check if we have valid cached data
    const now = Date.now();
    if (achievementsCache && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log("Returning cached achievements data");
      return NextResponse.json(achievementsCache);
    }

    console.log("Fetching achievements from FFXIV Collect API...");
    
    // Try to fetch from FFXIV Collect, but fall back to mock data
    try {
      // Fetch all achievements from FFXIV Collect with proper error handling
      let allAchievements: FFXIVCollectAchievement[] = [];
      let page = 1;
      let hasMore = true;
      const maxPages = 50; // Prevent infinite loops
      const maxRetries = 3;

      while (hasMore && page <= maxPages) {
        const url = `https://ffxivcollect.com/api/achievements?page=${page}&limit=100`;
        
        let response: Response | null = null;
        let retryCount = 0;
        
        // Retry logic for failed requests
        while (retryCount < maxRetries) {
          try {
            response = await fetchWithTimeout(url, {
              headers: {
                'User-Agent': 'Eorzean-Compass/1.0',
                'Accept': 'application/json',
              }
            });
            
            if (response.ok) {
              break; // Success, exit retry loop
            } else if (response.status === 429) {
              // Rate limited, wait longer
              const waitTime = Math.pow(2, retryCount) * 2000; // Exponential backoff
              console.log(`Rate limited, waiting ${waitTime}ms before retry ${retryCount + 1}`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
          } catch (error) {
            console.error(`Attempt ${retryCount + 1} failed for page ${page}:`, error);
            
            if (retryCount === maxRetries - 1) {
              // Last retry failed
              if (allAchievements.length > 0) {
                console.log(`Failed to fetch page ${page}, but we have ${allAchievements.length} achievements. Stopping here.`);
                hasMore = false;
                break;
              } else {
                throw new Error(`Failed to fetch achievements after ${maxRetries} attempts`);
              }
            }
            
            // Wait before retry
            const waitTime = Math.pow(2, retryCount) * 1000;
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
          
          retryCount++;
        }

        if (!response || !response.ok) {
          break; // Exit the main loop if we couldn't get a response
        }

        // Safely parse the response
        const responseText = await response.text();
        let data: FFXIVCollectResponse;
        
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error(`Failed to parse JSON for page ${page}:`, parseError);
          console.error("Response text:", responseText.substring(0, 200));
          break;
        }

        if (!data.results || !Array.isArray(data.results)) {
          console.error(`Invalid data structure for page ${page}`);
          break;
        }

        allAchievements = allAchievements.concat(data.results);
        
        console.log(`Fetched page ${page}, total achievements so far: ${allAchievements.length}`);
        
        // Check if there are more pages and we haven't hit our cache size limit
        hasMore = data.results.length === 100 && allAchievements.length < MAX_CACHE_SIZE;
        page++;
        
        // Add a small delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      if (allAchievements.length === 0) {
        throw new Error("No achievements were fetched from FFXIV Collect");
      }

      console.log(`Total achievements fetched from FFXIV Collect: ${allAchievements.length}`);

      // Process the achievements with validation and icon handling
      const processedAchievements = allAchievements
        .filter(achievement => achievement.id && achievement.name)
        .map(achievement => {
          const categoryName = achievement.category?.name || 'Unknown';
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
            icon: achievement.icon || null, // Include icon from API
          };

          // Calculate TSR-G score
          const tsrg = calculateTSRGScore(baseAchievement);

          return {
            ...baseAchievement,
            tsrg,
          };
        });

      // Update cache with size limit
      if (processedAchievements.length <= MAX_CACHE_SIZE) {
        achievementsCache = processedAchievements;
        cacheTimestamp = now;
      } else {
        console.warn(`Achievement list too large (${processedAchievements.length}), not caching`);
      }

      return NextResponse.json(processedAchievements);

    } catch (apiError) {
      console.warn("FFXIV Collect API failed, falling back to mock data:", apiError);
      
      // Generate mock achievements with icons
      const mockAchievements = generateMockAchievements().map(achievement => ({
        ...achievement,
        tsrg: calculateTSRGScore(achievement),
      }));
      
      // Cache the mock data
      achievementsCache = mockAchievements;
      cacheTimestamp = now;
      
      return NextResponse.json(mockAchievements);
    }

  } catch (error) {
    console.error("Error in achievements endpoint:", error);
    
    // If we have cached data, return it even if it's stale
    if (achievementsCache && achievementsCache.length > 0) {
      console.log("Returning stale cached data due to error");
      return NextResponse.json(achievementsCache);
    }
    
    // Last resort: generate mock data with icons
    console.log("Generating mock achievements as last resort");
    const mockAchievements = generateMockAchievements().map(achievement => ({
      ...achievement,
      tsrg: calculateTSRGScore(achievement),
    }));
    return NextResponse.json(mockAchievements);
  }
}
