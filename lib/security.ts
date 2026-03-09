import { SERVERS } from './constants';

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/[^\w\s'-]/g, '')
    .substring(0, 50);
}

export function validateCharacterName(name: string): { isValid: boolean; error?: string } {
  const sanitized = sanitizeInput(name);

  if (!sanitized) {
    return { isValid: false, error: "Character name is required" };
  }

  if (sanitized.length < 2) {
    return { isValid: false, error: "Character name must be at least 2 characters" };
  }

  if (sanitized.length > 20) {
    return { isValid: false, error: "Character name must be 20 characters or less" };
  }

  if (!/^[A-Za-z'-\s]+$/.test(sanitized)) {
    return { isValid: false, error: "Character name contains invalid characters" };
  }

  return { isValid: true };
}

export function validateServerName(server: string): { isValid: boolean; error?: string } {
  if (!Object.keys(SERVERS).includes(server)) {
    return { isValid: false, error: "Invalid server name" };
  }

  return { isValid: true };
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private maxRequests: number = 10,
    private windowMs: number = 60000
  ) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];

    const validRequests = requests.filter(time => now - time < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(identifier, validRequests);

    return true;
  }

  getRemainingRequests(identifier: string): number {
    const requests = this.requests.get(identifier) || [];
    const now = Date.now();
    const validRequests = requests.filter(time => now - time < this.windowMs);

    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

export const apiRateLimiter = new RateLimiter(30, 60000);

export const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://ffxivcollect.com https://img2.finalfantasyxiv.com",
    "connect-src 'self' https://ffxivcollect.com https://gttrmfpqbbnuhzqtvsrt.supabase.co",
    "font-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};
