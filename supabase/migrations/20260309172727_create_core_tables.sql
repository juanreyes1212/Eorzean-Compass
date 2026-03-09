/*
  # Core Tables for Eorzean Compass

  1. New Tables
    - `achievement_cache`
      - `id` (integer, primary key) - Achievement ID from FFXIVCollect
      - `name` (text) - Achievement name
      - `description` (text) - Achievement description
      - `category` (text) - Achievement category
      - `points` (integer) - Achievement points
      - `patch` (text) - Game patch version
      - `is_obtainable` (boolean) - Whether achievement can still be obtained
      - `icon` (text) - Achievement icon URL
      - `rarity` (real) - Achievement rarity percentage
      - `tsrg_time` (integer) - TSR-G time score
      - `tsrg_skill` (integer) - TSR-G skill score
      - `tsrg_rng` (integer) - TSR-G RNG score
      - `tsrg_group` (integer) - TSR-G group score
      - `tsrg_composite` (integer) - TSR-G composite score
      - `tsrg_tier` (integer) - TSR-G difficulty tier
      - `cached_at` (timestamptz) - When this entry was cached
    - `analytics_events`
      - `id` (uuid, primary key)
      - `event_type` (text) - Type of event (page_view, search, filter, error)
      - `event_data` (jsonb) - Event payload
      - `session_id` (text) - Browser session identifier
      - `created_at` (timestamptz) - When event occurred
    - `qa_test_cases`
      - `id` (uuid, primary key)
      - `feature` (text) - Feature area being tested
      - `description` (text) - What the test case verifies
      - `status` (text) - pass, fail, pending, or skipped
      - `notes` (text) - Tester notes
      - `tested_at` (timestamptz) - When last tested
      - `created_at` (timestamptz) - When test case was created

  2. Security
    - RLS enabled on all tables
    - analytics_events: anon can insert (write-only for tracking), no reads
    - achievement_cache: anon can select (read cached data)
    - qa_test_cases: anon can select, insert, update (dev tool, no auth)
*/

CREATE TABLE IF NOT EXISTS achievement_cache (
  id integer PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  points integer NOT NULL DEFAULT 0,
  patch text NOT NULL DEFAULT '',
  is_obtainable boolean NOT NULL DEFAULT true,
  icon text DEFAULT '',
  rarity real DEFAULT 0,
  tsrg_time integer NOT NULL DEFAULT 1,
  tsrg_skill integer NOT NULL DEFAULT 1,
  tsrg_rng integer NOT NULL DEFAULT 1,
  tsrg_group integer NOT NULL DEFAULT 1,
  tsrg_composite integer NOT NULL DEFAULT 4,
  tsrg_tier integer NOT NULL DEFAULT 1,
  cached_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE achievement_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cached achievements"
  ON achievement_cache
  FOR SELECT
  TO anon
  USING (cached_at > now() - interval '24 hours');

CREATE POLICY "Anon can insert achievement cache"
  ON achievement_cache
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can update achievement cache"
  ON achievement_cache
  FOR UPDATE
  TO anon
  USING (cached_at < now() - interval '1 hour')
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL DEFAULT '',
  event_data jsonb NOT NULL DEFAULT '{}',
  session_id text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can insert analytics events"
  ON analytics_events
  FOR INSERT
  TO anon
  WITH CHECK (
    event_type <> ''
    AND session_id <> ''
  );

CREATE TABLE IF NOT EXISTS qa_test_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  notes text DEFAULT '',
  tested_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE qa_test_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can read QA test cases"
  ON qa_test_cases
  FOR SELECT
  TO anon
  USING (feature <> '');

CREATE POLICY "Anon can insert QA test cases"
  ON qa_test_cases
  FOR INSERT
  TO anon
  WITH CHECK (
    feature <> ''
    AND description <> ''
  );

CREATE POLICY "Anon can update QA test cases"
  ON qa_test_cases
  FOR UPDATE
  TO anon
  USING (feature <> '')
  WITH CHECK (feature <> '');

CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_achievement_cache_category ON achievement_cache(category);
CREATE INDEX IF NOT EXISTS idx_achievement_cache_tier ON achievement_cache(tsrg_tier);
CREATE INDEX IF NOT EXISTS idx_qa_test_cases_feature ON qa_test_cases(feature);
CREATE INDEX IF NOT EXISTS idx_qa_test_cases_status ON qa_test_cases(status);
