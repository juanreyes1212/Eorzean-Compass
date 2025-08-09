export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tracked_characters: {
        Row: {
          id: string;
          user_id: string;
          character_name: string;
          server: string;
          lodestone_id: string;
          avatar_url: string | null;
          achievement_points: number;
          achievements_completed: number;
          total_achievements: number;
          last_updated: string;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          character_name: string;
          server: string;
          lodestone_id: string;
          avatar_url?: string | null;
          achievement_points?: number;
          achievements_completed?: number;
          total_achievements?: number;
          last_updated?: string;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          character_name?: string;
          server?: string;
          lodestone_id?: string;
          avatar_url?: string | null;
          achievement_points?: number;
          achievements_completed?: number;
          total_achievements?: number;
          last_updated?: string;
          is_primary?: boolean;
          created_at?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          max_time_score: number;
          max_skill_score: number;
          max_rng_score: number;
          max_group_score: number;
          hide_unobtainable: boolean;
          hide_completed: boolean;
          preferred_categories: string[];
          excluded_categories: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          max_time_score?: number;
          max_skill_score?: number;
          max_rng_score?: number;
          max_group_score?: number;
          hide_unobtainable?: boolean;
          hide_completed?: boolean;
          preferred_categories?: string[];
          excluded_categories?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          max_time_score?: number;
          max_skill_score?: number;
          max_rng_score?: number;
          max_group_score?: number;
          hide_unobtainable?: boolean;
          hide_completed?: boolean;
          preferred_categories?: string[];
          excluded_categories?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      character_achievements: {
        Row: {
          id: string;
          character_id: string;
          achievement_id: number;
          completion_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          character_id: string;
          achievement_id: number;
          completion_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          character_id?: string;
          achievement_id?: number;
          completion_date?: string;
          created_at?: string;
        };
      };
    };
  };
}
