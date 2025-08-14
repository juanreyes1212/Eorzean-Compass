import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { achievementsService } from '@/lib/services/achievements';
import { calculateTSRGScore, type AchievementWithTSRG } from '@/lib/tsrg-matrix';
import type { CompletedAchievement } from '@/lib/types';

export interface UseAchievementsReturn {
  achievements: AchievementWithTSRG[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clearError: () => void;
}

export function useAchievements(completedAchievements: CompletedAchievement[] = []): UseAchievementsReturn {
  const {
    achievements: storedAchievements,
    isLoading,
    error,
    lastFetched,
    setAchievements,
    setLoading,
    setError,
  } = useAppStore();

  const [shouldFetch, setShouldFetch] = useState(false);

  const fetchAchievements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we have recent cached data
      const now = Date.now();
      const cacheAge = lastFetched ? now - lastFetched : Infinity;
      const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

      if (storedAchievements.length > 0 && cacheAge < CACHE_DURATION) {
        setLoading(false);
        return;
      }

      const achievements = await achievementsService.getAllAchievements();
      setAchievements(achievements);
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Failed to load achievements';
      setError(errorMessage);
      
      // Use cached data if available
      if (storedAchievements.length === 0) {
        const cachedAchievements = achievementsService.getCachedAchievements();
        if (cachedAchievements) {
          setAchievements(cachedAchievements);
          setError(`${errorMessage} (Using cached data)`);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [storedAchievements.length, lastFetched, setAchievements, setLoading, setError]);

  const refetch = useCallback(async () => {
    setShouldFetch(true);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  // Process achievements with completion status
  const processedAchievements = useMemo(() => {
    if (storedAchievements.length === 0) return [];

    const completedIds = new Set(completedAchievements.map(comp => comp.id));
    const completedMap = new Map(
      completedAchievements.map(comp => [comp.id, comp.completionDate])
    );

    return storedAchievements.map(achievement => ({
      ...achievement,
      isCompleted: completedIds.has(achievement.id),
      completionDate: completedMap.get(achievement.id) || null,
      tsrg: achievement.tsrg || calculateTSRGScore(achievement),
    }));
  }, [storedAchievements, completedAchievements]);

  // Effect to fetch achievements
  useEffect(() => {
    if (shouldFetch || (storedAchievements.length === 0 && !isLoading)) {
      fetchAchievements();
      setShouldFetch(false);
    }
  }, [shouldFetch, storedAchievements.length, isLoading, fetchAchievements]);

  return {
    achievements: processedAchievements,
    isLoading,
    error,
    refetch,
    clearError,
  };
}