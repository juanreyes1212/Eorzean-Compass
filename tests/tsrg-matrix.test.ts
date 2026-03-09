import { describe, it, expect } from 'vitest';
import { calculateTSRGScore, getTierName, getTierColor, getVectorName, getVectorColor } from '@/lib/tsrg-matrix';
import { AchievementWithStatus } from '@/lib/types';

function makeAchievement(overrides: Partial<AchievementWithStatus> = {}): AchievementWithStatus {
  return {
    id: 9999,
    name: 'Test Achievement',
    description: 'A test achievement',
    category: 'Battle',
    points: 5,
    patch: '6.0',
    isObtainable: true,
    isCompleted: false,
    ...overrides,
  };
}

describe('calculateTSRGScore', () => {
  it('returns manual scores for known achievement IDs', () => {
    const achievement = makeAchievement({ id: 1 });
    const score = calculateTSRGScore(achievement);
    expect(score.time).toBe(2);
    expect(score.skill).toBe(1);
    expect(score.rng).toBe(1);
    expect(score.group).toBe(1);
    expect(score.composite).toBe(5);
    expect(score.tier).toBe(1);
  });

  it('calculates tier 4 for apex manual scores', () => {
    const achievement = makeAchievement({ id: 1000 });
    const score = calculateTSRGScore(achievement);
    expect(score.composite).toBe(28);
    expect(score.tier).toBe(4);
  });

  it('uses algorithmic scoring for unknown IDs', () => {
    const achievement = makeAchievement({ id: 99999 });
    const score = calculateTSRGScore(achievement);
    expect(score.time).toBeGreaterThanOrEqual(1);
    expect(score.skill).toBeGreaterThanOrEqual(1);
    expect(score.rng).toBeGreaterThanOrEqual(1);
    expect(score.group).toBeGreaterThanOrEqual(1);
    expect(score.composite).toBe(score.time + score.skill + score.rng + score.group);
  });

  it('scores high time for achievements with large numbers in name', () => {
    const achievement = makeAchievement({ name: 'Complete 10000 FATEs' });
    const score = calculateTSRGScore(achievement);
    expect(score.time).toBe(10);
  });

  it('scores high skill for savage content', () => {
    const achievement = makeAchievement({ name: 'Clear Savage Raid', category: 'Battle' });
    const score = calculateTSRGScore(achievement);
    expect(score.skill).toBe(10);
  });

  it('scores high rng for luck-based achievements', () => {
    const achievement = makeAchievement({ name: 'The Lucky One', description: 'Win the lottery' });
    const score = calculateTSRGScore(achievement);
    expect(score.rng).toBe(10);
  });

  it('scores high group for raid content', () => {
    const achievement = makeAchievement({ category: 'Battle - Raid', description: 'Complete with 8 players in full party' });
    const score = calculateTSRGScore(achievement);
    expect(score.group).toBe(8);
  });

  it('assigns correct tier boundaries', () => {
    const tier1 = makeAchievement({ id: 1 });
    expect(calculateTSRGScore(tier1).tier).toBe(1);

    const tier2 = makeAchievement({ id: 100 });
    expect(calculateTSRGScore(tier2).tier).toBe(2);

    const tier3 = makeAchievement({ id: 500 });
    expect(calculateTSRGScore(tier3).tier).toBe(3);

    const tier4 = makeAchievement({ id: 1003 });
    expect(calculateTSRGScore(tier4).tier).toBe(4);
  });
});

describe('getTierName', () => {
  it('returns correct names for all tiers', () => {
    expect(getTierName(1)).toBe('Foundational');
    expect(getTierName(2)).toBe('Systematic');
    expect(getTierName(3)).toBe('Dedicated');
    expect(getTierName(4)).toBe('Apex');
  });

  it('returns Unknown for invalid tier', () => {
    expect(getTierName(0)).toBe('Unknown');
    expect(getTierName(5)).toBe('Unknown');
  });
});

describe('getTierColor', () => {
  it('returns a string for each tier', () => {
    expect(typeof getTierColor(1)).toBe('string');
    expect(typeof getTierColor(2)).toBe('string');
    expect(typeof getTierColor(3)).toBe('string');
    expect(typeof getTierColor(4)).toBe('string');
  });
});

describe('getVectorName', () => {
  it('returns human-readable vector names', () => {
    expect(getVectorName('time')).toBe('Time/Grind');
    expect(getVectorName('skill')).toBe('Skill');
    expect(getVectorName('rng')).toBe('RNG');
    expect(getVectorName('group')).toBe('Group');
  });
});

describe('getVectorColor', () => {
  it('returns color strings for each vector', () => {
    expect(getVectorColor('time', 5)).toContain('text-');
    expect(getVectorColor('skill', 5)).toContain('text-');
    expect(getVectorColor('rng', 5)).toContain('text-');
    expect(getVectorColor('group', 5)).toContain('text-');
  });
});
