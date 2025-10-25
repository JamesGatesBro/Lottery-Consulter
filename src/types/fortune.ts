export interface FortuneResponse {
  fortune: {
    message: string;
    id: number;
  };
  lesson: {
    english: string;
    chinese: string;
    id: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
  fallback?: boolean;
  timestamp?: number;
}

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

export interface FortuneState {
  fortune: FortuneResponse | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}