import { 
  AchievementWithTSRG, 
  TSRGScore, 
  UserPreferences,
  RecommendationReason, // Imported from centralized types
  AchievementRecommendation, // Imported from centralized types
  UserProgress, // Imported from centralized types
  AchievementProject, // Imported from centralized types
  CompletedAchievement // Import CompletedAchievement
} from './types'; // Import types from centralized location

// Calculate user's skill profile based on completed achievements
export function analyzeUserSkillProfile(completedAchievements: AchievementWithTSRG[]): {
  averageTime: number;
  averageSkill: number;
  averageRng: number;
  averageGroup: number;
  strongestAreas: string[];
  preferredDifficulty: number;
} {
  if (completedAchievements.length === 0) {
    return {
      averageTime: 5,
      averageSkill: 5,
      averageRng: 5,
      averageGroup: 5,
      strongestAreas: [],
      preferredDifficulty: 2,
    };
  }

  const totals = completedAchievements.reduce(
    (acc, achievement) => ({
      time: acc.time + achievement.tsrg.time,
      skill: acc.skill + achievement.tsrg.skill,
      rng: acc.rng + achievement.tsrg.rng,
      group: acc.group + achievement.tsrg.group,
      difficulty: acc.difficulty + achievement.tsrg.tier,
    }),
    { time: 0, skill: 0, rng: 0, group: 0, difficulty: 0 }
  );

  const count = completedAchievements.length;
  const averages = {
    averageTime: Math.round(totals.time / count),
    averageSkill: Math.round(totals.skill / count),
    averageRng: Math.round(totals.rng / count),
    averageGroup: Math.round(totals.group / count),
    preferredDifficulty: Math.round(totals.difficulty / count),
  };

  // Determine strongest areas (above average)
  const strongestAreas: string[] = [];
  if (averages.averageTime >= 7) strongestAreas.push('Time Investment');
  if (averages.averageSkill >= 7) strongestAreas.push('High Skill');
  if (averages.averageRng >= 6) strongestAreas.push('RNG Tolerance');
  if (averages.averageGroup >= 6) strongestAreas.push('Group Content');

  return {
    ...averages,
    strongestAreas,
  };
}

// Generate personalized recommendations
export function generateRecommendations(
  allAchievements: AchievementWithTSRG[],
  completedAchievements: CompletedAchievement[],
  preferences: UserPreferences,
  maxRecommendations: number = 10
): AchievementRecommendation[] {
  const completedIds = new Set(completedAchievements.map(a => a.id));
  
  // Filter all achievements to get only the ones that are actually completed and have TSRG data
  const completedAchievementsWithTSRG = allAchievements.filter(a => completedIds.has(a.id));
  const userProfile = analyzeUserSkillProfile(completedAchievementsWithTSRG);
  
  // Filter available achievements
  const availableAchievements = allAchievements.filter(achievement => {
    // Skip completed achievements
    if (preferences.hideCompleted && completedIds.has(achievement.id)) return false;
    
    // Skip unobtainable if preference is set
    if (preferences.hideUnobtainable && !achievement.isObtainable) return false;
    
    // Skip excluded categories
    if (preferences.excludedCategories.includes(achievement.category)) return false;
    
    // Check TSR-G limits
    if (achievement.tsrg.time > preferences.maxTimeScore) return false;
    if (achievement.tsrg.skill > preferences.maxSkillScore) return false;
    if (achievement.tsrg.rng > preferences.maxRngScore) return false;
    if (achievement.tsrg.group > preferences.maxGroupScore) return false;

    // Check selected tiers
    if (preferences.selectedTiers && !preferences.selectedTiers.includes(achievement.tsrg.tier)) return false;
    
    return true;
  });

  // Score each available achievement
  const scoredAchievements = availableAchievements.map(achievement => {
    const reasons: RecommendationReason[] = [];
    let score = 0;

    // Base score from achievement points
    score += achievement.points * 0.1;

    // Skill match bonus
    const skillDifference = Math.abs(achievement.tsrg.skill - userProfile.averageSkill);
    if (skillDifference <= 2) {
      const bonus = 10 - skillDifference * 2;
      score += bonus;
      reasons.push({
        type: 'skill_match',
        description: `Matches your skill level (${userProfile.averageSkill}/10)`,
        weight: bonus,
      });
    }

    // Difficulty progression bonus
    const difficultyDifference = achievement.tsrg.tier - userProfile.preferredDifficulty;
    if (difficultyDifference === 0) {
      score += 15;
      reasons.push({
        type: 'completion_rate',
        description: `Perfect difficulty match for your experience`,
        weight: 15,
      });
    } else if (difficultyDifference === 1) {
      score += 10;
      reasons.push({
        type: 'completion_rate',
        description: `Slightly more challenging than your usual achievements`,
        weight: 10,
      });
    }

    // Category preference bonus
    if (preferences.preferredCategories.includes(achievement.category)) {
      score += 12;
      reasons.push({
        type: 'category_preference',
        description: `Matches your preferred category: ${achievement.category}`,
        weight: 12,
      });
    }

    // Time efficiency bonus (lower time scores are better for efficiency)
    if (achievement.tsrg.time <= 4) {
      const bonus = 8 - achievement.tsrg.time;
      score += bonus;
      reasons.push({
        type: 'time_efficient',
        description: `Can be completed relatively quickly`,
        weight: bonus,
      });
    }

    // Points efficiency bonus
    if (preferences.prioritizeHighPoints && achievement.points >= 20) {
      score += 8;
      reasons.push({
        type: 'points_efficient',
        description: `High point value (${achievement.points} points)`,
        weight: 8,
      });
    }

    // Rarity bonus
    if (preferences.prioritizeRareAchievements && achievement.rarity && achievement.rarity < 5) {
      score += 15;
      reasons.push({
        type: 'rarity',
        description: `Very rare achievement (${achievement.rarity.toFixed(1)}% completion rate)`,
        weight: 15,
      });
    } else if (preferences.prioritizeRareAchievements && achievement.rarity && achievement.rarity < 15) {
      score += 8;
      reasons.push({
        type: 'rarity',
        description: `Uncommon achievement (${achievement.rarity.toFixed(1)}% completion rate)`,
        weight: 8,
      });
    }

    // Similar achievements bonus (if user has completed similar ones)
    const similarCompleted = completedAchievementsWithTSRG.filter(completed => 
      completed.category === achievement.category &&
      Math.abs(completed.tsrg.composite - achievement.tsrg.composite) <= 5
    );
    
    if (similarCompleted.length > 0) {
      const bonus = Math.min(similarCompleted.length * 3, 12);
      score += bonus;
      reasons.push({
        type: 'similar_achievements',
        description: `Similar to ${similarCompleted.length} achievement${similarCompleted.length > 1 ? 's' : ''} you've completed`,
        weight: bonus,
      });
    }

    // Estimate time to complete
    let estimatedTime = 'Unknown';
    if (achievement.tsrg.time <= 2) estimatedTime = '1-2 hours';
    else if (achievement.tsrg.time <= 4) estimatedTime = '1-3 days';
    else if (achievement.tsrg.time <= 6) estimatedTime = '1-2 weeks';
    else if (achievement.tsrg.time <= 8) estimatedTime = '1-2 months';
    else estimatedTime = '3+ months';

    return {
      achievement,
      score,
      reasons: reasons.sort((a, b) => b.weight - a.weight),
      estimatedTimeToComplete: estimatedTime,
    };
  });

  // Sort by score and return top recommendations
  return scoredAchievements
    .sort((a, b) => b.score - a.score)
    .slice(0, maxRecommendations);
}

