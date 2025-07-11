interface GeminiRequest {
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

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
  }>;
}

class GeminiAIService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your environment variables.');
    }
  }

  async generateContent(prompt: string, temperature: number = 0.7): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured');
    }

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
        temperature,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024
      }
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': this.apiKey
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data: GeminiResponse = await response.json();
      
      if (data.candidates && data.candidates.length > 0) {
        return data.candidates[0].content.parts[0].text;
      }
      
      throw new Error('No response generated from Gemini AI');
    } catch (error) {
      console.error('Gemini AI Service Error:', error);
      throw error;
    }
  }

  // Enhanced intent recognition using Gemini AI
  async recognizeIntent(userInput: string, currentStep: string, reservationData: any): Promise<{
    intent: string;
    confidence: number;
    entities: Record<string, any>;
    response: string;
    suggestedAction?: string;
  }> {
    const prompt = `
You are an AI assistant for Lagunacreek Hotels reservation system. Analyze the user input and provide a structured response.

Current Step: ${currentStep}
User Input: "${userInput}"
Current Reservation Data: ${JSON.stringify(reservationData, null, 2)}

Based on the user input and current step, identify:
1. The user's intent
2. Extract relevant entities (dates, numbers, names, etc.)
3. Provide a helpful response
4. Suggest the next action if applicable

Respond in this exact JSON format:
{
  "intent": "one of: reservation_request, check_in_date, check_out_date, guest_count, room_selection, guest_info, payment_method, confirmation, missing_info_query, help_request",
  "confidence": 0.0-1.0,
  "entities": {
    "dates": ["extracted dates"],
    "numbers": ["extracted numbers"],
    "names": ["extracted names"],
    "room_types": ["extracted room types"],
    "payment_methods": ["extracted payment methods"]
  },
  "response": "Helpful response to the user",
  "suggestedAction": "next_step or specific_action"
}

Rules:
- Be conversational and friendly
- Extract specific information accurately
- If information is missing, ask for it politely
- Provide clear next steps
- Handle multiple pieces of information in one input
`;

    try {
      const aiResponse = await this.generateContent(prompt, 0.3);
      
      // Try to parse JSON response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedResponse = JSON.parse(jsonMatch[0]);
        return {
          intent: parsedResponse.intent || 'unknown',
          confidence: parsedResponse.confidence || 0.5,
          entities: parsedResponse.entities || {},
          response: parsedResponse.response || "I'm here to help with your reservation.",
          suggestedAction: parsedResponse.suggestedAction
        };
      }
      
      // Fallback if JSON parsing fails
      return {
        intent: 'help_request',
        confidence: 0.5,
        entities: {},
        response: aiResponse,
        suggestedAction: 'continue'
      };
    } catch (error) {
      console.error('Intent recognition error:', error);
      return {
        intent: 'unknown',
        confidence: 0.0,
        entities: {},
        response: "I'm having trouble understanding. Could you please repeat that?",
        suggestedAction: 'retry'
      };
    }
  }

  // Generate contextual help for each step
  async generateStepHelp(step: string, reservationData: any): Promise<string> {
    const prompt = `
You are helping a user with hotel reservation at Lagunacreek Hotels.

Current Step: ${step}
Current Data: ${JSON.stringify(reservationData, null, 2)}

Provide helpful, concise guidance for this step. Include:
1. What information is needed
2. Example of what they can say
3. What happens next

Keep it friendly and under 100 words.
`;

    try {
      return await this.generateContent(prompt, 0.5);
    } catch (error) {
      console.error('Help generation error:', error);
      return this.getFallbackHelp(step);
    }
  }

  // Generate personalized responses based on user data
  async generatePersonalizedResponse(
    userInput: string, 
    step: string, 
    reservationData: any, 
    context: string = ''
  ): Promise<string> {
    const prompt = `
You are a friendly hotel reservation assistant for Lagunacreek Hotels.

User said: "${userInput}"
Current step: ${step}
Reservation data: ${JSON.stringify(reservationData, null, 2)}
Additional context: ${context}

Generate a warm, personalized response that:
1. Acknowledges what the user said
2. Confirms any information captured
3. Guides them to the next step naturally
4. Uses their name if available
5. Keeps it conversational and under 50 words

Be helpful and professional but friendly.
`;

    try {
      return await this.generateContent(prompt, 0.7);
    } catch (error) {
      console.error('Personalized response error:', error);
      return "Thank you! Let me help you with the next step.";
    }
  }

  // Smart error handling and suggestions
  async handleError(error: string, context: any): Promise<string> {
    const prompt = `
A user encountered an error in the hotel reservation system.

Error: ${error}
Context: ${JSON.stringify(context, null, 2)}

Provide a helpful, reassuring response that:
1. Acknowledges the issue
2. Suggests a solution
3. Offers alternative ways to proceed
4. Maintains a positive tone

Keep it under 60 words and be specific about next steps.
`;

    try {
      return await this.generateContent(prompt, 0.5);
    } catch (error) {
      console.error('Error handling generation failed:', error);
      return "I apologize for the inconvenience. Let's try that again. You can also speak more slowly or try rephrasing your request.";
    }
  }

  private getFallbackHelp(step: string): string {
    const helpTexts: Record<string, string> = {
      'language': 'Please select your preferred language to continue with your reservation.',
      'welcome': 'Welcome to Lagunacreek! Say "make a reservation" or "book a room" to get started.',
      'dates-guests': 'Please tell me your check-in date, check-out date, and number of guests.',
      'room-selection': 'Choose from our available rooms: Deluxe King, Family Suite, or Ocean View.',
      'guest-info': 'I need your full name, phone number, and email address.',
      'payment': 'Please select your payment method: Credit Card, Pay at Hotel, or UPI.',
      'confirmation': 'Please review your booking details and confirm to complete your reservation.'
    };
    
    return helpTexts[step] || 'I\'m here to help you with your hotel reservation.';
  }
}

export const geminiAI = new GeminiAIService();