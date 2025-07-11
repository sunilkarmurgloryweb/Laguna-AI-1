import { vectorDB } from './vectorDatabase';
import { ReservationData, ReservationStep } from '../types/reservation';

export interface ProcessedVoiceInput {
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  response: string;
  action?: {
    type: string;
    payload: any;
  };
}

class VoiceProcessingService {
  
  public processVoiceInput(
    input: string, 
    currentStep: ReservationStep, 
    reservationData: ReservationData
  ): ProcessedVoiceInput {
    
    // Use vector database to find intent
    const intentResult = vectorDB.findIntent(input);
    
    if (!intentResult) {
      return {
        intent: 'unknown',
        confidence: 0,
        entities: {},
        response: "I didn't understand that. Could you please repeat or try saying it differently?"
      };
    }

    const { intent, confidence, entities } = intentResult;

    // Process based on intent and current step
    return this.processIntentBasedOnStep(intent, entities, currentStep, reservationData, input);
  }

  private processIntentBasedOnStep(
    intent: string,
    entities: Record<string, any>,
    currentStep: ReservationStep,
    reservationData: ReservationData,
    originalInput: string
  ): ProcessedVoiceInput {

    switch (currentStep) {
      case 'welcome':
        return this.processWelcomeStep(intent, entities);
      
      case 'dates-guests':
        return this.processDatesGuestsStep(intent, entities, reservationData);
      
      case 'room-selection':
        return this.processRoomSelectionStep(intent, entities, reservationData);
      
      case 'guest-info':
        return this.processGuestInfoStep(intent, entities, reservationData);
      
      case 'payment':
        return this.processPaymentStep(intent, entities, reservationData);
      
      case 'confirmation':
        return this.processConfirmationStep(intent, entities);
      
      default:
        return {
          intent,
          confidence: 0.5,
          entities,
          response: "Please follow the current step instructions."
        };
    }
  }

  private processWelcomeStep(intent: string, entities: Record<string, any>): ProcessedVoiceInput {
    if (intent === 'reservation_request') {
      return {
        intent,
        confidence: 1.0,
        entities,
        response: "Great! Let's start your reservation. Please tell me your check-in and check-out dates, number of adults, and number of children.",
        action: {
          type: 'SET_STEP',
          payload: 'dates-guests'
        }
      };
    }

    return {
      intent,
      confidence: 0.5,
      entities,
      response: "I can help you make a reservation. Please say something like 'I want to book a room' or 'Make a reservation'."
    };
  }

  private processDatesGuestsStep(
    intent: string, 
    entities: Record<string, any>, 
    reservationData: ReservationData
  ): ProcessedVoiceInput {
    
    if (intent === 'missing_info_query') {
      return this.handleMissingInfoQuery('dates-guests', reservationData);
    }

    const updates: any = {};
    let responseMessages: string[] = [];

    // Handle date intents
    if (intent === 'check_in_date' && entities.date) {
      updates.checkIn = entities.date;
      responseMessages.push(`check-in: ${entities.date}`);
    }

    if (intent === 'check_out_date' && entities.date) {
      updates.checkOut = entities.date;
      responseMessages.push(`check-out: ${entities.date}`);
    }

    // Handle guest count
    if (intent === 'guest_count') {
      if (entities.adults > 0) {
        updates.adults = entities.adults;
        responseMessages.push(`${entities.adults} adults`);
      }
      if (entities.children > 0) {
        updates.children = entities.children;
        responseMessages.push(`${entities.children} children`);
      }
    }

    // Check if we have all required information
    const updatedData = { ...reservationData, ...updates };
    const missing = this.getMissingDatesGuestsInfo(updatedData);

    let response = '';
    if (responseMessages.length > 0) {
      response = `I got ${responseMessages.join(', ')}. `;
    }

    if (missing.length > 0) {
      response += `I still need: ${missing.join(', ')}. Please provide the missing information.`;
    } else {
      response += "All required information is complete! Say 'Next' to continue to room selection.";
    }

    return {
      intent,
      confidence: 1.0,
      entities,
      response,
      action: Object.keys(updates).length > 0 ? {
        type: 'UPDATE_DATES_GUESTS',
        payload: updates
      } : undefined
    };
  }

  private processRoomSelectionStep(
    intent: string, 
    entities: Record<string, any>, 
    reservationData: ReservationData
  ): ProcessedVoiceInput {
    
    if (intent === 'missing_info_query') {
      return this.handleMissingInfoQuery('room-selection', reservationData);
    }

    if (intent === 'room_selection' && entities.room_type) {
      const roomPrices: Record<string, number> = {
        'Deluxe King Room': 120,
        'Family Suite': 180,
        'Ocean View Room': 150
      };

      const price = roomPrices[entities.room_type] || 120;

      return {
        intent,
        confidence: 1.0,
        entities,
        response: `${entities.room_type} selected at $${price} per night. Say 'Next' to continue.`,
        action: {
          type: 'SET_ROOM',
          payload: {
            roomType: entities.room_type,
            roomPrice: price
          }
        }
      };
    }

    return {
      intent,
      confidence: 0.5,
      entities,
      response: "Please select a room type by saying 'Deluxe King Room', 'Family Suite', or 'Ocean View Room'."
    };
  }

