import { baseApi } from './baseApi';
import type { BaseApiError } from './baseApi';

// Gemini API types
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
    confirmationNumber?: string;
    roomNumber?: string;
  };
  suggestions?: string[];
}

export interface VoiceProcessingRequest {
  text: string;
  currentStep: string;
  reservationData: any;
  language: string;
  context?: string;
}

// Enhanced Gemini API with axios interceptors
export const geminiApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Process voice input with comprehensive extraction
    processVoiceInput: builder.mutation<ProcessedVoiceResponse, VoiceProcessingRequest>({
      query: ({ text, currentStep, reservationData, language, context = '' }) => {
        const prompt = `
You are an AI assistant for Lagunacreek Hotels reservation system. Analyze the user input and provide a structured response.

Current Step: ${currentStep}
User Input: "${text}"
Language: ${language}
Context: ${context}
Current Reservation Data: ${JSON.stringify(reservationData, null, 2)}

Based on the user input, extract ALL possible information and provide a response in this exact JSON format:
{
  "intent": "one of: reservation_request, check_in_date, check_out_date, guest_count, room_selection, guest_info, payment_method, confirmation, missing_info_query, help_request, check_in_request, check_out_request, availability_request",
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
    "paymentMethod": "payment method",
    "confirmationNumber": "booking confirmation number",
    "roomNumber": "room number"
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
    "paymentMethod": "payment method",
    "confirmationNumber": "booking confirmation number",
    "roomNumber": "room number"
  },
  "suggestions": ["helpful suggestions for next steps"]
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
Handle dates intelligently - if year is not specified, assume current year.
For confirmation numbers, look for patterns like LG123456 or similar.
For room numbers, look for patterns like 205, Room 205, etc.
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
          url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
          method: 'POST',
          data: request,
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
                extractedData: parsed.extractedData || {},
                suggestions: parsed.suggestions || []
              };
            }
          }
          
          return {
            intent: 'unknown',
            confidence: 0.3,
            entities: {},
            response: "I'm having trouble understanding. Could you please repeat that?",
            extractedData: {},
            suggestions: ['Try speaking more clearly', 'Say "help" for guidance']
          };
        } catch (error) {
          console.error('Error parsing Gemini response:', error);
          return {
            intent: 'unknown',
            confidence: 0.0,
            entities: {},
            response: "I'm having trouble understanding. Could you please try again?",
            extractedData: {},
            suggestions: ['Try rephrasing your request', 'Speak more slowly']
          };
        }
      },
      transformErrorResponse: (response: BaseApiError) => ({
        status: response.status,
        message: response.message,
        data: response.data,
      }),
      invalidatesTags: ['VoiceProcessing'],
    }),

    // Generate contextual help
    generateHelp: builder.mutation<string, {
      step: string;
      reservationData: any;
      language: string;
    }>({
      query: ({ step, reservationData, language }) => {
        const prompt = `
You are helping a user with hotel reservation at Lagunacreek Hotels.

Current Step: ${step}
Current Data: ${JSON.stringify(reservationData, null, 2)}
Language: ${language}

Provide helpful, concise guidance for this step in ${language}. Include:
1. What information is needed
2. Example of what they can say
3. What happens next

Keep it friendly and under 100 words.
`;

        const request: GeminiRequest = {
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 512
          }
        };

        return {
          url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
          method: 'POST',
          data: request,
        };
      },
      transformResponse: (response: GeminiResponse): string => {
        try {
          if (response.candidates && response.candidates.length > 0) {
            return response.candidates[0].content.parts[0].text;
          }
          return "I'm here to help you complete your reservation. Please let me know what you need assistance with.";
        } catch (error) {
          console.error('Help generation error:', error);
          return "I'm here to help you complete your reservation. Please let me know what you need assistance with.";
        }
      },
      invalidatesTags: ['VoiceProcessing'],
    }),

    // Generate personalized responses
    generatePersonalizedResponse: builder.mutation<string, {
      userInput: string;
      step: string;
      reservationData: any;
      context: string;
      language: string;
    }>({
      query: ({ userInput, step, reservationData, context, language }) => {
        const prompt = `
You are a friendly hotel reservation assistant for Lagunacreek Hotels.

User said: "${userInput}"
Current step: ${step}
Reservation data: ${JSON.stringify(reservationData, null, 2)}
Additional context: ${context}
Language: ${language}

Generate a warm, personalized response in ${language} that:
1. Acknowledges what the user said
2. Confirms any information captured
3. Guides them to the next step naturally
4. Uses their name if available
5. Keeps it conversational and under 50 words

Be helpful and professional but friendly.
`;

        const request: GeminiRequest = {
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 256
          }
        };

        return {
          url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
          method: 'POST',
          data: request,
        };
      },
      transformResponse: (response: GeminiResponse): string => {
        try {
          if (response.candidates && response.candidates.length > 0) {
            return response.candidates[0].content.parts[0].text;
          }
          return "Thank you! Let me help you with the next step.";
        } catch (error) {
          console.error('Personalized response error:', error);
          return "Thank you! Let me help you with the next step.";
        }
      },
      invalidatesTags: ['VoiceProcessing'],
    }),
  }),
});

// Export hooks
export const {
  useProcessVoiceInputMutation,
  useGenerateHelpMutation,
  useGeneratePersonalizedResponseMutation,
} = geminiApi;

// Export types
export type { VoiceProcessingRequest, ProcessedVoiceResponse };