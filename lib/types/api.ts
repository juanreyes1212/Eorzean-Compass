export interface FFXIVCollectAchievement {
  id: number;
  name: string;
  description: string;
  points: number;
  order: number;
  patch: string;
  owned: string;
  icon: string;
  category: { id: number; name: string };
  type: { id: number; name: string };
  reward?: any;
}

export interface NodestoneSearchResult {
  ID: string;
  Name: string;
  Server: string;
  Avatar: string;
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
