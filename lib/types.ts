// Character types
export interface Character {
  id: string;
  name: string;
  server: string;
  avatar: string;
  achievementPoints: number;
  achievementsCompleted: number;
  totalAchievements: number;
}

// Achievement types
export interface Achievement {
  id: number;
  name: string;
  description: string;
  category: string;
  points: number;
  patch: string;
  isObtainable: boolean;
}

export interface CompletedAchievement {
  id: number;
  completionDate: string;
}

export interface AchievementWithStatus extends Achievement {
  isCompleted: boolean;
  completionDate: string | null;
}

// API response types
export interface CharacterResponse {
  character: Character;
  completedAchievements: CompletedAchievement[];
}

export interface AchievementsResponse {
  achievements: Achievement[];
}
