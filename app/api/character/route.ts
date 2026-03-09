import { NextResponse } from "next/server";
import { CharacterSearch } from '@xivapi/nodestone';
import { CompletedAchievement } from '@/lib/types';
import { validateCharacterName, validateServerName, apiRateLimiter, securityHeaders } from '@/lib/security';

function generateMockCharacterData(name: string, server: string, errorReason?: string) {
  let hash = 0;
  const str = (name + server).toLowerCase();

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  const characterId = Math.abs(hash).toString().padStart(8, '0');

  const completedAchievements: CompletedAchievement[] = [];
  const completionCount = Math.floor(Math.random() * 500) + 200;
  const completedIds = new Set<number>();

  while (completedIds.size < completionCount) {
    const randomId = Math.floor(Math.random() * 2500) + 1;
    completedIds.add(randomId);
  }

  completedIds.forEach(id => {
    completedAchievements.push({
      id,
      completedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    });
  });

  return {
    character: {
      id: characterId,
      name: name,
      server: server,
      avatar: "/placeholder.svg?height=96&width=96&text=Avatar",
      achievementPoints: completedAchievements.length * 10,
      achievementsCompleted: completedAchievements.length,
      totalAchievements: 2500,
      lastUpdated: new Date().toISOString(),
    },
    completedAchievements,
    _isMockData: true,
    _error: errorReason || "Using demo data - Lodestone search is temporarily unavailable."
  };
}

function isNetworkError(error: Error): boolean {
  const networkPatterns = [
    'timeout', 'ECONNREFUSED', 'ENOTFOUND', 'ECONNRESET',
    'EHOSTUNREACH', 'ERR_TLS', 'fetch failed', 'network',
    'ETIMEDOUT', 'EPIPE', 'socket hang up'
  ];
  const msg = error.message.toLowerCase();
  return networkPatterns.some(p => msg.includes(p.toLowerCase()));
}

export async function GET(request: Request) {
  const headers = new Headers(securityHeaders);

  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
  if (!apiRateLimiter.isAllowed(clientIP)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      { status: 429, headers }
    );
  }

  const nameParam = new URL(request.url).searchParams.get('name');
  const serverParam = new URL(request.url).searchParams.get('server');

  if (!nameParam || !serverParam || typeof nameParam !== 'string' || typeof serverParam !== 'string') {
    return NextResponse.json(
      { error: "Valid name and server strings are required" },
      { status: 400, headers }
    );
  }

  const nameValidation = validateCharacterName(nameParam);
  if (!nameValidation.isValid) {
    return NextResponse.json(
      { error: nameValidation.error },
      { status: 400, headers }
    );
  }

  const serverValidation = validateServerName(serverParam);
  if (!serverValidation.isValid) {
    return NextResponse.json(
      { error: serverValidation.error },
      { status: 400, headers }
    );
  }

  const sanitizedName = nameParam.trim();
  const sanitizedServer = serverParam;

  let apiErrorReason: string | undefined;

  try {
    const parser = new CharacterSearch();

    const searchResult: any = await parser.parse({
      params: {},
      query: { name: sanitizedName, server: sanitizedServer }
    } as any);

    const entries: any[] = searchResult?.List || [];

    if (!entries || entries.length === 0) {
      return NextResponse.json(
        { error: "Character not found. Please check the name and server spelling." },
        { status: 404, headers }
      );
    }

    if (entries.length > 1) {
      return NextResponse.json({
        character: null,
        lodestoneId: null,
        possibleMatches: entries.map((char: any) => ({
          id: char.ID,
          name: char.Name,
          server: char.World || sanitizedServer,
          avatar: char.Avatar,
        })),
        message: "Multiple characters found. Please select one."
      }, { headers });
    }

    const char = entries[0];
    const lodestoneId = parseInt(char.ID, 10);

    return NextResponse.json({
      character: {
        id: lodestoneId.toString(),
        name: char.Name,
        server: char.World || sanitizedServer,
        avatar: char.Avatar || "/placeholder.svg?height=96&width=96&text=Avatar",
        achievementPoints: 0,
        achievementsCompleted: 0,
        totalAchievements: 0,
        lastUpdated: new Date().toISOString(),
      },
      lodestoneId: lodestoneId,
      completedAchievements: [],
      _isRealData: true,
      _isMockData: false,
    }, { headers });

  } catch (searchError) {
    console.error("[Character API]", searchError instanceof Error ? searchError.message : searchError);

    if (searchError instanceof Error && isNetworkError(searchError)) {
      return NextResponse.json(
        { error: "The character search service could not be reached. Please check your connection or try again later." },
        { status: 503, headers }
      );
    }

    apiErrorReason = "Lodestone search is temporarily unavailable.";
  }

  const mock = generateMockCharacterData(nameParam, serverParam, apiErrorReason);

  return NextResponse.json({
    character: mock.character,
    lodestoneId: null,
    completedAchievements: mock.completedAchievements,
    _isRealData: false,
    _isMockData: true,
    _error: apiErrorReason || mock._error,
  }, { headers });
}
