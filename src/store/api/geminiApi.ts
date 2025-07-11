import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { geminiService, GeminiResponse, ChatMessage } from '../../services/geminiService';

export interface SendMessageRequest {
  message: string;
  currentFormData?: Record<string, any>;
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

          // Speak the response if it's not an error
          if (response.intent !== 'error' && response.text) {
            try {
              await geminiService.speak(response.text);
            } catch (speechError) {
              console.warn('Text-to-speech failed:', speechError);
            }
          }

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