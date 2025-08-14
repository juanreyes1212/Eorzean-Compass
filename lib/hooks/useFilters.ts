import { useCallback, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import type { AchievementWithTSRG } from '@/lib/tsrg-matrix';

export interface FilterOptions {
  maxTime: number;
  maxSkill: number;
  maxRng: number;
  maxGroup: number;
  hideCompleted: boolean;
  hideUnobtainable: boolean;
  selectedTiers: number[];
  categoryFilter: string;
  searchQuery: string;
}

export interface UseFiltersReturn {
  filters: FilterOptions;
  setFilter: <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => void;
  resetFilters: () => void;
  applyFilters: (achievements: AchievementWithTSRG[]) => AchievementWithTSRG[];
}

export function useFilters(): UseFiltersReturn {
  const {
    maxTime,
    maxSkill,
    maxRng,
    maxGroup,
    hideCompleted,
    hideUnobtainable,
    selectedTiers,
    categoryFilter,
    searchQuery,
    setFilter,
    resetFilters,
  } = useAppStore();

  const filters = useMemo(() => ({
    maxTime,
    maxSkill,
    maxRng,
    maxGroup,
    hideCompleted,
    hideUnobtainable,
    selectedTiers,
    categoryFilter,
    searchQuery,
  }), [
    maxTime,
    maxSkill,
    maxRng,
    maxGroup,
    hideCompleted,
    hideUnobtainable,
    selectedTiers,
    categoryFilter,
    searchQuery,
  ]);

  const applyFilters = useCallback((achievements: AchievementWithTSRG[]) => {
    return achievements.filter(achievement => {
      // TSR-G vector limits
      if (achievement.tsrg.time > maxTime) return false;
      if (achievement.tsrg.skill > maxSkill) return false;
      if (achievement.tsrg.rng > maxRng) return false;
      if (achievement.tsrg.group > maxGroup) return false;

      // Tier selection
      if (!selectedTiers.includes(achievement.tsrg.tier)) return false;

      // Completion filter
      if (hideCompleted && achievement.isCompleted) return false;

      // Obtainable filter
      if (hideUnobtainable && !achievement.isObtainable) return false;

      // Category filter
      if (categoryFilter !== 'all' && !achievement.category.toLowerCase().includes(categoryFilter.toLowerCase())) {
        return false;
      }

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = achievement.name.toLowerCase().includes(query);
        const matchesDescription = achievement.description.toLowerCase().includes(query);
        if (!matchesName && !matchesDescription) return false;
      }

      return true;
    });
  }, [maxTime, maxSkill, maxRng, maxGroup, hideCompleted, hideUnobtainable, selectedTiers, categoryFilter, searchQuery]);

  return {
    filters,
    setFilter,
    resetFilters,
    applyFilters,
  };
}