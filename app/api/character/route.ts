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

  console.log(`[Character API] Generated mock data for ${name}: ${completedAchievements.length} completed achievements`);

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

export async function GET(request: Request) {
  const headers = new Headers(securityHeaders);

  console.log("[Character API] Starting character search...");

  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
  if (!apiRateLimiter.isAllowed(clientIP)) {
    console.warn(`[Character API] Rate limit exceeded for IP: ${clientIP}`);
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      { status: 429, headers }
    );
  }

  const nameParam = new URL(request.url).searchParams.get('name');
  const serverParam = new URL(request.url).searchParams.get('server');

  console.log(`[Character API] Received request for ${nameParam} on ${serverParam}`);

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

    console.log(`[Character API] Searching Lodestone for "${sanitizedName}" on ${sanitizedServer}`);

    const searchResult: any = await parser.parse({
      params: {},
      query: { name: sanitizedName, server: sanitizedServer }
    } as any);

    const entries: any[] = searchResult?.List || [];
    console.log(`[Character API] Lodestone search returned ${entries.length} results`);

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

    console.log(`[Character API] Single match found: ${char.Name} (ID: ${lodestoneId})`);

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
    console.error("[Character API] Lodestone search failed:", searchError instanceof Error ? searchError.message : searchError);

    if (searchError instanceof Error && (searchError.message.includes('timeout') || searchError.message.includes('ECONNREFUSED'))) {
      return NextResponse.json(
        { error: "The character search service could not be reached. Please check your connection or try again later." },
        { status: 503, headers }
      );
    }

    apiErrorReason = "Lodestone search is temporarily unavailable.";
  }

  console.log("[Character API] Generating mock character data...");
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
