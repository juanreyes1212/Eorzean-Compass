// Centralized type definitions for better type safety

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
  icon?: string; // Added icon field
}

export interface AchievementWithStatus extends Achievement {
  isCompleted: boolean;
  completionDate: string | null;
}

export interface TSRGScore {
  time: number;      // 1-10: Time/Grind investment
  skill: number;     // 1-10: Mechanical skill required  
  rng: number;       // 1-10: RNG dependency
  group: number;     // 1-10: Group coordination needed
  composite: number; // Sum of all scores
  tier: number;      // 1-4 difficulty tier
}

export interface AchievementWithTSRG extends AchievementWithStatus {
  tsrg: TSRGScore;
}

// API Response Types
export interface CharacterResponse {
  character: Character;
  completedAchievements: CompletedAchievement[];
  _isMockData?: boolean;
  _isRealData?: boolean;
  _error?: string;
}

export interface AchievementsResponse {
  achievements: Achievement[];
}

// Filter Types
export interface TSRGFilters {
  maxTime: number;
  maxSkill: number;
  maxRng: number;
  maxGroup: number;
  hideCompleted: boolean;
  hideUnobtainable: boolean;
  selectedTiers: number[];
}

// User Preferences
export interface UserPreferences {
  maxTimeScore: number;
  maxSkillScore: number;
  maxRngScore: number;
  maxGroupScore: number;
  preferredCategories: string[];
  excludedCategories: string[];
  hideCompleted: boolean;
  hideUnobtainable: boolean;
  prioritizeRareAchievements: boolean;
  prioritizeHighPoints: boolean;
  selectedTiers: number[]; // Added to preferences
}

// Storage Types
export interface StoredCharacter extends Character {
  completedAchievements: CompletedAchievement[];
  lastUpdated: string;
}

export interface StoredPreferences {
  maxTimeScore: number;
  maxSkillScore: number;
  maxRngScore: number;
  maxGroupScore: number;
  hideCompleted: boolean;
  hideUnobtainable: boolean;
  selectedTiers: number[];
  preferredCategories: string[];
  excludedCategories: string[];
}

// API Error Types
export interface APIError {
  error: string;
  status?: number;
  details?: string;
}

// Component Props Types
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// Utility Types
export type ServerName = 
  | "Adamantoise" | "Cactuar" | "Faerie" | "Gilgamesh" | "Jenova" | "Midgardsormr" | "Sargatanas" | "Siren"
  | "Balmung" | "Brynhildr" | "Coeurl" | "Diabolos" | "Goblin" | "Malboro" | "Mateus" | "Zalera"
  | "Behemoth" | "Excalibur" | "Exodus" | "Famfrit" | "Hyperion" | "Lamia" | "Leviathan" | "Ultros";

export type AchievementCategory = 
  | "Battle" | "Character" | "Items" | "Crafting & Gathering" 
  | "Quests" | "Exploration" | "PvP" | "Grand Company" | "Legacy";

export type DifficultyTier = 1 | 2 | 3 | 4;

export type TSRGVector = 'time' | 'skill' | 'rng' | 'group';