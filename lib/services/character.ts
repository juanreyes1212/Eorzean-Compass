import { getStoredCharacter, storeCharacter, addRecentSearch } from '@/lib/storage';
import type { Character, CompletedAchievement } from '@/lib/types';

export interface CharacterSearchResponse {
  character: Character;
  completedAchievements: CompletedAchievement[];
  _isMockData?: boolean;
  _isRealData?: boolean;
  _error?: string;
}

class CharacterService {
  private readonly API_TIMEOUT = 45000; // 45 seconds

  async searchCharacter(name: string, server: string): Promise<CharacterSearchResponse> {
    // Validate inputs
    if (!name?.trim() || !server?.trim()) {
      throw new Error('Character name and server are required');
    }

    // Check cache first
    const cached = this.getCachedCharacter(name, server);
    if (cached) {
      return {
        character: cached,
        completedAchievements: cached.completedAchievements,
      };
    }

    // Fetch from API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.API_TIMEOUT);

    try {
      const response = await fetch('/api/character', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim(), server }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data: CharacterSearchResponse = await response.json();

      if (!data.character?.id) {
        throw new Error('Invalid character data received');
      }

      // Cache the result
      this.cacheCharacter(data.character, data.completedAchievements || []);
      addRecentSearch(name, server);

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      
      throw error;
    }
  }

  getCachedCharacter(name: string, server: string) {
    return getStoredCharacter(name, server);
  }

  private cacheCharacter(character: Character, completedAchievements: CompletedAchievement[]) {
    const characterToStore = {
      ...character,
      completedAchievements,
      lastUpdated: new Date().toISOString(),
    };
    
    storeCharacter(characterToStore);
  }
}

export const characterService = new CharacterService();