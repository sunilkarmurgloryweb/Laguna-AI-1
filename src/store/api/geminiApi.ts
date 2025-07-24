import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ChatMessage } from '../../types/reservation';
import { getGeminiService } from '../../services/geminiService';
import { SendMessageRequest, SendMessageResponse } from '../../types/gemini';

export const geminiApi = createApi({
  reducerPath: 'geminiApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['Chat', 'FormData'],
  endpoints: (builder) => ({
    sendMessage: builder.mutation<SendMessageResponse, SendMessageRequest>({
      queryFn: async ({ message, currentFormData, context }) => {
        try {
          const geminiService = getGeminiService();

          if (context) {
            await geminiService.setContext(context);
          }

          const response = await geminiService.sendMessage(message, currentFormData);

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
          const geminiService = getGeminiService();
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
          const geminiService = getGeminiService();
          await geminiService.setContext(context);
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
