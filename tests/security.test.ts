import { describe, it, expect } from 'vitest';
import { sanitizeInput, validateCharacterName, validateServerName } from '@/lib/security';

describe('sanitizeInput', () => {
  it('trims whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('removes HTML tags', () => {
    expect(sanitizeInput('<script>alert(1)</script>')).toBe('scriptalert1script');
  });

  it('removes special characters but keeps hyphens and apostrophes', () => {
    expect(sanitizeInput("Y'shtola")).toBe("Y'shtola");
    expect(sanitizeInput('Test-Name')).toBe('Test-Name');
  });

  it('truncates to 50 characters', () => {
    const long = 'a'.repeat(100);
    expect(sanitizeInput(long).length).toBe(50);
  });

  it('handles empty string', () => {
    expect(sanitizeInput('')).toBe('');
  });
});

describe('validateCharacterName', () => {
  it('accepts valid character names', () => {
    expect(validateCharacterName('Warrior Light').isValid).toBe(true);
    expect(validateCharacterName("Y'shtola Rhul").isValid).toBe(true);
  });

  it('rejects empty name', () => {
    const result = validateCharacterName('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects name shorter than 2 characters', () => {
    const result = validateCharacterName('A');
    expect(result.isValid).toBe(false);
  });

  it('rejects name longer than 20 characters', () => {
    const result = validateCharacterName('A'.repeat(21));
    expect(result.isValid).toBe(false);
  });

  it('rejects names with numbers', () => {
    const result = validateCharacterName('Test123');
    expect(result.isValid).toBe(false);
  });
});

describe('validateServerName', () => {
  it('accepts valid server names', () => {
    expect(validateServerName('Adamantoise').isValid).toBe(true);
    expect(validateServerName('Gilgamesh').isValid).toBe(true);
    expect(validateServerName('Balmung').isValid).toBe(true);
  });

  it('rejects invalid server names', () => {
    const result = validateServerName('FakeServer');
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('is case-sensitive', () => {
    expect(validateServerName('adamantoise').isValid).toBe(false);
  });
});
