// Local storage utilities for caching and preferences

import { STORAGE_KEYS, CACHE_DURATION, DEFAULT_PREFERENCES } from './constants';
import { StoredCharacter, UserPreferences } from './types'; // Import types from centralized location

// Safe localStorage operations with error handling
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`Failed to get item from localStorage: ${key}`, error);
    return null;
  }
}

function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Failed to set item in localStorage: ${key}`, error);
    return false;
  }
}

function safeRemoveItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Failed to remove item from localStorage: ${key}`, error);
    return false;
  }
}

// Character storage
export function getStoredCharacter(name: string, server: string): StoredCharacter | null {
  const stored = safeGetItem(STORAGE_KEYS.CHARACTERS);
  if (!stored) return null;

  try {
    const characters: Record<string, StoredCharacter> = JSON.parse(stored);
    const key = `${name.toLowerCase()}_${server.toLowerCase()}`;
    const character = characters[key];
    
    // Ensure character exists and has a valid lastUpdated timestamp
    if (!character || typeof character.lastUpdated !== 'string') {
      console.warn(`Cached character for ${name} on ${server} is missing or has invalid lastUpdated. Treating as expired.`);
      return null; 
    }
    
    // Check if cache is still valid
    const lastUpdatedTime = new Date(character.lastUpdated).getTime();
    const now = Date.now();
    
    if (isNaN(lastUpdatedTime) || (now - lastUpdatedTime) > CACHE_DURATION.CHARACTERS) {
      console.log(`Cached character for ${name} on ${server} is expired or has invalid date. Invalidating cache.`);
      return null; // Cache expired or invalid date
    }
    
    return character;
  } catch (error) {
    console.warn('Failed to parse stored characters', error);
    return null;
  }
}

export function storeCharacter(character: StoredCharacter): boolean {
  const stored = safeGetItem(STORAGE_KEYS.CHARACTERS);
  let characters: Record<string, StoredCharacter> = {};
  
  if (stored) {
    try {
      characters = JSON.parse(stored);
    } catch (error) {
      console.warn('Failed to parse existing characters, starting fresh', error);
    }
  }
  
  const key = `${character.name.toLowerCase()}_${character.server.toLowerCase()}`;
  characters[key] = {
    ...character,
    lastUpdated: character.lastUpdated || new Date().toISOString(), // Ensure lastUpdated is always a string
  };
  
  // Limit storage to last 10 characters
  const entries = Object.entries(characters);
  if (entries.length > 10) {
    const sorted = entries.sort((a, b) => {
      // Ensure lastUpdated is a string for sorting, though it should be by StoredCharacter type
      const dateA = new Date(a[1].lastUpdated).getTime();
      const dateB = new Date(b[1].lastUpdated).getTime();
      return dateB - dateA;
    });
    characters = Object.fromEntries(sorted.slice(0, 10));
  }
  
  return safeSetItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(characters));
}

// Preferences storage
export function getStoredPreferences(): UserPreferences | null {
  const stored = safeGetItem(STORAGE_KEYS.PREFERENCES);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.warn('Failed to parse stored preferences', error);
    return null;
  }
}

export function storePreferences(preferences: UserPreferences): boolean {
  return safeSetItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
}

// Achievements cache
export function getStoredAchievements(): any[] | null {
  const stored = safeGetItem(STORAGE_KEYS.ACHIEVEMENTS);
  if (!stored) return null;
  
  try {
    const data: { data: any[]; timestamp: number } = JSON.parse(stored);
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - data.timestamp > CACHE_DURATION.ACHIEVEMENTS) {
      return null; // Cache expired
    }
    
    return data.data;
  } catch (error) {
    console.warn('Failed to parse stored achievements', error);
    return null;
  }
}

export function storeAchievements(achievements: any[]): boolean {
  const data: { data: any[]; timestamp: number } = {
    data: achievements,
    timestamp: Date.now(),
  };
  
  return safeSetItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(data));
}

// Recent searches
export function getRecentSearches(): Array<{ name: string; server: string; timestamp: string }> {
  const stored = safeGetItem(STORAGE_KEYS.RECENT_SEARCHES);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.warn('Failed to parse recent searches', error);
    return [];
  }
}

export function addRecentSearch(name: string, server: string): boolean {
  const recent = getRecentSearches();
  const newSearch = {
    name,
    server,
    timestamp: new Date().toISOString(),
  };
  
  // Remove duplicates and add to front
  const filtered = recent.filter(
    search => !(search.name.toLowerCase() === name.toLowerCase() && 
                search.server.toLowerCase() === server.toLowerCase())
  );
  
  const updated = [newSearch, ...filtered].slice(0, 5); // Keep last 5 searches
  
  return safeSetItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(updated));
}

// Clear all stored data
export function clearAllStoredData(): boolean {
  const keys = Object.values(STORAGE_KEYS);
  let success = true;
  
  keys.forEach(key => {
    if (!safeRemoveItem(key)) {
      success = false;
    }
  });
  
  return success;
}

// Get storage usage info
export function getStorageInfo(): {
  used: number;
  available: number;
  characters: number;
  hasAchievements: boolean;
  hasPreferences: boolean;
} {
  let used = 0;
  let characters = 0;
  
  try {
    // Calculate approximate storage usage
    Object.values(STORAGE_KEYS).forEach(key => {
      const item = safeGetItem(key);
      if (item) {
        used += item.length;
      }
    });
    
    // Count stored characters
    const storedChars = safeGetItem(STORAGE_KEYS.CHARACTERS);
    if (storedChars) {
      try {
        characters = Object.keys(JSON.parse(storedChars)).length;
      } catch (error) {
        // Ignore parsing errors
      }
    }
  } catch (error) {
    console.warn('Failed to calculate storage info', error);
  }
  
  return {
    used,
    available: 5 * 1024 * 1024 - used, // Assume 5MB localStorage limit
    characters,
    hasAchievements: !!safeGetItem(STORAGE_KEYS.ACHIEVEMENTS),
    hasPreferences: !!safeGetItem(STORAGE_KEYS.PREFERENCES),
  };
}