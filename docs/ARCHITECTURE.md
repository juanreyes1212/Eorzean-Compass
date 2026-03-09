# Architecture

## System Overview

Eorzean Compass is a Next.js 14 application using the App Router. It fetches character and achievement data from external APIs, scores each achievement with the TSR-G difficulty matrix, and presents filtered, sortable results to the user.

## Data Flow

```
User enters character name + server
  |
  v
/api/character (Next.js API route)
  |-- Searches Lodestone via Nodestone for character profile and Lodestone ID
  |-- If multiple matches: returns possibleMatches array for user selection
  |-- If single match: returns character data to client
  v
/api/achievements (Next.js API route)
  |-- Calls FFXIVCollect /owned and /missing endpoints
  |-- Merges into single list with completion status
  |-- Applies TSR-G scoring to each achievement
  |-- Returns scored achievement list to client
  v
Client-side processing
  |-- Stores in LocalStorage cache (6 hours for both characters and achievements)
  |-- Writes through to Supabase achievement_cache table
  |-- Applies user filters (TSR-G vectors, category, search, completion)
  |-- Generates recommendations via lib/recommendations.ts
  |-- Renders paginated table and recommendation dashboard
```

## Key Modules

### API Layer (`app/api/`)
Server-side routes that proxy external API calls. Handles rate limiting, input validation, and error fallbacks.

### TSR-G Matrix (`lib/tsrg-matrix.ts`)
Scoring algorithm with two modes:
- Manual scores for well-known achievements (lookup table)
- Algorithmic scoring based on achievement metadata (name, description, category, points)

Composite score = T + S + R + G. Tier thresholds: 1 (4-8), 2 (9-16), 3 (17-24), 4 (25+).

### Recommendations Engine (`lib/recommendations.ts`)
Analyzes completed achievements to build a user skill profile, then scores incomplete achievements on:
- Skill match (how well it fits what the user is good at)
- Difficulty progression (slightly harder than current level)
- Category preference
- Rarity (rarer achievements scored higher)

### Storage

**LocalStorage** (`lib/storage.ts`): Client-side caching for characters (6 hour TTL), achievements (6 hour TTL), per-character achievement completions (6 hour TTL), preferences (persistent), and recent searches (last 5).

**Supabase** (`lib/storage-supabase.ts`): Server-side caching for achievement data. Write-through from client when achievements are fetched. Reduces external API load.

### Analytics (`lib/analytics.ts`)
Event tracking with batched writes to Supabase `analytics_events` table. Events are queued client-side and flushed every 5 seconds. Tracks searches, filter usage, achievement views, errors, and Core Web Vitals.

## Database Schema

Three tables in Supabase:
- `achievement_cache`: Cached achievement data with TSR-G scores
- `analytics_events`: Event log for usage tracking
- `qa_test_cases`: Manual QA test status (dev tool)

All tables have RLS enabled. No authentication is currently implemented; access is through the anon key with restrictive policies.

## Component Architecture

Feature components use PascalCase naming. The `components/ui/` directory contains shadcn/ui primitives in kebab-case (maintained separately).

The main achievement page is client-rendered (`ClientAchievementsPage`) and manages all state: character data, achievements, filters, and preferences. Sub-components receive data via props:
- `AchievementsPageHeader`: Character profile and refresh controls
- `AchievementsPageContent`: Tabbed view with recommendations and achievement table
- `AchievementTablePaginated`: Filtered, sorted, paginated achievement list
- `RecommendationsDashboard`: Lazy-loaded recommendation engine output
