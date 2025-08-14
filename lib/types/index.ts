// Core types for the application

export interface Character {
  id: string;
  name: string;
  server: string;
  avatar: string;
  achievementPoints: number;
  achievementsCompleted: number;
  totalAchievements: number;
}

export interface CompletedAchievement {
  id: number;
  completionDate: string;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  category: string;
  points: number;
  patch: string;
  isObtainable: boolean;
  rarity?: number;
  icon?: string;
}

// Form validation schemas
export interface CharacterSearchForm {
  characterName: string;
  server: string;
}

// API Response types
export interface APIResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// Error types
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}