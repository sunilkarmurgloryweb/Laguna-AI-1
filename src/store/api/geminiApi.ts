import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { geminiService } from '../../services/geminiService';
import { GeminiResponse, ChatMessage, VoiceProcessedData } from '../../types/reservation';

export interface SendMessageRequest {
  message: string;
  currentFormData?: VoiceProcessedData;
  context?: string;
}

export interface SendMessageResponse {
  response: GeminiResponse;
  chatMessage: ChatMessage;
}

export const geminiApi = createApi({
  reducerPath: 'geminiApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }), // Dummy base query since we're using the service directly
  tagTypes: ['Chat', 'FormData'],
  endpoints: (builder) => ({
    sendMessage: builder.mutation<SendMessageResponse, SendMessageRequest>({
      queryFn: async ({ message, currentFormData, context }) => {
        try {
          // Import geminiService dynamically to avoid circular imports
          const { geminiService } = await import('../../services/geminiService');
          
          if (context) {
            geminiService.setContext(context);
          }

          const response = await geminiService.sendMessage(message, currentFormData);
          
          // Create chat message
          const chatMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: response.text,
            timestamp: new Date(),
            extractedData: response.extractedData,
            formFilled: response.shouldFillForm
          };

          return {
            data: {
              response,
              chatMessage
            }
          };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error instanceof Error ? error.message : 'Unknown error occurred'
            }
          };
        }
      },
      invalidatesTags: ['Chat'],
    }),

    resetChat: builder.mutation<void, void>({
      queryFn: async () => {
        try {
          const { geminiService } = await import('../../services/geminiService');
          await geminiService.resetChat();
          return { data: undefined };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error instanceof Error ? error.message : 'Failed to reset chat'
            }
          };
        }
      },
      invalidatesTags: ['Chat'],
    }),

    setContext: builder.mutation<void, string>({
      queryFn: async (context) => {
        try {
          const { geminiService } = await import('../../services/geminiService');
          geminiService.setContext(context);
          return { data: undefined };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error instanceof Error ? error.message : 'Failed to set context'
            }
          };
        }
      },
    }),
  }),
});

export const {
  useSendMessageMutation,
  useResetChatMutation,
  useSetContextMutation,
} = geminiApi;