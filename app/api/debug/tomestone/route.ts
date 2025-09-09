import { NextResponse } from "next/server";
import { EXTERNAL_APIS, TOMESTONE_API_KEY } from '@/lib/constants';

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');
  const characterId = searchParams.get('characterId');
  const page = searchParams.get('page') || '1';
  
  if (!TOMESTONE_API_KEY) {
    return NextResponse.json({
      error: "Tomestone.gg API key is missing",
      endpoint,
      timestamp: new Date().toISOString()
    });
  }

  const results: any = {
    endpoint,
    timestamp: new Date().toISOString(),
    apiKey: TOMESTONE_API_KEY ? 'Present' : 'Missing',
    results: {}
  };

  try {
    switch (endpoint) {
      case 'achievements':
        // Test achievements endpoint with pagination
        const achievementsUrl = `${EXTERNAL_APIS.TOMESTONE_BASE}/achievements?page=${page}&limit=50`;
        console.log(`[Debug] Testing Tomestone achievements: ${achievementsUrl}`);
        
        const achievementsResponse = await fetchWithTimeout(achievementsUrl, {
          headers: {
            'Authorization': `Bearer ${TOMESTONE_API_KEY}`,
            'User-Agent': `Eorzean-Compass/1.0 (${process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.netlify.app'})`,
            'Accept': 'application/json',
          }
        });

        results.results.achievements = {
          status: achievementsResponse.status,
          statusText: achievementsResponse.statusText,
          headers: Object.fromEntries(achievementsResponse.headers.entries()),
          data: achievementsResponse.ok ? await achievementsResponse.json() : await achievementsResponse.text()
        };
        break;

      case 'character-achievements':
        if (!characterId) {
          results.results.error = "Character ID is required for this endpoint";
          break;
        }
        
        const charAchievementsUrl = `${EXTERNAL_APIS.TOMESTONE_BASE}/character/${characterId}/achievements`;
        console.log(`[Debug] Testing Tomestone character achievements: ${charAchievementsUrl}`);
        
        const charAchievementsResponse = await fetchWithTimeout(charAchievementsUrl, {
          headers: {
            'Authorization': `Bearer ${TOMESTONE_API_KEY}`,
            'User-Agent': `Eorzean-Compass/1.0 (${process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.netlify.app'})`,
            'Accept': 'application/json',
          }
        });

        results.results.characterAchievements = {
          status: charAchievementsResponse.status,
          statusText: charAchievementsResponse.statusText,
          headers: Object.fromEntries(charAchievementsResponse.headers.entries()),
          data: charAchievementsResponse.ok ? await charAchievementsResponse.json() : await charAchievementsResponse.text()
        };
        break;

      case 'character-profile':
        const name = searchParams.get('name');
        const server = searchParams.get('server');
        
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

        results.results.characterProfile = {
          status: profileResponse.status,
          statusText: profileResponse.statusText,
          headers: Object.fromEntries(profileResponse.headers.entries()),
          data: profileResponse.ok ? await profileResponse.json() : await profileResponse.text()
        };
        break;

      case 'ffxiv-collect-achievements':
        // Test FFXIVCollect achievements endpoint
        const ffxivCollectUrl = `${EXTERNAL_APIS.FFXIV_COLLECT_BASE}/achievements?limit=50&offset=${(parseInt(page) - 1) * 50}`;
        console.log(`[Debug] Testing FFXIVCollect achievements: ${ffxivCollectUrl}`);
        
        const ffxivCollectResponse = await fetchWithTimeout(ffxivCollectUrl);
        
        results.results.ffxivCollectAchievements = {
          status: ffxivCollectResponse.status,
          statusText: ffxivCollectResponse.statusText,
          headers: Object.fromEntries(ffxivCollectResponse.headers.entries()),
          data: ffxivCollectResponse.ok ? await ffxivCollectResponse.json() : await ffxivCollectResponse.text()
        };
        break;

      case 'ffxiv-collect-character':
        if (!characterId) {
          results.results.error = "Character ID is required for FFXIVCollect character endpoint";
          break;
        }
        
        const ffxivCharUrl = `${EXTERNAL_APIS.FFXIV_COLLECT_BASE}/characters/${characterId}/achievements/owned`;
        console.log(`[Debug] Testing FFXIVCollect character achievements: ${ffxivCharUrl}`);
        
        const ffxivCharResponse = await fetchWithTimeout(ffxivCharUrl);
        
        results.results.ffxivCollectCharacter = {
          status: ffxivCharResponse.status,
          statusText: ffxivCharResponse.statusText,
          headers: Object.fromEntries(ffxivCharResponse.headers.entries()),
          data: ffxivCharResponse.ok ? await ffxivCharResponse.json() : await ffxivCharResponse.text()
        };
        break;

      default:
        results.results.error = "Invalid endpoint. Use: achievements, character-achievements, character-profile, ffxiv-collect-achievements, ffxiv-collect-character";
    }

  } catch (error) {
    results.results.error = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Debug] Error testing ${endpoint}:`, error);
  }

  return NextResponse.json(results);
}