  private processGuestInfoStep(
    intent: string, 
    entities: Record<string, any>, 
    reservationData: ReservationData
  ): ProcessedVoiceInput {
    
    if (intent === 'missing_info_query') {
      return this.handleMissingInfoQuery('guest-info', reservationData);
    }

    if (intent === 'guest_info') {
      const updates: any = {};
      const captured: string[] = [];

      if (entities.name) {
        updates.guestName = entities.name;
        captured.push(`name: ${entities.name}`);
      }
      if (entities.phone) {
        updates.phone = entities.phone;
        captured.push(`phone: ${entities.phone}`);
      }
      if (entities.email) {
        updates.email = entities.email;
        captured.push(`email: ${entities.email}`);
      }

      const response = captured.length > 0 
        ? `Thanks! I've saved your ${captured.join(', ')}. Say 'Next' to continue.`
        : "Please provide your name, phone number, and email address.";

      return {
        intent,
        confidence: 1.0,
        entities,
        response,
        action: Object.keys(updates).length > 0 ? {
          type: 'UPDATE_GUEST_INFO',
          payload: updates
        } : undefined
      };
    }

    return {
      intent,
      confidence: 0.5,
      entities,
      response: "Please tell me your full name, contact number, and email address."
    };
  }

  private processPaymentStep(
    intent: string, 
    entities: Record<string, any>, 
    reservationData: ReservationData
  ): ProcessedVoiceInput {
    
    if (intent === 'missing_info_query') {
      return this.handleMissingInfoQuery('payment', reservationData);
    }

    if (intent === 'payment_method' && entities.payment_type) {
      return {
        intent,
        confidence: 1.0,
        entities,
        response: `${entities.payment_type} selected. Say 'Next' to review your booking.`,
        action: {
          type: 'SET_PAYMENT',
          payload: entities.payment_type
        }
      };
    }

    return {
      intent,
      confidence: 0.5,
      entities,
      response: "Please choose your payment method: 'Credit Card', 'Pay at Hotel', or 'UPI'."
    };
  }

  private processConfirmationStep(intent: string, entities: Record<string, any>): ProcessedVoiceInput {
    if (intent === 'confirmation') {
      return {
        intent,
        confidence: 1.0,
        entities,
        response: "Your booking is confirmed! A confirmation email has been sent. Thank you for choosing Lagunacreek.",
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
      response: "Please review your booking details and say 'Yes, confirm the booking' to proceed."
    };
  }

  private handleMissingInfoQuery(step: ReservationStep, reservationData: ReservationData): ProcessedVoiceInput {
    let response = '';

    switch (step) {
      case 'dates-guests':
        const missing = this.getMissingDatesGuestsInfo(reservationData);
        const captured = this.getCapturedDatesGuestsInfo(reservationData);
        
        if (captured.length > 0) {
          response += `I have captured: ${captured.join(', ')}. `;
        }
        
        if (missing.length > 0) {
          response += `I still need: ${missing.join(', ')}. Please provide the missing information.`;
        } else {
          response += "All required information is complete! Say 'Next' to continue to room selection.";
        }
        break;

      case 'room-selection':
        response = !reservationData.roomType 
          ? "I need you to select a room type. Please say 'Deluxe King Room', 'Family Suite', or 'Ocean View Room'."
          : `You have selected ${reservationData.roomType}. Say 'Next' to continue to guest information.`;
        break;

      case 'guest-info':
        const guestMissing = this.getMissingGuestInfo(reservationData);
        const guestCaptured = this.getCapturedGuestInfo(reservationData);
        
        if (guestCaptured.length > 0) {
          response += `I have your ${guestCaptured.join(', ')}. `;
        }
        
        if (guestMissing.length > 0) {
          response += `I still need your ${guestMissing.join(', ')}. Please provide the missing details.`;
        } else {
          response += "All guest information is complete! Say 'Next' to continue to payment selection.";
        }
        break;

      case 'payment':
        response = !reservationData.paymentMethod
          ? "I need you to select a payment method. Please say 'Credit Card', 'Pay at Hotel', or 'UPI'."
          : `You have selected ${reservationData.paymentMethod}. Say 'Next' to review your booking.`;
        break;

      case 'confirmation':
        response = "Your booking details are complete and ready for confirmation. Please review the information and say 'Yes, confirm the booking' to proceed.";
        break;

      default:
        response = "Please follow the prompts to complete your reservation.";
        break;
    }

    return {
      intent: 'missing_info_query',
      confidence: 1.0,
      entities: {},
      response
    };
  }

  private getMissingDatesGuestsInfo(data: ReservationData): string[] {
    const missing: string[] = [];
    if (!data.checkIn) missing.push("check-in date");
    if (!data.checkOut) missing.push("check-out date");
    if (!data.adults) missing.push("number of adults");
    return missing;
  }

  private getCapturedDatesGuestsInfo(data: ReservationData): string[] {
    const captured: string[] = [];
    if (data.checkIn) captured.push(`check-in: ${data.checkIn}`);
    if (data.checkOut) captured.push(`check-out: ${data.checkOut}`);
    if (data.adults) captured.push(`${data.adults} adults`);
    if (data.children) captured.push(`${data.children} children`);
    return captured;
  }

  private getMissingGuestInfo(data: ReservationData): string[] {
    const missing: string[] = [];
    if (!data.guestName) missing.push("full name");
    if (!data.phone) missing.push("phone number");
    if (!data.email) missing.push("email address");
    return missing;
  }

  private getCapturedGuestInfo(data: ReservationData): string[] {
    const captured: string[] = [];
    if (data.guestName) captured.push(`name: ${data.guestName}`);
    if (data.phone) captured.push(`phone: ${data.phone}`);
    if (data.email) captured.push(`email: ${data.email}`);
    return captured;
  }
}

export const voiceProcessingService = new VoiceProcessingService();