import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Types for request/response interceptors
interface ApiRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
  startTime?: number;
}

interface ApiResponse<T = any> extends AxiosResponse<T> {
  config: ApiRequestConfig;
}

interface ApiError extends AxiosError {
  config: ApiRequestConfig;
}

// Create axios instance with base configuration
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    timeout: 30000, // 30 seconds timeout
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor
  instance.interceptors.request.use(
    (config: ApiRequestConfig) => {
      // Add timestamp for request timing
      config.startTime = Date.now();
      
      // Add API key for Gemini requests
      if (config.url?.includes('generativelanguage.googleapis.com')) {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (apiKey) {
          config.headers = {
            ...config.headers,
            'X-goog-api-key': apiKey,
          };
        } else {
          console.warn('Gemini API key not found in environment variables');
        }
      }

      // Log request in development
      if (import.meta.env.DEV) {
        console.log('🚀 API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          headers: config.headers,
          data: config.data,
        });
      }

      return config;
    },
    (error: AxiosError) => {
      console.error('❌ Request Error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response: ApiResponse) => {
      // Calculate request duration
      const duration = response.config.startTime 
        ? Date.now() - response.config.startTime 
        : 0;

      // Log response in development
      if (import.meta.env.DEV) {
        console.log('✅ API Response:', {
          method: response.config.method?.toUpperCase(),
          url: response.config.url,
          status: response.status,
          duration: `${duration}ms`,
          data: response.data,
        });
      }

      return response;
    },
    async (error: ApiError) => {
      const originalRequest = error.config;

      // Log error details
      console.error('❌ API Error:', {
        method: originalRequest?.method?.toUpperCase(),
        url: originalRequest?.url,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });

      // Handle specific error cases
      if (error.response?.status === 401) {
        console.error('🔐 Authentication Error: Invalid API key');
        // Could dispatch logout action here if needed
      }

      if (error.response?.status === 429) {
        console.warn('⏰ Rate Limit: Too many requests');
        // Could implement retry logic with exponential backoff
        if (!originalRequest._retry) {
          originalRequest._retry = true;
          // Wait 1 second before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          return instance(originalRequest);
        }
      }

      if (error.response?.status >= 500) {
        console.error('🔥 Server Error: Internal server error');
        // Could implement retry logic for server errors
      }

      // Network errors
      if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
        console.error('🌐 Network Error: Check your internet connection');
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

// Create and export the configured axios instance
export const apiClient = createAxiosInstance();

// Export types for use in other files
export type { ApiRequestConfig, ApiResponse, ApiError };

// Utility function to create request config
export const createRequestConfig = (
  url: string,
  options: Partial<ApiRequestConfig> = {}
): ApiRequestConfig => ({
  url,
  method: 'GET',
  ...options,
});

// Utility function for handling API errors
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiError = error as ApiError;
    
    if (apiError.response?.data?.error?.message) {
      return apiError.response.data.error.message;
    }
    
    if (apiError.response?.status === 401) {
      return 'Authentication failed. Please check your API key.';
    }
    
    if (apiError.response?.status === 429) {
      return 'Too many requests. Please try again later.';
    }
    
    if (apiError.response?.status >= 500) {
      return 'Server error. Please try again later.';
    }
    
    if (apiError.code === 'NETWORK_ERROR') {
      return 'Network error. Please check your internet connection.';
    }
    
    if (apiError.code === 'ECONNABORTED') {
      return 'Request timeout. Please try again.';
    }
    
    return apiError.message || 'An unexpected error occurred.';
  }
  
  return 'An unexpected error occurred.';
};