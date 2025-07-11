import { geminiAI } from './geminiAIService';
import { ReservationData, ReservationStep } from '../types/reservation';
import { roomTypes } from '../data/hotels';

export interface EnhancedProcessedVoiceInput {
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  response: string;
  action?: {
    type: string;
    payload: any;
  };
  suggestions?: string[];
}

class EnhancedVoiceProcessingService {
  
  public async processVoiceInput(
    input: string, 
    currentStep: ReservationStep, 
    reservationData: ReservationData
  ): Promise<EnhancedProcessedVoiceInput> {
    
    try {
      // Use Gemini AI for intent recognition
      const aiResult = await geminiAI.recognizeIntent(input, currentStep, reservationData);
      
      // Process the AI result based on current step
      return await this.processAIResult(aiResult, currentStep, reservationData, input);
      
    } catch (error) {
      console.error('Enhanced voice processing error:', error);
      
      // Fallback to basic processing
      return this.fallbackProcessing(input, currentStep, reservationData);
    }
  }

  private async processAIResult(
    aiResult: any,
    currentStep: ReservationStep,
    reservationData: ReservationData,
    originalInput: string
  ): Promise<EnhancedProcessedVoiceInput> {
    
    const { intent, entities, response } = aiResult;
    
    switch (currentStep) {
      case 'welcome':
        return this.processWelcomeStep(intent, entities, response);
      
      case 'dates-guests':
        return await this.processDatesGuestsStep(intent, entities, reservationData, originalInput);
      
      case 'room-selection':
        return await this.processRoomSelectionStep(intent, entities, reservationData, originalInput);
      
      case 'guest-info':
        return await this.processGuestInfoStep(intent, entities, reservationData, originalInput);
      
      case 'payment':
        return await this.processPaymentStep(intent, entities, reservationData, originalInput);
      
      case 'confirmation':
        return this.processConfirmationStep(intent, entities, response);
      
      default:
        return {
          intent,
          confidence: 0.5,
          entities,
          response: response || "Please follow the current step instructions.",
          suggestions: ['Try saying "help" for guidance']
        };
    }
  }

  private processWelcomeStep(intent: string, entities: any, response: string): EnhancedProcessedVoiceInput {
    if (intent === 'reservation_request') {
      return {
        intent,
        confidence: 1.0,
        entities,
        response: response || "Great! Let's start your reservation. Please tell me your check-in and check-out dates, and number of guests.",
        action: {
          type: 'SET_STEP',
          payload: 'dates-guests'
        },
        suggestions: ['Try: "Check-in July 15, check-out July 18, 2 adults"']
      };
    }

    return {
      intent,
      confidence: 0.5,
      entities,
      response: response || "Welcome to Lagunacreek! I can help you make a reservation. Just say 'book a room' to get started.",
      suggestions: ['Say: "Make a reservation"', 'Say: "Book a room"', 'Say: "I need a hotel room"']
    };
  }

  private async processDatesGuestsStep(
    intent: string, 
    entities: any, 
    reservationData: ReservationData,
    originalInput: string
  ): Promise<EnhancedProcessedVoiceInput> {
    
    const updates: any = {};
    const extracted = this.extractDatesAndGuests(originalInput, entities);
    
    if (extracted.checkIn) updates.checkIn = extracted.checkIn;
    if (extracted.checkOut) updates.checkOut = extracted.checkOut;
    if (extracted.adults > 0) updates.adults = extracted.adults;
    if (extracted.children >= 0) updates.children = extracted.children;

    const updatedData = { ...reservationData, ...updates };
    const missing = this.getMissingDatesGuestsInfo(updatedData);

    let response = '';
    if (Object.keys(updates).length > 0) {
      response = await geminiAI.generatePersonalizedResponse(
        originalInput, 
        'dates-guests', 
        updatedData,
        `Captured: ${Object.keys(updates).join(', ')}`
      );
    }

    if (missing.length > 0) {
      const helpResponse = await geminiAI.generateStepHelp('dates-guests', updatedData);
      response += ` ${helpResponse}`;
    } else {
      response += " Perfect! All information captured. Say 'Next' to choose your room.";
    }

    return {
      intent,
      confidence: 1.0,
      entities,
      response,
      action: Object.keys(updates).length > 0 ? {
        type: 'UPDATE_DATES_GUESTS',
        payload: updates
      } : undefined,
      suggestions: missing.length > 0 ? [
        'Try: "Check-in July 15, check-out July 18"',
        'Try: "2 adults and 1 child"'
      ] : ['Say: "Next"']
    };
  }

