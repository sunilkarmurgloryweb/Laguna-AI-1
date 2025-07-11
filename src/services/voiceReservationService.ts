import { multilingualAI } from './multilingualAIService';
import { geminiAI } from './geminiAIService';

interface ReservationState {
  step: 'language' | 'service' | 'dates' | 'guests' | 'rooms' | 'guestInfo' | 'payment' | 'confirmation';
  language: string;
  serviceType: 'reservation' | 'checkin' | 'checkout' | 'availability';
  data: {
    checkIn?: string;
    checkOut?: string;
    adults?: number;
    children?: number;
    roomType?: string;
    roomPrice?: number;
    guestName?: string;
    phone?: string;
    email?: string;
    paymentMethod?: string;
    confirmationNumber?: string;
  };
}

class VoiceReservationService {
  private state: ReservationState = {
    step: 'language',
    language: 'en',
    serviceType: 'reservation',
    data: {}
  };

  public async processVoiceInput(input: string): Promise<{
    response: string;
    action?: string;
    data?: any;
    nextStep?: string;
  }> {
    try {
      // Auto-detect language if not set
      if (this.state.step === 'language') {
        const detectedLang = multilingualAI.detectLanguageFromText(input);
        this.state.language = detectedLang;
        multilingualAI.setLanguage(detectedLang);
      }

      // Process based on current step
      switch (this.state.step) {
        case 'language':
          return this.handleLanguageSelection(input);
        
        case 'service':
          return this.handleServiceSelection(input);
        
        case 'dates':
          return this.handleDateInput(input);
        
        case 'guests':
          return this.handleGuestInput(input);
        
        case 'rooms':
          return this.handleRoomSelection(input);
        
        case 'guestInfo':
          return this.handleGuestInfoInput(input);
        
        case 'payment':
          return this.handlePaymentInput(input);
        
        case 'confirmation':
          return this.handleConfirmation(input);
        
        default:
          return {
            response: multilingualAI.getResponse('error'),
            action: 'error'
          };
      }
    } catch (error) {
      console.error('Voice processing error:', error);
      return {
        response: multilingualAI.getResponse('error'),
        action: 'error'
      };
    }
  }

  private async handleLanguageSelection(input: string): Promise<any> {
    // Language selection logic
    const lowerInput = input.toLowerCase();
    let selectedLang = 'en';

    if (lowerInput.includes('spanish') || lowerInput.includes('español')) selectedLang = 'es';
    else if (lowerInput.includes('hindi') || lowerInput.includes('हिंदी')) selectedLang = 'hi';
    else if (lowerInput.includes('french') || lowerInput.includes('français')) selectedLang = 'fr';
    else if (lowerInput.includes('german') || lowerInput.includes('deutsch')) selectedLang = 'de';

    this.state.language = selectedLang;
    multilingualAI.setLanguage(selectedLang);
    this.state.step = 'service';

    return {
      response: multilingualAI.getGreeting('welcome'),
      action: 'languageSelected',
      data: { language: selectedLang },
      nextStep: 'service'
    };
  }

  private async handleServiceSelection(input: string): Promise<any> {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('reservation') || lowerInput.includes('book') || lowerInput.includes('reserva')) {
      this.state.serviceType = 'reservation';
      this.state.step = 'dates';
      return {
        response: multilingualAI.getGreeting('reservation'),
        action: 'serviceSelected',
        data: { serviceType: 'reservation' },
        nextStep: 'dates'
      };
    }
    
    if (lowerInput.includes('check in') || lowerInput.includes('checkin')) {
      this.state.serviceType = 'checkin';
      this.state.step = 'guestInfo';
      return {
        response: multilingualAI.getGreeting('checkin'),
        action: 'serviceSelected',
        data: { serviceType: 'checkin' },
        nextStep: 'guestInfo'
      };
    }
    
