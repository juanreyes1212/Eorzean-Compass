import { APIError } from '@/lib/types';

// Base API configuration
const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || '',
  timeout: 30000,
  retries: 3,
} as const;

// Generic API client with error handling and retries
class APIClient {
  private baseURL: string;
  private timeout: number;
  private retries: number;

  constructor(config = API_CONFIG) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout;
    this.retries = config.retries;
  }

  private async fetchWithTimeout(
    url: string, 
    options: RequestInit = {}, 
    timeout = this.timeout
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
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
        throw new APIError('Request timeout', 408, 'TIMEOUT');
      }
      throw error;
    }
  }

  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    retries = this.retries
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on client errors (4xx)
        if (error instanceof APIError && error.status && error.status < 500) {
          throw error;
        }
        
        // Wait before retry with exponential backoff
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }

  async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.retryRequest(async () => {
      const response = await this.fetchWithTimeout(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new APIError(
          errorData.error || `HTTP ${response.status}`,
          response.status,
          errorData.code
        );
      }

      return response.json();
    });
  }

  async post<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<T> {
    return this.retryRequest(async () => {
      const response = await this.fetchWithTimeout(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new APIError(
          errorData.error || `HTTP ${response.status}`,
          response.status,
          errorData.code
        );
      }

      return response.json();
    });
  }

  async put<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<T> {
    return this.retryRequest(async () => {
      const response = await this.fetchWithTimeout(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new APIError(
          errorData.error || `HTTP ${response.status}`,
          response.status,
          errorData.code
        );
      }

      return response.json();
    });
  }

  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.retryRequest(async () => {
      const response = await this.fetchWithTimeout(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new APIError(
          errorData.error || `HTTP ${response.status}`,
          response.status,
          errorData.code
        );
      }

      return response.json();
    });
  }
}

// Export singleton instance
export const apiClient = new APIClient();

// Utility functions for common API patterns
export const createAPIEndpoint = <TRequest = any, TResponse = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'
) => {
  return {
    call: (data?: TRequest, options?: RequestInit): Promise<TResponse> => {
      switch (method) {
        case 'GET':
          return apiClient.get<TResponse>(endpoint, options);
        case 'POST':
          return apiClient.post<TResponse>(endpoint, data, options);
        case 'PUT':
          return apiClient.put<TResponse>(endpoint, data, options);
        case 'DELETE':
          return apiClient.delete<TResponse>(endpoint, options);
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    },
  };
};

// Common API endpoints
export const endpoints = {
  character: {
    search: createAPIEndpoint<{ name: string; server: string }, any>('/api/character', 'POST'),
  },
  achievements: {
    getAll: createAPIEndpoint<void, any[]>('/api/achievements', 'GET'),
  },
} as const;