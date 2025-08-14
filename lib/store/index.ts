import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import { AchievementWithTSRG } from '@/lib/tsrg-matrix';

// Character state slice
interface CharacterState {
  character: {
    id: string;
    name: string;
    server: string;
    avatar: string;
    achievementPoints: number;
    achievementsCompleted: number;
    totalAchievements: number;
  } | null;
  completedAchievements: Array<{ id: number; completionDate: string }>;
  isLoading: boolean;
  error: string | null;
  setCharacter: (character: CharacterState['character']) => void;
  setCompletedAchievements: (achievements: CharacterState['completedAchievements']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearCharacter: () => void;
}

// Achievements state slice
interface AchievementsState {
  achievements: AchievementWithTSRG[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  setAchievements: (achievements: AchievementWithTSRG[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAchievements: () => void;
}

// Filters state slice
interface FiltersState {
  maxTime: number;
  maxSkill: number;
  maxRng: number;
  maxGroup: number;
  hideCompleted: boolean;
  hideUnobtainable: boolean;
  selectedTiers: number[];
  categoryFilter: string;
  searchQuery: string;
  setFilter: <K extends keyof Omit<FiltersState, 'setFilter' | 'resetFilters'>>(
    key: K,
    value: FiltersState[K]
  ) => void;
  resetFilters: () => void;
}

// Combined store type
type AppStore = CharacterState & AchievementsState & FiltersState;

const DEFAULT_FILTERS = {
  maxTime: 10,
  maxSkill: 10,
  maxRng: 10,
  maxGroup: 10,
  hideCompleted: false,
  hideUnobtainable: true,
  selectedTiers: [1, 2, 3, 4],
  categoryFilter: 'all',
  searchQuery: '',
};

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Character state
        character: null,
        completedAchievements: [],
        isLoading: false,
        error: null,
        setCharacter: (character) => set({ character }),
        setCompletedAchievements: (completedAchievements) =>
          set({ completedAchievements }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        clearCharacter: () =>
          set({
            character: null,
            completedAchievements: [],
            error: null,
          }),

        // Achievements state
        achievements: [],
        lastFetched: null,
        setAchievements: (achievements) =>
          set({ achievements, lastFetched: Date.now() }),
        clearAchievements: () => set({ achievements: [], lastFetched: null }),

        // Filters state
        ...DEFAULT_FILTERS,
        setFilter: (key, value) => set({ [key]: value }),
        resetFilters: () => set(DEFAULT_FILTERS),
      }),
      {
        name: 'eorzean-compass-store',
        partialize: (state) => ({
          // Only persist filters and last fetched timestamp
          maxTime: state.maxTime,
          maxSkill: state.maxSkill,
          maxRng: state.maxRng,
          maxGroup: state.maxGroup,
          hideCompleted: state.hideCompleted,
          hideUnobtainable: state.hideUnobtainable,
          selectedTiers: state.selectedTiers,
          lastFetched: state.lastFetched,
        }),
      }
    ),
    {
      name: 'eorzean-compass-store',
    }
  )
);

// Selectors for better performance
export const useCharacter = () => useAppStore((state) => state.character);
export const useCompletedAchievements = () =>
  useAppStore((state) => state.completedAchievements);
export const useAchievements = () => useAppStore((state) => state.achievements);
export const useFilters = () =>
  useAppStore((state) => ({
    maxTime: state.maxTime,
    maxSkill: state.maxSkill,
    maxRng: state.maxRng,
    maxGroup: state.maxGroup,
    hideCompleted: state.hideCompleted,
    hideUnobtainable: state.hideUnobtainable,
    selectedTiers: state.selectedTiers,
    categoryFilter: state.categoryFilter,
    searchQuery: state.searchQuery,
  }));