  private async processRoomSelectionStep(
    intent: string, 
    entities: any, 
    reservationData: ReservationData,
    originalInput: string
  ): Promise<EnhancedProcessedVoiceInput> {
    
    const roomType = this.extractRoomType(originalInput, entities);
    
    if (roomType) {
      const room = roomTypes.find(r => r.name.toLowerCase().includes(roomType.toLowerCase()));
      
      if (room) {
        const response = await geminiAI.generatePersonalizedResponse(
          originalInput,
          'room-selection',
          { ...reservationData, roomType: room.name },
          `Selected ${room.name} at $${room.price}/night`
        );

        return {
          intent,
          confidence: 1.0,
          entities,
          response: response + " Say 'Next' to continue with guest information.",
          action: {
            type: 'SET_ROOM',
            payload: {
              roomType: room.name,
              roomPrice: room.price
            }
          },
          suggestions: ['Say: "Next"']
        };
      }
    }

    const helpResponse = await geminiAI.generateStepHelp('room-selection', reservationData);
    return {
      intent,
      confidence: 0.5,
      entities,
      response: helpResponse,
      suggestions: [
        'Say: "Deluxe King Room"',
        'Say: "Family Suite"',
        'Say: "Ocean View Room"'
      ]
    };
  }

  private async processGuestInfoStep(
    intent: string, 
    entities: any, 
    reservationData: ReservationData,
    originalInput: string
  ): Promise<EnhancedProcessedVoiceInput> {
    
    const guestInfo = this.extractGuestInfo(originalInput, entities);
    const updates: any = {};
    
    if (guestInfo.name) updates.guestName = guestInfo.name;
    if (guestInfo.phone) updates.phone = guestInfo.phone;
    if (guestInfo.email) updates.email = guestInfo.email;

    let response = '';
    if (Object.keys(updates).length > 0) {
      response = await geminiAI.generatePersonalizedResponse(
        originalInput,
        'guest-info',
        { ...reservationData, ...updates },
        `Captured: ${Object.keys(updates).join(', ')}`
      );
    }

    const updatedData = { ...reservationData, ...updates };
    const missing = this.getMissingGuestInfo(updatedData);

    if (missing.length > 0) {
      const helpResponse = await geminiAI.generateStepHelp('guest-info', updatedData);
      response += ` ${helpResponse}`;
    } else {
      response += " Great! All your information is saved. Say 'Next' for payment options.";
    }

    return {
      intent,
      confidence: 1.0,
      entities,
      response,
      action: Object.keys(updates).length > 0 ? {
        type: 'UPDATE_GUEST_INFO',
        payload: updates
      } : undefined,
      suggestions: missing.length > 0 ? [
        'Try: "My name is John Smith"',
        'Try: "Phone 1234567890"',
        'Try: "Email john@example.com"'
      ] : ['Say: "Next"']
    };
  }

  private async processPaymentStep(
    intent: string, 
    entities: any, 
    reservationData: ReservationData,
    originalInput: string
  ): Promise<EnhancedProcessedVoiceInput> {
    
    const paymentMethod = this.extractPaymentMethod(originalInput, entities);
    
    if (paymentMethod) {
      const response = await geminiAI.generatePersonalizedResponse(
        originalInput,
        'payment',
        { ...reservationData, paymentMethod },
        `Selected payment method: ${paymentMethod}`
      );

      return {
        intent,
        confidence: 1.0,
        entities,
        response: response + " Say 'Next' to review your booking.",
        action: {
          type: 'SET_PAYMENT',
          payload: paymentMethod
        },
        suggestions: ['Say: "Next"']
      };
    }

    const helpResponse = await geminiAI.generateStepHelp('payment', reservationData);
    return {
      intent,
      confidence: 0.5,
      entities,
      response: helpResponse,
      suggestions: [
        'Say: "Credit Card"',
        'Say: "Pay at Hotel"',
        'Say: "UPI"'
      ]
    };
  }

  private processConfirmationStep(intent: string, entities: any, response: string): EnhancedProcessedVoiceInput {
    if (intent === 'confirmation') {
      return {
        intent,
        confidence: 1.0,
        entities,
        response: response || "Perfect! Your booking is confirmed. You'll receive a confirmation email shortly. Thank you for choosing Lagunacreek!",
        action: {
          type: 'CONFIRM_BOOKING',
          payload: true
        }
      };
    }

    return {
      intent,
      confidence: 0.5,
      entities,
      response: response || "Please review your booking details above and say 'Yes, confirm the booking' to complete your reservation.",
      suggestions: ['Say: "Yes, confirm the booking"', 'Say: "Confirm"', 'Say: "Book it"']
    };
  }

