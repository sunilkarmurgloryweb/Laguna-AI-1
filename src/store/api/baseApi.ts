import { createApi } from '@reduxjs/toolkit/query/react';
import { apiClient, handleApiError } from '../../services/axiosConfig';
import type { AxiosRequestConfig } from 'axios';

// Custom base query using axios with interceptors
const axiosBaseQuery = (
  { baseUrl }: { baseUrl: string } = { baseUrl: '' }
) => async ({ 
  url, 
  method = 'GET', 
  data, 
  params, 
  headers,
  ...rest 
}: AxiosRequestConfig & { url: string }) => {
  try {
    const result = await apiClient({
      url: baseUrl + url,
      method,
      data,
      params,
      headers,
      ...rest,
    });
    
    return { data: result.data };
  } catch (axiosError) {
    const errorMessage = handleApiError(axiosError);
    
    return {
      error: {
        status: (axiosError as any)?.response?.status || 'FETCH_ERROR',
        data: (axiosError as any)?.response?.data || null,
        message: errorMessage,
      },
    };
  }
};

// Base API slice with axios integration
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery({
    baseUrl: '', // Base URL will be set per endpoint
  }),
  tagTypes: [
    'VoiceProcessing',
    'Reservation',
    'CheckIn',
    'CheckOut',
    'RoomAvailability',
    'GuestInfo',
  ],
  endpoints: () => ({}),
});

// Export hooks and utilities
export const { 
  util: { getRunningQueriesThunk },
} = baseApi;

// Export types
export type BaseApiError = {
  status: number | string;
  data: any;
  message: string;
};