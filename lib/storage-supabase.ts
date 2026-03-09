import { supabase } from './supabase';
import { AchievementWithTSRG } from './types';

export async function getCachedAchievementsFromSupabase(): Promise<AchievementWithTSRG[] | null> {
  try {
    const { data, error } = await supabase
      .from('achievement_cache')
      .select('*')
      .order('id');

    if (error || !data || data.length === 0) return null;

    return data.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      points: row.points,
      patch: row.patch,
      isObtainable: row.is_obtainable,
      icon: row.icon,
      rarity: row.rarity,
      isCompleted: false,
      tsrg: {
        time: row.tsrg_time,
        skill: row.tsrg_skill,
        rng: row.tsrg_rng,
        group: row.tsrg_group,
        composite: row.tsrg_composite,
        tier: row.tsrg_tier,
      },
    }));
  } catch {
    return null;
  }
}

export async function cacheAchievementsToSupabase(
  achievements: AchievementWithTSRG[]
): Promise<boolean> {
  try {
    const rows = achievements.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      category: a.category,
      points: a.points,
      patch: a.patch,
      is_obtainable: a.isObtainable,
      icon: a.icon || '',
      rarity: a.rarity || 0,
      tsrg_time: a.tsrg.time,
      tsrg_skill: a.tsrg.skill,
      tsrg_rng: a.tsrg.rng,
      tsrg_group: a.tsrg.group,
      tsrg_composite: a.tsrg.composite,
      tsrg_tier: a.tsrg.tier,
      cached_at: new Date().toISOString(),
    }));

    const batchSize = 500;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await supabase
        .from('achievement_cache')
        .upsert(batch, { onConflict: 'id' });
      if (error) {
        console.warn('Supabase cache write failed for batch:', error.message);
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}
