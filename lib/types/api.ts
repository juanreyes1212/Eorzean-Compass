// Enhanced API type definitions for better type safety

export interface TomestoneCharacterProfile {
  id: number;
  name: string;
  server: string;
  avatar: string;
  achievementPoints: {
    id: number;
    points: number;
    unrankedPoints: number;
    rankPosition: number;
    rankPercent: number;
    cssRankClassName: string;
  } | null;
}

export interface FFXIVCollectAchievement {
  id: number;
  name: string;
  description: string;
  points: number;
  order: number;
  patch: string;
  owned: string; // Rarity percentage
  icon: string;
  category: { id: number; name: string };
  type: { id: number; name: string };
  reward?: any;
}

export interface TomestoneAchievement {
  id: number;
  name: string;
  description: string;
  points: number;
  category: string;
  patch: string;
  icon: string;
  rarity?: number;
}

export interface APIResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  results: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}