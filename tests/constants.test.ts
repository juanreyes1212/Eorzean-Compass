import { describe, it, expect } from 'vitest';
import { SERVERS, CACHE_DURATION, STORAGE_KEYS, DEFAULT_PREFERENCES } from '@/lib/constants';

describe('SERVERS', () => {
  it('contains all major NA data centers', () => {
    const dcNames = new Set(Object.values(SERVERS));
    expect(dcNames.has('Aether')).toBe(true);
    expect(dcNames.has('Crystal')).toBe(true);
    expect(dcNames.has('Primal')).toBe(true);
    expect(dcNames.has('Dynamis')).toBe(true);
  });

  it('contains EU data centers', () => {
    const dcNames = new Set(Object.values(SERVERS));
    expect(dcNames.has('Chaos')).toBe(true);
    expect(dcNames.has('Light')).toBe(true);
  });

  it('contains JP data centers', () => {
    const dcNames = new Set(Object.values(SERVERS));
    expect(dcNames.has('Elemental')).toBe(true);
    expect(dcNames.has('Gaia')).toBe(true);
    expect(dcNames.has('Mana')).toBe(true);
    expect(dcNames.has('Meteor')).toBe(true);
  });

  it('contains OCE data center', () => {
    const dcNames = new Set(Object.values(SERVERS));
    expect(dcNames.has('Materia')).toBe(true);
  });

  it('has at least 70 servers', () => {
    expect(Object.keys(SERVERS).length).toBeGreaterThanOrEqual(70);
  });

  it('maps every server to a non-empty data center', () => {
    Object.entries(SERVERS).forEach(([server, dc]) => {
      expect(dc.length).toBeGreaterThan(0);
      expect(server.length).toBeGreaterThan(0);
    });
  });
});

describe('CACHE_DURATION', () => {
  it('sets achievements cache to 6 hours', () => {
    expect(CACHE_DURATION.ACHIEVEMENTS).toBe(6 * 60 * 60 * 1000);
  });

  it('sets characters cache to 6 hours', () => {
    expect(CACHE_DURATION.CHARACTERS).toBe(6 * 60 * 60 * 1000);
  });
});

describe('STORAGE_KEYS', () => {
  it('includes CHARACTER_ACHIEVEMENTS key', () => {
    expect(STORAGE_KEYS.CHARACTER_ACHIEVEMENTS).toBeDefined();
    expect(typeof STORAGE_KEYS.CHARACTER_ACHIEVEMENTS).toBe('string');
  });

  it('has unique values for all keys', () => {
    const values = Object.values(STORAGE_KEYS);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});

describe('DEFAULT_PREFERENCES', () => {
  it('sets all TSRG max scores to 10', () => {
    expect(DEFAULT_PREFERENCES.maxTimeScore).toBe(10);
    expect(DEFAULT_PREFERENCES.maxSkillScore).toBe(10);
    expect(DEFAULT_PREFERENCES.maxRngScore).toBe(10);
    expect(DEFAULT_PREFERENCES.maxGroupScore).toBe(10);
  });

  it('includes all 4 tiers by default', () => {
    expect(DEFAULT_PREFERENCES.selectedTiers).toEqual([1, 2, 3, 4]);
  });

  it('hides unobtainable by default', () => {
    expect(DEFAULT_PREFERENCES.hideUnobtainable).toBe(true);
  });

  it('does not hide completed by default', () => {
    expect(DEFAULT_PREFERENCES.hideCompleted).toBe(false);
  });
});
