# Eorzean Compass

FFXIV achievement tracker with difficulty analysis.

## What It Does

Eorzean Compass lets Final Fantasy XIV players look up any character and see their achievement progress. Each achievement is scored using the TSR-G Matrix -- a four-axis difficulty rating covering Time investment, Skill required, RNG dependence, and Group coordination. The app generates personalized recommendations based on what a player has already completed and groups related achievements into trackable projects.

## TSR-G Matrix

Every achievement gets a score from 1-10 on four vectors:

| Vector | Measures |
|--------|----------|
| Time | Grinding and time commitment |
| Skill | Mechanical execution required |
| RNG | Dependence on random chance |
| Group | Coordination with other players |

The composite score determines the difficulty tier:

- **Tier 1 -- Foundational** (4-8): Story progress and basic milestones
- **Tier 2 -- Systematic** (9-16): Regular engagement, moderate effort
- **Tier 3 -- Dedicated** (17-24): Significant investment and focus
- **Tier 4 -- Apex** (25+): Extreme difficulty or time commitment

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui (Radix primitives)
- Supabase (database, analytics, caching)
- Vitest (unit testing)

## Data Sources

- [Tomestone.gg](https://tomestone.gg) -- Character profiles and Lodestone IDs
- [FFXIVCollect](https://ffxivcollect.com) -- Achievement data and completion status

## Project Structure

```
app/                    Route handlers and pages
  api/                  Server-side API routes
  achievements/         Achievement tracking page
  dev/tests/            QA test dashboard (dev only)
components/             React components (PascalCase)
  ui/                   shadcn/ui primitives (kebab-case)
  achievement-table/    Table sub-components
  achievements-page/    Page section components
lib/                    Business logic and utilities
  tsrg-matrix.ts        Scoring algorithm
  recommendations.ts    Recommendation engine
  storage.ts            LocalStorage caching
  storage-supabase.ts   Supabase caching layer
  analytics.ts          Event tracking (Supabase-backed)
  api-client.ts         HTTP client with retry logic
  security.ts           Input validation and rate limiting
  supabase.ts           Database client singleton
tests/                  Vitest unit tests
```

## License

Mozilla Public License Version 2.0

## Disclaimer

Not affiliated with Square Enix. FINAL FANTASY XIV (c) SQUARE ENIX CO., LTD. All Rights Reserved.
