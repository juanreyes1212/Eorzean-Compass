// Security utilities and input validation

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[^\w\s'-]/g, '') // Allow only alphanumeric, spaces, hyphens, apostrophes
    .substring(0, 50); // Limit length
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
  
  // FFXIV character name validation
  if (!/^[A-Za-z'-\s]+$/.test(sanitized)) {
    return { isValid: false, error: "Character name contains invalid characters" };
  }
  
  return { isValid: true };
}

export function validateServerName(server: string): { isValid: boolean; error?: string } {
  const validServers = [
    "Adamantoise", "Cactuar", "Faerie", "Gilgamesh", "Jenova", "Midgardsormr", "Sargatanas", "Siren",
    "Balmung", "Brynhildr", "Coeurl", "Diabolos", "Goblin", "Malboro", "Mateus", "Zalera",
    "Behemoth", "Excalibur", "Exodus", "Famfrit", "Hyperion", "Lamia", "Leviathan", "Ultros"
  ];
  
  if (!validServers.includes(server)) {
    return { isValid: false, error: "Invalid server name" };
  }
  
  return { isValid: true };
}

// Rate limiting utility
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number = 10,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
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

export const apiRateLimiter = new RateLimiter(30, 60000); // 30 requests per minute

// Content Security Policy headers
export const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://ffxivcollect.com https://tomestone.gg https://img2.finalfantasyxiv.com",
    "connect-src 'self' https://ffxivcollect.com https://tomestone.gg",
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