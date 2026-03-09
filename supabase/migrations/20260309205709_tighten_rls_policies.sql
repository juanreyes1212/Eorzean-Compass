/*
  # Tighten RLS Policies

  1. Changes
    - Drop existing overly permissive INSERT policy on `achievement_cache` (WITH CHECK true)
    - Replace with stricter policy requiring valid data (id > 0, non-empty name and category)
    - No schema changes -- only security policy updates

  2. Security
    - achievement_cache INSERT: now validates id > 0, name and category are non-empty
    - All existing SELECT and UPDATE policies remain unchanged
*/

DROP POLICY IF EXISTS "Anon can insert achievement cache" ON achievement_cache;

CREATE POLICY "Anon can insert valid achievement cache"
  ON achievement_cache
  FOR INSERT
  TO anon
  WITH CHECK (id > 0 AND name <> '' AND category <> '');
