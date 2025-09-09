// Centralized API client with retry logic and error handling

interface APIClientOptions {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

class APIClient {
  private baseURL: string;
  private timeout: number;
  private retries: number;
  private retryDelay: number;

  constructor(options: APIClientOptions = {}) {
    this.baseURL = options.baseURL || '';
    this.timeout = options.timeout || 15000;
    this.retries = options.retries || 3;
    this.retryDelay = options.retryDelay || 1000;
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const fullURL = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    let lastError: Error;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(fullURL, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': `Eorzean-Compass/1.0 (${process.env.NEXT_PUBLIC_BASE_URL || 'https://eorzean-compass.netlify.app'})`,
            ...options.headers,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < this.retries) {
          console.warn(`API request failed (attempt ${attempt + 1}/${this.retries + 1}):`, lastError.message);
          await this.sleep(this.retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }

    throw lastError!;
  }

  async get<T>(url: string, options?: RequestInit): Promise<T> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  async post<T>(url: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Export configured instances
export const tomestoneAPI = new APIClient({
  baseURL: 'https://tomestone.gg/api',
  timeout: 20000,
  retries: 2,
});

export const ffxivCollectAPI = new APIClient({
  baseURL: 'https://ffxivcollect.com/api',
  timeout: 15000,
  retries: 3,
});

export const localAPI = new APIClient({
  timeout: 30000,
  retries: 1,
});