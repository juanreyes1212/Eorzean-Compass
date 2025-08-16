// TSR-G Difficulty Matrix Implementation
// Time, Skill, RNG, Group Dependency scoring system

import { TSRGScore, AchievementWithTSRG } from './types'; // Import types from centralized location

// Manual scores for key achievements based on the document
const MANUAL_SCORES: Record<number, Omit<TSRGScore, 'composite' | 'tier'>> = {
  // Tier 1 Examples (Foundational)
  1: { time: 2, skill: 1, rng: 1, group: 1 }, // Warrior of Light (5 total)
  2: { time: 1, skill: 1, rng: 1, group: 2 }, // Basic dungeon clear (5 total)
  
  // Tier 2 Examples (Systematic)
  100: { time: 7, skill: 2, rng: 1, group: 1 }, // Mastering War V (11 total)
  101: { time: 4, skill: 3, rng: 2, group: 3 }, // Regular raid clear (12 total)
  
  // Tier 3 Examples (Dedicated)  
  500: { time: 8, skill: 4, rng: 2, group: 3 }, // Relic Weapon (17 total)
  600: { time: 9, skill: 3, rng: 1, group: 1 }, // Destiny's Child (14 total)
  601: { time: 6, skill: 6, rng: 3, group: 6 }, // Savage raid clear (21 total)
  
  // Tier 4 Examples (Apex)
  1000: { time: 9, skill: 10, rng: 8, group: 1 }, // The Necromancer (28 total)
  1001: { time: 10, skill: 6, rng: 1, group: 8 }, // Leader of the Pack (25 total)
  1002: { time: 8, skill: 3, rng: 10, group: 7 }, // The Luckiest of Ladies (28 total)
  1003: { time: 10, skill: 10, rng: 2, group: 8 }, // Ultimate Raid (30 total)
  1004: { time: 10, skill: 2, rng: 1, group: 1 }, // Levequest grind (14 total - should be tier 2)
  1005: { time: 10, skill: 4, rng: 3, group: 6 }, // S-Rank Hunt (23 total - should be tier 3)
};

// Algorithmic scoring based on achievement metadata
function calculateAlgorithmicScore(achievement: any): Omit<TSRGScore, 'composite' | 'tier'> {
  let time = 1;
  let skill = 1; 
  let rng = 1;
  let group = 1;

  const name = achievement.name.toLowerCase();
  const description = achievement.description.toLowerCase();
  const category = achievement.category.toLowerCase();
  const points = achievement.points || 0;

  // Time scoring based on keywords and points
  if (name.includes('5000') || name.includes('10000')) time = 10;
  else if (name.includes('3000') || name.includes('1000')) time = 8;
  else if (name.includes('500') || name.includes('100')) time = 6;
  else if (points >= 20) time = 7;
  else if (points >= 10) time = 4;
  else if (points >= 5) time = 2;

  // Additional time indicators
  if (description.includes('complete') && description.includes('all')) time = Math.max(time, 6);
  if (name.includes('master') || name.includes('complete')) time = Math.max(time, 5);

  // Skill scoring based on content type
  if (category.includes('battle')) {
    if (name.includes('savage') || name.includes('ultimate')) skill = 10;
    else if (name.includes('extreme')) skill = 8;
    else if (name.includes('solo')) skill = 9;
    else if (category.includes('raid')) skill = 6;
    else if (category.includes('trial')) skill = 4;
    else skill = 3;
  }

  if (category.includes('pvp')) {
    skill = Math.max(skill, 5);
    if (name.includes('feast') || name.includes('ranked')) skill = 8;
  }

  if (name.includes('necromancer') || name.includes('lone hero')) skill = 10;

  // RNG scoring
  if (name.includes('lucky') || name.includes('fortune')) rng = 10;
  if (description.includes('rare') || description.includes('chance')) rng = Math.max(rng, 6);
  if (category.includes('treasure')) rng = Math.max(rng, 8);
  if (name.includes('cactpot') || name.includes('lottery')) rng = 10;
  if (category.includes('fishing') && points >= 10) rng = Math.max(rng, 5);

  // Group dependency scoring
  if (category.includes('raid')) {
    if (name.includes('savage') || name.includes('ultimate')) group = 8;
    else group = 6;
  }
  if (category.includes('pvp') && name.includes('win')) group = Math.max(group, 7);
  if (name.includes('static') || name.includes('party')) group = Math.max(group, 6);
  if (description.includes('8 players') || description.includes('full party')) group = 8;

  return { time, skill, rng, group };
}

// Calculate composite score and tier
function calculateCompositeAndTier(scores: Omit<TSRGScore, 'composite' | 'tier'>): TSRGScore {
  const composite = scores.time + scores.skill + scores.rng + scores.group;
  
  let tier: number;
  if (composite <= 8) tier = 1;      // Foundational Milestones (4-8)
  else if (composite <= 16) tier = 2; // Systematic Engagement (9-16)  
  else if (composite <= 24) tier = 3; // Dedicated Pursuits (17-24)
  else tier = 4;                      // Apex Challenges (25+)

  return {
    ...scores,
    composite,
    tier
  };
}

// Main scoring function - hybrid approach
export function calculateTSRGScore(achievement: any): TSRGScore {
  // Check for manual score first
  const manualScore = MANUAL_SCORES[achievement.id];
  
  if (manualScore) {
    return calculateCompositeAndTier(manualScore);
  }
  
  // Fall back to algorithmic scoring
  const algorithmicScore = calculateAlgorithmicScore(achievement);
  return calculateCompositeAndTier(algorithmicScore);
}

// Helper functions for UI with compass theme colors
export function getTierName(tier: number): string {
  switch (tier) {
    case 1: return 'Foundational';
    case 2: return 'Systematic'; 
    case 3: return 'Dedicated';
    case 4: return 'Apex';
    default: return 'Unknown';
  }
}

export function getTierColor(tier: number): string {
  switch (tier) {
    case 1: return 'tier-foundational'; // Earth brown
    case 2: return 'tier-systematic';   // Compass blue
    case 3: return 'tier-dedicated';    // Gold
    case 4: return 'tier-apex';         // Gold to blue gradient
    default: return 'bg-silver-500';
  }
}

export function getVectorName(vector: keyof Omit<TSRGScore, 'composite' | 'tier'>): string {
  switch (vector) {
    case 'time': return 'Time/Grind';
    case 'skill': return 'Skill';
    case 'rng': return 'RNG';
    case 'group': return 'Group';
    default: return vector;
  }
}

export function getVectorColor(vector: keyof Omit<TSRGScore, 'composite' | 'tier'>, score: number): string {
  // Use compass theme colors for vectors
  switch (vector) {
    case 'time': return 'text-gold-400';      // Gold for time
    case 'skill': return 'text-compass-400';  // Blue for skill
    case 'rng': return 'text-earth-400';      // Earth for RNG
    case 'group': return 'text-silver-400';   // Silver for group
    default: return 'text-compass-400';
  }
}