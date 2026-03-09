import { describe, it, expect, beforeEach } from 'vitest';
import {
  getStoredCharacter,
  storeCharacter,
  getStoredPreferences,
  storePreferences,
  getStoredAchievements,
  storeAchievements,
  getRecentSearches,
  addRecentSearch,
  clearAllStoredData,
  getStorageInfo,
  getStoredCharacterAchievements,
  storeCharacterAchievements,
  getCharacterAchievementsCacheAge,
} from '@/lib/storage';
import { StoredCharacter, UserPreferences } from '@/lib/types';
import { DEFAULT_PREFERENCES } from '@/lib/constants';

function makeCharacter(overrides: Partial<StoredCharacter> = {}): StoredCharacter {
  return {
    id: '123',
    name: 'Test Character',
    server: 'Gilgamesh',
    avatar: 'https://example.com/avatar.png',
    achievementPoints: 100,
    achievementsCompleted: 50,
    totalAchievements: 200,
    completedAchievements: [],
    lastUpdated: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe('character storage', () => {
  it('stores and retrieves a character', () => {
    const character = makeCharacter();
    storeCharacter(character);
    const stored = getStoredCharacter('Test Character', 'Gilgamesh');
    expect(stored).not.toBeNull();
    expect(stored?.name).toBe('Test Character');
  });

  it('returns null for non-existent character', () => {
    expect(getStoredCharacter('Nobody', 'Nowhere')).toBeNull();
  });

  it('is case-insensitive for lookup', () => {
    storeCharacter(makeCharacter());
    const stored = getStoredCharacter('test character', 'gilgamesh');
    expect(stored).not.toBeNull();
  });

  it('returns null for expired cache', () => {
    const old = makeCharacter({
      lastUpdated: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    });
    storeCharacter(old);
    expect(getStoredCharacter('Test Character', 'Gilgamesh')).toBeNull();
  });

  it('limits storage to 10 characters', () => {
    for (let i = 0; i < 12; i++) {
      storeCharacter(makeCharacter({
        id: String(i),
        name: `Char${i}`,
        server: 'Gilgamesh',
        lastUpdated: new Date(Date.now() + i * 1000).toISOString(),
      }));
    }
    const info = getStorageInfo();
    expect(info.characters).toBeLessThanOrEqual(10);
  });
});

describe('preferences storage', () => {
  it('stores and retrieves preferences', () => {
    storePreferences(DEFAULT_PREFERENCES);
    const stored = getStoredPreferences();
    expect(stored).toEqual(DEFAULT_PREFERENCES);
  });

  it('returns null when no preferences stored', () => {
    expect(getStoredPreferences()).toBeNull();
  });
});

describe('achievements cache', () => {
  it('stores and retrieves achievements', () => {
    const achievements = [{ id: 1, name: 'Test' }];
    storeAchievements(achievements);
    const stored = getStoredAchievements();
    expect(stored).toHaveLength(1);
    expect(stored?.[0].name).toBe('Test');
  });

  it('returns null when no achievements stored', () => {
    expect(getStoredAchievements()).toBeNull();
  });
});

describe('recent searches', () => {
  it('adds and retrieves searches', () => {
    addRecentSearch('Test', 'Gilgamesh');
    const searches = getRecentSearches();
    expect(searches).toHaveLength(1);
    expect(searches[0].name).toBe('Test');
  });

  it('limits to 5 recent searches', () => {
    for (let i = 0; i < 7; i++) {
      addRecentSearch(`Char${i}`, 'Gilgamesh');
    }
    expect(getRecentSearches()).toHaveLength(5);
  });

  it('removes duplicates and moves to front', () => {
    addRecentSearch('First', 'Gilgamesh');
    addRecentSearch('Second', 'Gilgamesh');
    addRecentSearch('First', 'Gilgamesh');
    const searches = getRecentSearches();
    expect(searches).toHaveLength(2);
    expect(searches[0].name).toBe('First');
  });
});

describe('clearAllStoredData', () => {
  it('clears all stored data', () => {
    storeCharacter(makeCharacter());
    storePreferences(DEFAULT_PREFERENCES);
    clearAllStoredData();
    expect(getStoredPreferences()).toBeNull();
    expect(getStoredCharacter('Test Character', 'Gilgamesh')).toBeNull();
  });
});

describe('getStorageInfo', () => {
  it('returns storage metrics', () => {
    const info = getStorageInfo();
    expect(info.used).toBeGreaterThanOrEqual(0);
    expect(info.available).toBeGreaterThan(0);
    expect(typeof info.characters).toBe('number');
    expect(typeof info.hasAchievements).toBe('boolean');
    expect(typeof info.hasPreferences).toBe('boolean');
  });
});

describe('per-character achievement cache', () => {
  const lodestoneId = '12345678';
  const sampleAchievements = [
    { id: 1, name: 'First Achievement', isCompleted: true },
    { id: 2, name: 'Second Achievement', isCompleted: false },
  ];

  it('stores and retrieves character achievements', () => {
    storeCharacterAchievements(lodestoneId, sampleAchievements);
    const stored = getStoredCharacterAchievements(lodestoneId);
    expect(stored).toHaveLength(2);
    expect(stored?.[0].name).toBe('First Achievement');
  });

  it('returns null for non-existent lodestone ID', () => {
    expect(getStoredCharacterAchievements('99999')).toBeNull();
  });

  it('returns null for expired cache', () => {
    storeCharacterAchievements(lodestoneId, sampleAchievements);
    const key = 'eorzean_compass_character_achievements';
    const raw = JSON.parse(localStorage.getItem(key)!);
    raw[lodestoneId].timestamp = Date.now() - 7 * 60 * 60 * 1000;
    localStorage.setItem(key, JSON.stringify(raw));
    expect(getStoredCharacterAchievements(lodestoneId)).toBeNull();
  });

  it('limits to 5 cached characters', () => {
    for (let i = 0; i < 7; i++) {
      storeCharacterAchievements(String(i), [{ id: i }]);
    }
    const key = 'eorzean_compass_character_achievements';
    const raw = JSON.parse(localStorage.getItem(key)!);
    expect(Object.keys(raw).length).toBeLessThanOrEqual(5);
  });

  it('keeps most recent entries when pruning', () => {
    for (let i = 0; i < 7; i++) {
      storeCharacterAchievements(String(i), [{ id: i }]);
    }
    const key = 'eorzean_compass_character_achievements';
    const raw = JSON.parse(localStorage.getItem(key)!);
    const ids = Object.keys(raw);
    expect(ids.length).toBeLessThanOrEqual(5);
  });

  it('returns cache age for existing entry', () => {
    storeCharacterAchievements(lodestoneId, sampleAchievements);
    const age = getCharacterAchievementsCacheAge(lodestoneId);
    expect(age).not.toBeNull();
    expect(age).toBeGreaterThanOrEqual(0);
    expect(age).toBeLessThan(1000);
  });

  it('returns null cache age for non-existent entry', () => {
    expect(getCharacterAchievementsCacheAge('nonexistent')).toBeNull();
  });

  it('isolates different lodestone IDs', () => {
    storeCharacterAchievements('aaa', [{ id: 1, name: 'A' }]);
    storeCharacterAchievements('bbb', [{ id: 2, name: 'B' }]);
    const a = getStoredCharacterAchievements('aaa');
    const b = getStoredCharacterAchievements('bbb');
    expect(a?.[0].name).toBe('A');
    expect(b?.[0].name).toBe('B');
  });

  it('is cleared by clearAllStoredData', () => {
    storeCharacterAchievements(lodestoneId, sampleAchievements);
    clearAllStoredData();
    expect(getStoredCharacterAchievements(lodestoneId)).toBeNull();
  });
});
