import { NextResponse } from "next/server";
import { EXTERNAL_APIS, TOMESTONE_API_KEY } from '@/lib/constants';

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');
  const characterId = searchParams.get('characterId');
  const page = searchParams.get('page') || '1';
  const name = searchParams.get('name');
  const server = searchParams.get('server');
  
  const results: any = {
    endpoint,
    timestamp: new Date().toISOString(),
    apiKey: TOMESTONE_API_KEY ? 'Present' : 'Missing',
    request: {
      endpoint,
      characterId,
      page,
      name,
      server
    },
    results: {}
  };

  try {
    switch (endpoint) {
      case 'tomestone-achievements':
        // Test Tomestone achievements endpoint with detailed logging
        const achievementsUrl = `${EXTERNAL_APIS.TOMESTONE_BASE}/achievements?page=${page}&limit=50`;
        console.log(`[Debug] Testing Tomestone achievements: ${achievementsUrl}`);
        
        const achievementsResponse = await fetchWithTimeout(achievementsUrl, {
          headers: {
            'Authorization': `Bearer ${TOMESTONE_API_KEY}`,
            'User-Agent': `Eorzean-Compass/1.0 (${process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.netlify.app'})`,
            'Accept': 'application/json',
          }
        });

        const achievementsData = achievementsResponse.ok ? await achievementsResponse.json() : await achievementsResponse.text();
        
        results.results.tomestoneAchievements = {
          status: achievementsResponse.status,
          statusText: achievementsResponse.statusText,
          headers: Object.fromEntries(achievementsResponse.headers.entries()),
          dataType: typeof achievementsData,
          dataStructure: achievementsResponse.ok ? {
            hasResults: 'results' in achievementsData,
            resultsLength: achievementsData.results?.length || 0,
            hasTotal: 'total' in achievementsData,
            total: achievementsData.total,
            hasPagination: 'page' in achievementsData && 'limit' in achievementsData,
            page: achievementsData.page,
            limit: achievementsData.limit,
            sampleAchievement: achievementsData.results?.[0]
          } : null,
          rawData: achievementsData
        };
        break;

      case 'tomestone-character-profile':
        if (!name || !server) {
          results.results.error = "Name and server are required for character profile";
          break;
        }
        
        const profileUrl = `${EXTERNAL_APIS.TOMESTONE_BASE}/character/profile/${encodeURIComponent(server)}/${encodeURIComponent(name)}`;
        console.log(`[Debug] Testing Tomestone character profile: ${profileUrl}`);
        
        const profileResponse = await fetchWithTimeout(profileUrl, {
          headers: {
            'Authorization': `Bearer ${TOMESTONE_API_KEY}`,
            'User-Agent': `Eorzean-Compass/1.0 (${process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.netlify.app'})`,
            'Accept': 'application/json',
          }
        });

        const profileData = profileResponse.ok ? await profileResponse.json() : await profileResponse.text();
        
        results.results.tomestoneCharacterProfile = {
          status: profileResponse.status,
          statusText: profileResponse.statusText,
          headers: Object.fromEntries(profileResponse.headers.entries()),
          dataType: typeof profileData,
          dataStructure: profileResponse.ok ? {
            hasId: 'id' in profileData,
            id: profileData.id,
            hasName: 'name' in profileData,
            name: profileData.name,
            hasServer: 'server' in profileData,
            server: profileData.server,
            hasAchievementPoints: 'achievementPoints' in profileData,
            achievementPointsStructure: profileData.achievementPoints
          } : null,
          rawData: profileData
        };
        break;

      case 'tomestone-character-achievements':
        if (!characterId) {
          results.results.error = "Character ID is required for this endpoint";
          break;
        }
        
        const charAchievementsUrl = `${EXTERNAL_APIS.TOMESTONE_BASE}/character/${characterId}/achievements?page=${page}&limit=50`;
        console.log(`[Debug] Testing Tomestone character achievements: ${charAchievementsUrl}`);
        
        const charAchievementsResponse = await fetchWithTimeout(charAchievementsUrl, {
          headers: {
            'Authorization': `Bearer ${TOMESTONE_API_KEY}`,
            'User-Agent': `Eorzean-Compass/1.0 (${process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.netlify.app'})`,
            'Accept': 'application/json',
          }
        });

        const charAchievementsData = charAchievementsResponse.ok ? await charAchievementsResponse.json() : await charAchievementsResponse.text();
        
        results.results.tomestoneCharacterAchievements = {
          status: charAchievementsResponse.status,
          statusText: charAchievementsResponse.statusText,
          headers: Object.fromEntries(charAchievementsResponse.headers.entries()),
          dataType: typeof charAchievementsData,
          dataStructure: charAchievementsResponse.ok ? {
            hasResults: 'results' in charAchievementsData,
            resultsLength: charAchievementsData.results?.length || 0,
            hasTotal: 'total' in charAchievementsData,
            total: charAchievementsData.total,
            hasPagination: 'page' in charAchievementsData,
            sampleCompletedAchievement: charAchievementsData.results?.[0]
          } : null,
          rawData: charAchievementsData
        };
        break;

      case 'ffxiv-collect-achievements':
        // Test FFXIVCollect achievements endpoint
        const offset = (parseInt(page) - 1) * 50;
        const ffxivCollectUrl = `${EXTERNAL_APIS.FFXIV_COLLECT_BASE}/achievements?limit=50&offset=${offset}`;
        console.log(`[Debug] Testing FFXIVCollect achievements: ${ffxivCollectUrl}`);
        
        const ffxivCollectResponse = await fetchWithTimeout(ffxivCollectUrl);
        const ffxivCollectData = ffxivCollectResponse.ok ? await ffxivCollectResponse.json() : await ffxivCollectResponse.text();
        
        results.results.ffxivCollectAchievements = {
          status: ffxivCollectResponse.status,
          statusText: ffxivCollectResponse.statusText,
          headers: Object.fromEntries(ffxivCollectResponse.headers.entries()),
          dataType: typeof ffxivCollectData,
          dataStructure: ffxivCollectResponse.ok ? {
            hasResults: 'results' in ffxivCollectData,
            resultsLength: ffxivCollectData.results?.length || 0,
            hasTotal: 'total' in ffxivCollectData,
            total: ffxivCollectData.total,
            sampleAchievement: ffxivCollectData.results?.[0]
          } : null,
          rawData: ffxivCollectData
        };
        break;

      case 'ffxiv-collect-character':
        if (!characterId) {
          results.results.error = "Character ID is required for FFXIVCollect character endpoint";
          break;
        }
        
        const ffxivCharUrl = `${EXTERNAL_APIS.FFXIV_COLLECT_BASE}/characters/${characterId}/achievements`;
        console.log(`[Debug] Testing FFXIVCollect character achievements: ${ffxivCharUrl}`);
        
        const ffxivCharResponse = await fetchWithTimeout(ffxivCharUrl);
        const ffxivCharData = ffxivCharResponse.ok ? await ffxivCharResponse.json() : await ffxivCharResponse.text();
        
        results.results.ffxivCollectCharacter = {
          status: ffxivCharResponse.status,
          statusText: ffxivCharResponse.statusText,
          headers: Object.fromEntries(ffxivCharResponse.headers.entries()),
          dataType: typeof ffxivCharData,
          dataStructure: ffxivCharResponse.ok ? {
            isArray: Array.isArray(ffxivCharData),
            length: Array.isArray(ffxivCharData) ? ffxivCharData.length : 0,
            sampleItem: Array.isArray(ffxivCharData) ? ffxivCharData[0] : null
          } : null,
          rawData: ffxivCharData
        };
        break;

      case 'pagination-test':
        // Test multiple pages to verify pagination
        const paginationResults = [];
        for (let i = 1; i <= 3; i++) {
          try {
            const testUrl = `${EXTERNAL_APIS.TOMESTONE_BASE}/achievements?page=${i}&limit=50`;
            const testResponse = await fetchWithTimeout(testUrl, {
              headers: {
                'Authorization': `Bearer ${TOMESTONE_API_KEY}`,
                'User-Agent': `Eorzean-Compass/1.0`,
                'Accept': 'application/json',
              }
            });
            
            const testData = testResponse.ok ? await testResponse.json() : await testResponse.text();
            paginationResults.push({
              page: i,
              status: testResponse.status,
              resultsCount: testData.results?.length || 0,
              total: testData.total,
              hasMore: testData.results?.length === 50
            });
            
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (error) {
            paginationResults.push({
              page: i,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
        
        results.results.paginationTest = paginationResults;
        break;

      default:
        results.results.error = "Invalid endpoint. Use: tomestone-achievements, tomestone-character-profile, tomestone-character-achievements, ffxiv-collect-achievements, ffxiv-collect-character, pagination-test";
    }

  } catch (error) {
    results.results.error = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Debug] Error testing ${endpoint}:`, error);
  }

  return NextResponse.json(results);
}