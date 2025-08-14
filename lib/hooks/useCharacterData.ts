import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { characterService } from '@/lib/services/character';
import type { Character, CompletedAchievement } from '@/lib/types';

export interface UseCharacterDataReturn {
  character: Character | null;
  completedAchievements: CompletedAchievement[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clearError: () => void;
}

export function useCharacterData(name?: string, server?: string): UseCharacterDataReturn {
  const {
    character,
    completedAchievements,
    isLoading,
    error,
    setCharacter,
    setCompletedAchievements,
    setLoading,
    setError,
    clearCharacter,
  } = useAppStore();

  const [shouldFetch, setShouldFetch] = useState(false);

  const fetchCharacterData = useCallback(async () => {
    if (!name || !server) return;

    try {
      setLoading(true);
      setError(null);

      const data = await characterService.searchCharacter(name, server);
      
      setCharacter(data.character);
      setCompletedAchievements(data.completedAchievements || []);
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Try to use cached data as fallback
      const cachedData = characterService.getCachedCharacter(name, server);
      if (cachedData) {
        setCharacter(cachedData);
        setCompletedAchievements(cachedData.completedAchievements);
        setError(`${errorMessage} (Using cached data)`);
      }
    } finally {
      setLoading(false);
    }
  }, [name, server, setCharacter, setCompletedAchievements, setLoading, setError]);

  const refetch = useCallback(async () => {
    await fetchCharacterData();
  }, [fetchCharacterData]);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  // Effect to fetch data when name/server changes
  useEffect(() => {
    if (name && server && shouldFetch) {
      fetchCharacterData();
      setShouldFetch(false);
    }
  }, [name, server, shouldFetch, fetchCharacterData]);

  // Effect to trigger fetch when name/server are provided
  useEffect(() => {
    if (name && server) {
      setShouldFetch(true);
    } else {
      clearCharacter();
    }
  }, [name, server, clearCharacter]);

  return {
    character,
    completedAchievements,
    isLoading,
    error,
    refetch,
    clearError,
  };
}