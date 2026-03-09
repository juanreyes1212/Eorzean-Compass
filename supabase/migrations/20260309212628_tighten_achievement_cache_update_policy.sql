/*
  # Tighten achievement_cache UPDATE policy

  1. Changes
    - Drop existing UPDATE policy that uses `WITH CHECK (true)`
    - Replace with restrictive policy that validates updated data
      matches the same constraints as INSERT (id > 0, name not empty, category not empty)

  2. Security
    - Prevents anon users from writing arbitrary data during updates
    - Maintains the USING guard that only allows updates on stale rows (> 1 hour old)
*/

DROP POLICY IF EXISTS "Anon can update achievement cache" ON achievement_cache;

CREATE POLICY "Anon can update stale achievement cache with valid data"
  ON achievement_cache
  FOR UPDATE
  TO anon
  USING (cached_at < (now() - interval '1 hour'))
  WITH CHECK (id > 0 AND name <> '' AND category <> '');