    if (lowerInput.includes('check out') || lowerInput.includes('checkout')) {
      this.state.serviceType = 'checkout';
      return {
        response: multilingualAI.getGreeting('checkout'),
        action: 'serviceSelected',
        data: { serviceType: 'checkout' },
        nextStep: 'confirmation'
      };
    }
    
    if (lowerInput.includes('availability') || lowerInput.includes('available')) {
      this.state.serviceType = 'availability';
      this.state.step = 'dates';
      return {
        response: multilingualAI.getGreeting('roomAvailability'),
        action: 'serviceSelected',
        data: { serviceType: 'availability' },
        nextStep: 'dates'
      };
    }

    return {
      response: multilingualAI.getResponse('help'),
      action: 'clarification'
    };
  }

  private async handleDateInput(input: string): Promise<any> {
    // Use Gemini AI to extract dates
    const prompt = `Extract check-in and check-out dates from this text: "${input}". 
    Respond in JSON format: {"checkin": "date", "checkout": "date"}. 
    If only one date is mentioned, put it in checkin. Use format like "July 15, 2024".`;

    try {
      const aiResponse = await geminiAI.generateContent(prompt, 0.3);
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const dates = JSON.parse(jsonMatch[0]);
        
        if (dates.checkin) this.state.data.checkIn = dates.checkin;
        if (dates.checkout) this.state.data.checkOut = dates.checkout;
        
        this.state.step = 'guests';
        
        return {
          response: multilingualAI.getResponse('dateConfirm', {
            checkin: dates.checkin || 'Not specified',
            checkout: dates.checkout || 'Not specified'
          }) + ' ' + multilingualAI.getPrompt('guests'),
          action: 'datesReceived',
          data: { checkIn: dates.checkin, checkOut: dates.checkout },
          nextStep: 'guests'
        };
      }
    } catch (error) {
      console.error('Date extraction error:', error);
    }

    return {
      response: multilingualAI.getPrompt('dates'),
      action: 'clarification'
    };
  }

  private async handleGuestInput(input: string): Promise<any> {
    // Extract guest numbers
    const adultMatch = input.match(/(\d+)\s*(adult|adults|person|people)/i);
    const childMatch = input.match(/(\d+)\s*(child|children|kid|kids)/i);
    
    if (adultMatch) {
      this.state.data.adults = parseInt(adultMatch[1]);
    }
    
    if (childMatch) {
      this.state.data.children = parseInt(childMatch[1]);
    }

    if (this.state.data.adults) {
      this.state.step = 'rooms';
      return {
        response: `${this.state.data.adults} adults${this.state.data.children ? `, ${this.state.data.children} children` : ''}. ` + 
                 multilingualAI.getPrompt('roomType'),
        action: 'guestsReceived',
        data: { adults: this.state.data.adults, children: this.state.data.children || 0 },
        nextStep: 'rooms'
      };
    }

    return {
      response: multilingualAI.getPrompt('guests'),
      action: 'clarification'
    };
  }

  private async handleRoomSelection(input: string): Promise<any> {
    const lowerInput = input.toLowerCase();
    let roomType = '';
    let roomPrice = 0;

    if (lowerInput.includes('ocean view') || lowerInput.includes('king suite')) {
      roomType = 'Ocean View King Suite';
      roomPrice = 299;
    } else if (lowerInput.includes('deluxe') || lowerInput.includes('garden')) {
      roomType = 'Deluxe Garden Room';
      roomPrice = 199;
    } else if (lowerInput.includes('family') || lowerInput.includes('oceanfront')) {
      roomType = 'Family Oceanfront Suite';
      roomPrice = 399;
    } else if (lowerInput.includes('presidential')) {
      roomType = 'Presidential Suite';
      roomPrice = 599;
    } else if (lowerInput.includes('standard') || lowerInput.includes('double')) {
      roomType = 'Standard Double Room';
      roomPrice = 149;
    } else if (lowerInput.includes('luxury') || lowerInput.includes('spa')) {
      roomType = 'Luxury Spa Suite';
      roomPrice = 449;
    }

    if (roomType) {
      this.state.data.roomType = roomType;
      this.state.data.roomPrice = roomPrice;
      this.state.step = 'guestInfo';
      
      return {
        response: multilingualAI.getResponse('roomSelected', { roomType, price: roomPrice.toString() }) + 
                 ' ' + multilingualAI.getPrompt('guestInfo'),
        action: 'roomSelected',
        data: { roomType, roomPrice },
        nextStep: 'guestInfo'
      };
    }

    return {
      response: multilingualAI.getPrompt('roomType'),
      action: 'clarification'
    };
  }

  private async handleGuestInfoInput(input: string): Promise<any> {
    // Extract guest information
    const nameMatch = input.match(/(?:name is|i'm|i am)\s+([a-zA-Z\s]+?)(?:\s*,|\s+and|\s+my|\s+phone|\s+email|$)/i);
    const phoneMatch = input.match(/(\d{10})/);
    const emailMatch = input.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);

    if (nameMatch) this.state.data.guestName = nameMatch[1].trim();
    if (phoneMatch) this.state.data.phone = phoneMatch[1];
    if (emailMatch) this.state.data.email = emailMatch[1];

    if (this.state.data.guestName && this.state.data.phone && this.state.data.email) {
      this.state.step = 'payment';
      return {
        response: multilingualAI.getResponse('infoReceived') + ' ' + multilingualAI.getPrompt('payment'),
        action: 'guestInfoReceived',
        data: {
          guestName: this.state.data.guestName,
          phone: this.state.data.phone,
          email: this.state.data.email
        },
        nextStep: 'payment'
      };
    }

    return {
      response: multilingualAI.getPrompt('guestInfo'),
      action: 'clarification'
    };
  }

  private async handlePaymentInput(input: string): Promise<any> {
    const lowerInput = input.toLowerCase();
    let paymentMethod = '';

    if (lowerInput.includes('credit card') || lowerInput.includes('card')) {
      paymentMethod = 'Credit Card';
    } else if (lowerInput.includes('hotel') || lowerInput.includes('cash')) {
      paymentMethod = 'Pay at Hotel';
    } else if (lowerInput.includes('digital') || lowerInput.includes('wallet') || lowerInput.includes('upi')) {
      paymentMethod = 'Digital Wallet';
    }

    if (paymentMethod) {
      this.state.data.paymentMethod = paymentMethod;
      this.state.step = 'confirmation';
      
      return {
        response: multilingualAI.getResponse('paymentSet', { paymentMethod }) + ' ' + 
                 multilingualAI.getPrompt('confirmation'),
        action: 'paymentSelected',
        data: { paymentMethod },
        nextStep: 'confirmation'
      };
    }

    return {
      response: multilingualAI.getPrompt('payment'),
      action: 'clarification'
    };
  }

  private async handleConfirmation(input: string): Promise<any> {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('confirm') || lowerInput.includes('yes') || lowerInput.includes('book')) {
      const confirmationId = 'LG' + Math.random().toString(36).substr(2, 9).toUpperCase();
      
      return {
        response: multilingualAI.getResponse('bookingConfirmed', { confirmationId }),
        action: 'bookingConfirmed',
        data: { 
          confirmationId,
          ...this.state.data 
        },
        nextStep: 'complete'
      };
    }

    return {
      response: multilingualAI.getPrompt('confirmation'),
      action: 'clarification'
    };
  }

  public getCurrentState(): ReservationState {
    return { ...this.state };
  }

  public resetState(): void {
    this.state = {
      step: 'language',
      language: 'en',
      serviceType: 'reservation',
      data: {}
    };
  }

  public setLanguage(language: string): void {
    this.state.language = language;
    multilingualAI.setLanguage(language);
  }
}

export const voiceReservationService = new VoiceReservationService();