  // Helper methods for data extraction
  private extractDatesAndGuests(text: string, entities: any): {
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
  } {
    const result = { checkIn: '', checkOut: '', adults: 0, children: 0 };
    
    // Use AI entities first, then fallback to regex
    if (entities.dates && entities.dates.length > 0) {
      result.checkIn = entities.dates[0] || '';
      result.checkOut = entities.dates[1] || '';
    }
    
    if (entities.numbers && entities.numbers.length > 0) {
      // Smart number assignment based on context
      const numbers = entities.numbers.map((n: string) => parseInt(n)).filter((n: number) => !isNaN(n));
      if (numbers.length > 0) result.adults = numbers[0];
      if (numbers.length > 1) result.children = numbers[1];
    }

    // Fallback regex patterns
    if (!result.checkIn || !result.checkOut) {
      const dateMatch = text.match(/(\w+\s+\d{1,2}).*?(\w+\s+\d{1,2})/i);
      if (dateMatch) {
        if (!result.checkIn) result.checkIn = dateMatch[1];
        if (!result.checkOut) result.checkOut = dateMatch[2];
      }
    }

    return result;
  }

  private extractRoomType(text: string, entities: any): string | null {
    if (entities.room_types && entities.room_types.length > 0) {
      return entities.room_types[0];
    }

    const lowerText = text.toLowerCase();
    if (lowerText.includes('deluxe') || lowerText.includes('king')) return 'Deluxe King Room';
    if (lowerText.includes('family') || lowerText.includes('suite')) return 'Family Suite';
    if (lowerText.includes('ocean') || lowerText.includes('view')) return 'Ocean View Room';
    
    return null;
  }

  private extractGuestInfo(text: string, entities: any): { name: string; phone: string; email: string } {
    const result = { name: '', phone: '', email: '' };
    
    if (entities.names && entities.names.length > 0) {
      result.name = entities.names[0];
    }
    
    // Extract phone and email with regex as fallback
    const phoneMatch = text.match(/(\d{10})/);
    if (phoneMatch) result.phone = phoneMatch[1];
    
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) result.email = emailMatch[1];
    
    return result;
  }

  private extractPaymentMethod(text: string, entities: any): string | null {
    if (entities.payment_methods && entities.payment_methods.length > 0) {
      return entities.payment_methods[0];
    }

    const lowerText = text.toLowerCase();
    if (lowerText.includes('credit') || lowerText.includes('card')) return 'Credit Card';
    if (lowerText.includes('hotel') || lowerText.includes('cash')) return 'Pay at Hotel';
    if (lowerText.includes('upi') || lowerText.includes('digital')) return 'UPI or Digital Wallet';
    
    return null;
  }

  private getMissingDatesGuestsInfo(data: ReservationData): string[] {
    const missing: string[] = [];
    if (!data.checkIn) missing.push("check-in date");
    if (!data.checkOut) missing.push("check-out date");
    if (!data.adults) missing.push("number of adults");
    return missing;
  }

  private getMissingGuestInfo(data: ReservationData): string[] {
    const missing: string[] = [];
    if (!data.guestName) missing.push("name");
    if (!data.phone) missing.push("phone");
    if (!data.email) missing.push("email");
    return missing;
  }

  private fallbackProcessing(
    input: string,
    currentStep: ReservationStep,
    reservationData: ReservationData
  ): EnhancedProcessedVoiceInput {
    return {
      intent: 'unknown',
      confidence: 0.3,
      entities: {},
      response: "I'm having trouble understanding. Could you please try again or speak more clearly?",
      suggestions: ['Try speaking more slowly', 'Say "help" for guidance']
    };
  }

  // Get contextual help for any step
  public async getStepHelp(step: ReservationStep, reservationData: ReservationData): Promise<string> {
    try {
      return await geminiAI.generateStepHelp(step, reservationData);
    } catch (error) {
      console.error('Help generation error:', error);
      return "I'm here to help you complete your reservation. Please let me know what you need assistance with.";
    }
  }
}

export const enhancedVoiceProcessingService = new EnhancedVoiceProcessingService();