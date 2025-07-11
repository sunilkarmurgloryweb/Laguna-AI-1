import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
  }>;
}

export interface ProcessedVoiceResponse {
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  response: string;
  extractedData?: {
    checkIn?: string;
    checkOut?: string;
    adults?: number;
    children?: number;
    roomType?: string;
    guestName?: string;
    phone?: string;
    email?: string;
    paymentMethod?: string;
  };
}

export const geminiApi = createApi({
  reducerPath: 'geminiApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    prepareHeaders: (headers) => {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (apiKey) {
        headers.set('X-goog-api-key', apiKey);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['VoiceProcessing'],
  endpoints: (builder) => ({
    processVoiceInput: builder.mutation<ProcessedVoiceResponse, {
      text: string;
      currentStep: string;
      reservationData: any;
      language: string;
    }>({
      query: ({ text, currentStep, reservationData, language }) => {
        const prompt = `
You are an AI assistant for Lagunacreek Hotels reservation system. Analyze the user input and provide a structured response.

Current Step: ${currentStep}
User Input: "${text}"
Language: ${language}
Current Reservation Data: ${JSON.stringify(reservationData, null, 2)}

Based on the user input, extract ALL possible information and provide a response in this exact JSON format:
{
  "intent": "one of: reservation_request, check_in_date, check_out_date, guest_count, room_selection, guest_info, payment_method, confirmation, missing_info_query, help_request",
  "confidence": 0.0-1.0,
  "entities": {
    "dates": ["extracted dates in YYYY-MM-DD format"],
    "checkIn": "check-in date in YYYY-MM-DD format",
    "checkOut": "check-out date in YYYY-MM-DD format", 
    "adults": number,
    "children": number,
    "roomType": "exact room type name",
    "guestName": "full name",
    "phone": "phone number",
    "email": "email address",
    "paymentMethod": "payment method"
  },
  "response": "Helpful response to the user in ${language}",
  "extractedData": {
    "checkIn": "YYYY-MM-DD format",
    "checkOut": "YYYY-MM-DD format",
    "adults": number,
    "children": number,
    "roomType": "exact room type name",
    "guestName": "full name",
    "phone": "phone number", 
    "email": "email address",
    "paymentMethod": "payment method"
  }
}

Room Types Available:
- "Ocean View King Suite"
- "Deluxe Garden Room" 
- "Family Oceanfront Suite"
- "Presidential Suite"
- "Standard Double Room"
- "Luxury Spa Suite"

Payment Methods:
- "Credit Card"
- "Pay at Hotel"
- "UPI or Digital Wallet"

Extract ALL information present in the user input, even if it's for different steps.
Be thorough in extraction and provide helpful responses.
`;

        const request: GeminiRequest = {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024
          }
        };

        return {
          url: '',
          method: 'POST',
          body: request,
        };
      },
      transformResponse: (response: GeminiResponse): ProcessedVoiceResponse => {
        try {
          if (response.candidates && response.candidates.length > 0) {
            const text = response.candidates[0].content.parts[0].text;
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              return {
                intent: parsed.intent || 'unknown',
                confidence: parsed.confidence || 0.5,
                entities: parsed.entities || {},
                response: parsed.response || "I'm here to help with your reservation.",
                extractedData: parsed.extractedData || {}
              };
            }
          }
          
          return {
            intent: 'unknown',
            confidence: 0.3,
            entities: {},
            response: "I'm having trouble understanding. Could you please repeat that?",
            extractedData: {}
          };
        } catch (error) {
          console.error('Error parsing Gemini response:', error);
          return {
            intent: 'unknown',
            confidence: 0.0,
            entities: {},
            response: "I'm having trouble understanding. Could you please try again?",
            extractedData: {}
          };
        }
      },
      invalidatesTags: ['VoiceProcessing'],
    }),
  }),
});

export const { useProcessVoiceInputMutation } = geminiApi;