// Generate achievement projects (grouped related achievements)
export function generateAchievementProjects(
  allAchievements: AchievementWithTSRG[],
  completedIds: Set<number>
): AchievementProject[] {
  const projects: AchievementProject[] = [];

  // Group by category and similar difficulty
  const categoryGroups = allAchievements.reduce((groups, achievement) => {
    const key = achievement.category;
    if (!groups[key]) groups[key] = [];
    groups[key].push(achievement);
    return groups;
  }, {} as Record<string, AchievementWithTSRG[]>);

  Object.entries(categoryGroups).forEach(([category, achievements]) => {
    // Create difficulty-based projects within each category
    const tierGroups = achievements.reduce((groups, achievement) => {
      const tier = achievement.tsrg.tier;
      if (!groups[tier]) groups[tier] = [];
      groups[tier].push(achievement);
      return groups;
    }, {} as Record<number, AchievementWithTSRG[]>);

    Object.entries(tierGroups).forEach(([tier, tierAchievements]) => {
      if (tierAchievements.length >= 3) { // Only create projects with 3+ achievements
        const tierNum = parseInt(tier);
        const completedInProject = tierAchievements.filter(a => completedIds.has(a.id));
        const totalPoints = tierAchievements.reduce((sum, a) => sum + a.points, 0);
        const avgTime = tierAchievements.reduce((sum, a) => sum + a.tsrg.time, 0) / tierAchievements.length;
        
        let estimatedTime = 'Unknown';
        if (avgTime <= 3) estimatedTime = '1-2 weeks';
        else if (avgTime <= 5) estimatedTime = '1-2 months';
        else if (avgTime <= 7) estimatedTime = '3-6 months';
        else estimatedTime = '6+ months';

        const tierNames = ['', 'Foundational', 'Systematic', 'Dedicated', 'Apex'];
        
        projects.push({
          id: `${category.toLowerCase().replace(/\s+/g, '-')}-tier-${tier}`,
          name: `${category} - ${tierNames[tierNum]} Mastery`,
          description: `Complete all ${tierNames[tierNum].toLowerCase()} ${category.toLowerCase()} achievements. This project contains ${tierAchievements.length} achievements worth ${totalPoints} points.`,
          category,
          achievements: tierAchievements,
          totalPoints,
          estimatedTime,
          difficulty: tierNum,
          completionRate: (completedInProject.length / tierAchievements.length) * 100,
          isCompleted: completedInProject.length === tierAchievements.length,
        });
      }
    });
  });

  // Sort projects by completion rate (partially completed first) and difficulty
  return projects.sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1; // Incomplete first
    }
    if (a.completionRate !== b.completionRate) {
      return b.completionRate - a.completionRate; // Higher completion rate first
    }
    return a.difficulty - b.difficulty; // Lower difficulty first
  });
}