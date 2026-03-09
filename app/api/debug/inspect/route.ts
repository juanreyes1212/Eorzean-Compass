import { NextResponse } from "next/server";
import { EXTERNAL_APIS } from '@/lib/constants';

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
      case 'ffxiv-collect-achievements': {
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
      }

      case 'ffxiv-collect-character': {
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
      }

      case 'nodestone-search': {
        if (!name || !server) {
          results.results.error = "Name and server are required for Nodestone search";
          break;
        }

        const { CharacterSearch } = await import('@xivapi/nodestone');
        const parser = new CharacterSearch();
        const searchResult: any = await parser.parse({
          params: {},
          query: { name, server }
        } as any);

        const entries = searchResult?.List || [];
        results.results.nodestoneSearch = {
          status: 200,
          statusText: 'OK',
          entriesCount: entries.length,
          pagination: searchResult?.Pagination,
          entries: entries.map((e: any) => ({
            ID: e.ID,
            Name: e.Name,
            World: e.World,
            Avatar: e.Avatar
          }))
        };
        break;
      }

      default:
        results.results.error = "Invalid endpoint. Use: ffxiv-collect-achievements, ffxiv-collect-character, nodestone-search";
    }

  } catch (error) {
    results.results.error = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Debug] Error testing ${endpoint}:`, error);
  }

  return NextResponse.json(results);
}
