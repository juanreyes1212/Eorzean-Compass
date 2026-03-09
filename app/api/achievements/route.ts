import { NextResponse } from "next/server";
import { calculateTSRGScore } from '@/lib/tsrg-matrix';
import { EXTERNAL_APIS, CACHE_DURATION } from '@/lib/constants';
import { securityHeaders } from '@/lib/security';

interface FFXIVCollectAchievement {
  id: number;
  name: string;
  description: string;
  points: number;
  order: number;
  patch: string;
  owned: string;
  icon: string;
  category: { id: number; name: string };
  type: { id: number; name: string };
  reward?: any;
}

let achievementsCache: any[] | null = null;
let cacheTimestamp: number = 0;
const SERVER_CACHE_DURATION = CACHE_DURATION.ACHIEVEMENTS;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

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

async function fetchWithRetry(url: string, options: RequestInit = {}, timeout = 20000): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, timeout);
      if (response.status === 429 && attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, attempt)));
        continue;
      }
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError ?? new Error('Fetch failed after retries');
}

const REQUEST_HEADERS = {
  'User-Agent': `Eorzean-Compass/1.0 (${process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.netlify.app'})`,
  'Accept': 'application/json',
};

async function buildAchievementListFromOwnedMissing(lodestoneId: number): Promise<{
  allAchievements: FFXIVCollectAchievement[];
  ownedIds: Set<number>;
}> {
  const allAchievements: FFXIVCollectAchievement[] = [];
  const ownedIds = new Set<number>();

  const ownedUrl = `${EXTERNAL_APIS.FFXIV_COLLECT_BASE}/characters/${lodestoneId}/achievements/owned?latest=true`;
  const ownedResponse = await fetchWithRetry(ownedUrl, { headers: REQUEST_HEADERS });

  if (!ownedResponse.ok) {
    throw new Error(`Failed to fetch owned achievements: ${ownedResponse.status}`);
  }

  const ownedData = await ownedResponse.json();
  if (Array.isArray(ownedData)) {
    ownedData.forEach((achievement: FFXIVCollectAchievement) => {
      if (achievement.id && achievement.name) {
        allAchievements.push(achievement);
        ownedIds.add(achievement.id);
      }
    });
  }

  const missingUrl = `${EXTERNAL_APIS.FFXIV_COLLECT_BASE}/characters/${lodestoneId}/achievements/missing?latest=true`;
  const missingResponse = await fetchWithRetry(missingUrl, { headers: REQUEST_HEADERS });

  if (!missingResponse.ok) {
    throw new Error(`Failed to fetch missing achievements: ${missingResponse.status}`);
  }

  const missingData = await missingResponse.json();
  if (Array.isArray(missingData)) {
    missingData.forEach((achievement: FFXIVCollectAchievement) => {
      if (achievement.id && achievement.name) {
        allAchievements.push(achievement);
      }
    });
  }

  return { allAchievements, ownedIds };
}

async function fetchGeneralAchievementsList(): Promise<FFXIVCollectAchievement[]> {
  const now = Date.now();
  if (achievementsCache && (now - cacheTimestamp) < SERVER_CACHE_DURATION) {
    return achievementsCache as FFXIVCollectAchievement[];
  }

  let allAchievements: FFXIVCollectAchievement[] = [];
  let page = 1;
  const limit = 100;

  while (true) {
    const offset = (page - 1) * limit;
    const url = `${EXTERNAL_APIS.FFXIV_COLLECT_BASE}/achievements?limit=${limit}&offset=${offset}`;

    const response = await fetchWithRetry(url, { headers: REQUEST_HEADERS });

    if (!response.ok) {
      throw new Error(`FFXIVCollect HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.results || !Array.isArray(data.results) || data.results.length === 0) {
      break;
    }

    allAchievements = allAchievements.concat(data.results);

    if (data.results.length < limit) break;

    page++;
    await new Promise(resolve => setTimeout(resolve, 100));

    if (page > 50) break;
  }

  achievementsCache = allAchievements;
  cacheTimestamp = now;

  return allAchievements;
}

function processFFXIVCollectAchievement(achievement: FFXIVCollectAchievement, isCompleted: boolean): any {
  const categoryName = achievement.category?.name || 'Unknown';
  const typeName = achievement.type?.name || 'Unknown';

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
    icon: achievement.icon || undefined,
    rarity: achievement.owned ? parseFloat(achievement.owned.replace('%', '')) : undefined,
    order: achievement.order || 0
  };

  return {
    ...processed,
    tsrg: calculateTSRGScore(processed)
  };
}

export async function GET(request: Request) {
  const headers = new Headers(securityHeaders);

  const { searchParams } = new URL(request.url);
  const lodestoneIdParam = searchParams.get('lodestoneId');
  const lodestoneId = lodestoneIdParam ? Number(lodestoneIdParam) : null;

  try {
    let processedAchievements: any[] = [];
    let isCharacterSpecific = false;
    let usedFallback = false;

    if (lodestoneId) {
      try {
        const { allAchievements, ownedIds } = await buildAchievementListFromOwnedMissing(lodestoneId);

        processedAchievements = allAchievements.map(achievement => {
          const isCompleted = ownedIds.has(achievement.id);
          return processFFXIVCollectAchievement(achievement, isCompleted);
        });

        isCharacterSpecific = true;
      } catch {
        const generalAchievements = await fetchGeneralAchievementsList();
        processedAchievements = generalAchievements.map(achievement =>
          processFFXIVCollectAchievement(achievement, false)
        );
        usedFallback = true;
      }
    } else {
      const generalAchievements = await fetchGeneralAchievementsList();
      processedAchievements = generalAchievements.map(achievement =>
        processFFXIVCollectAchievement(achievement, false)
      );
    }

    const validAchievements = processedAchievements
      .filter(achievement => achievement.id && achievement.name)
      .sort((a, b) => a.order - b.order);

    const response = {
      achievements: validAchievements,
      metadata: {
        total: validAchievements.length,
        completed: validAchievements.filter((a: any) => a.isCompleted).length,
        isCharacterSpecific,
        usedFallback,
      }
    };

    return NextResponse.json(response, { headers });

  } catch (error) {
    console.error("[Achievements API]", error instanceof Error ? error.message : error);

    return NextResponse.json(
      {
        error: `Failed to fetch achievements: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: "Unable to fetch from FFXIVCollect API"
      },
      { status: 500, headers }
    );
  }
}
