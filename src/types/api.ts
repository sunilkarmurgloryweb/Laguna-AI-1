// API Response Types
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

export interface ApiError {
  status: number | string;
  data: any;
  message: string;
}

// Request/Response interceptor types
export interface RequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
  _retry?: boolean;
  startTime?: number;
}

export interface ResponseData<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
}

// Gemini API specific types
export interface GeminiApiConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface GeminiErrorResponse {
  error: {
    code: number;
    message: string;
    status: string;
    details?: any[];
  };
}

// Voice processing types
export interface VoiceProcessingMetrics {
  requestDuration: number;
  processingTime: number;
  confidence: number;
  wordsProcessed: number;
  language: string;
}

export interface VoiceProcessingError extends ApiError {
  type: 'NETWORK_ERROR' | 'TIMEOUT' | 'RATE_LIMIT' | 'AUTH_ERROR' | 'PARSE_ERROR' | 'UNKNOWN';
  retryable: boolean;
  retryAfter?: number;
}

// Redux RTK Query types
export interface BaseQueryError {
  status: number | string;
  data: any;
  message: string;
}

export interface BaseQueryResult<T> {
  data?: T;
  error?: BaseQueryError;
}

// Utility types for API responses
export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiErrorResponse = {
  success: false;
  error: string;
  details?: any;
};

export type ApiResult<T> = ApiSuccessResponse<T> | ApiErrorResponse;