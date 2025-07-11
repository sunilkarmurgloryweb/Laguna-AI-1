import { ReservationData, CheckInData, CheckOutData, RoomAvailabilityData } from '../types/reservation';
import { multilingualAI } from './multilingualAIService';

// Voice command patterns for different languages
const VOICE_PATTERNS = {
  reservation: {
    en: ['book', 'reserve', 'reservation', 'room', 'stay'],
    es: ['reservar', 'reserva', 'habitación', 'cuarto'],
    hi: ['बुकिंग', 'आरक्षण', 'कमरा', 'होटल']
  },
  checkin: {
    en: ['check in', 'checkin', 'arrival', 'arrive'],
    es: ['check in', 'llegada', 'registrarse'],
    hi: ['चेक इन', 'पहुंचना', 'आना']
  },
  checkout: {
    en: ['check out', 'checkout', 'departure', 'leave'],
    es: ['check out', 'salida', 'partir'],
    hi: ['चेक आउट', 'जाना', 'निकलना']
  },
  availability: {
    en: ['available', 'availability', 'rooms available', 'vacancy'],
    es: ['disponible', 'disponibilidad', 'habitaciones'],
    hi: ['उपलब्ध', 'उपलब्धता', 'खाली कमरे']
  }
};

// Date patterns for different languages
const DATE_PATTERNS = {
  en: /(\d{1,2})\s*(january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2})/i,
  es: /(\d{1,2})\s*(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|\d{1,2})/i,
  hi: /(\d{1,2})\s*(जनवरी|फरवरी|मार्च|अप्रैल|मई|जून|जुलाई|अगस्त|सितंबर|अक्टूबर|नवंबर|दिसंबर|\d{1,2})/i
};

// Number patterns for guest count
const NUMBER_PATTERNS = {
  en: /(\d+)\s*(adult|adults|guest|guests|person|people|child|children)/i,
  es: /(\d+)\s*(adulto|adultos|huésped|huéspedes|persona|personas|niño|niños)/i,
  hi: /(\d+)\s*(वयस्क|अतिथि|व्यक्ति|बच्चा|बच्चे)/i
};

export class VoiceReservationService {
  private static instance: VoiceReservationService;

  public static getInstance(): VoiceReservationService {
    if (!VoiceReservationService.instance) {
      VoiceReservationService.instance = new VoiceReservationService();
    }
    return VoiceReservationService.instance;
  }

  // Detect intent from voice input
  public detectIntent(text: string): 'reservation' | 'checkin' | 'checkout' | 'availability' | 'unknown' {
    const lowerText = text.toLowerCase();
    
    // Check for reservation patterns
    if (this.matchesPatterns(lowerText, VOICE_PATTERNS.reservation)) {
      return 'reservation';
    }
    
    // Check for check-in patterns
    if (this.matchesPatterns(lowerText, VOICE_PATTERNS.checkin)) {
      return 'checkin';
    }
    
    // Check for check-out patterns
    if (this.matchesPatterns(lowerText, VOICE_PATTERNS.checkout)) {
      return 'checkout';
    }
    
    // Check for availability patterns
    if (this.matchesPatterns(lowerText, VOICE_PATTERNS.availability)) {
      return 'availability';
    }
    
    return 'unknown';
  }

  // Extract reservation data from voice input
  public extractReservationData(text: string): Partial<ReservationData> {
    const data: Partial<ReservationData> = {};
    
    // Extract dates
    const dates = this.extractDates(text);
    if (dates.checkIn) data.checkInDate = dates.checkIn;
    if (dates.checkOut) data.checkOutDate = dates.checkOut;
    
    // Extract guest count
    const guests = this.extractGuestCount(text);
    if (guests.adults) data.adults = guests.adults;
    if (guests.children) data.children = guests.children;
    
    // Extract room type
    const roomType = this.extractRoomType(text);
    if (roomType) data.roomType = roomType;
    
    // Extract guest info
    const guestInfo = this.extractGuestInfo(text);
    if (guestInfo.name) data.guestName = guestInfo.name;
    if (guestInfo.email) data.email = guestInfo.email;
    if (guestInfo.phone) data.phone = guestInfo.phone;
    
    return data;
  }

  // Extract check-in data from voice input
  public extractCheckInData(text: string): Partial<CheckInData> {
    const data: Partial<CheckInData> = {};
    
    // Extract guest info
    const guestInfo = this.extractGuestInfo(text);
    if (guestInfo.name) data.guestName = guestInfo.name;
    if (guestInfo.email) data.email = guestInfo.email;
    if (guestInfo.phone) data.phone = guestInfo.phone;
    
    // Extract confirmation number
    const confirmation = this.extractConfirmationNumber(text);
    if (confirmation) data.confirmationNumber = confirmation;
    
    return data;
  }

  // Extract check-out data from voice input
  public extractCheckOutData(text: string): Partial<CheckOutData> {
    const data: Partial<CheckOutData> = {};
    
    // Extract room number
    const roomNumber = this.extractRoomNumber(text);
    if (roomNumber) data.roomNumber = roomNumber;
    
    // Extract guest info
    const guestInfo = this.extractGuestInfo(text);
    if (guestInfo.name) data.guestName = guestInfo.name;
    
    return data;
  }

  // Extract room availability data from voice input
  public extractAvailabilityData(text: string): Partial<RoomAvailabilityData> {
    const data: Partial<RoomAvailabilityData> = {};
    
    // Extract dates
    const dates = this.extractDates(text);
    if (dates.checkIn) data.checkInDate = dates.checkIn;
    if (dates.checkOut) data.checkOutDate = dates.checkOut;
    
    // Extract guest count
    const guests = this.extractGuestCount(text);
    if (guests.adults) data.adults = guests.adults;
    if (guests.children) data.children = guests.children;
    
    // Extract room type
    const roomType = this.extractRoomType(text);
    if (roomType) data.roomType = roomType;
    
    return data;
  }

  // Helper methods
  private matchesPatterns(text: string, patterns: { [key: string]: string[] }): boolean {
    for (const lang in patterns) {
      for (const pattern of patterns[lang]) {
        if (text.includes(pattern)) {
          return true;
        }
      }
    }
    return false;
  }

  private extractDates(text: string): { checkIn?: string; checkOut?: string } {
    const dates: { checkIn?: string; checkOut?: string } = {};
    
    // Simple date extraction (can be enhanced)
    const dateMatches = text.match(/(\d{1,2})\s*(january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2})/gi);
    
    if (dateMatches && dateMatches.length >= 1) {
      dates.checkIn = this.formatDate(dateMatches[0]);
    }
    
    if (dateMatches && dateMatches.length >= 2) {
      dates.checkOut = this.formatDate(dateMatches[1]);
    }
    
    return dates;
  }

  private extractGuestCount(text: string): { adults?: number; children?: number } {
    const guests: { adults?: number; children?: number } = {};
    
    // Extract adults
    const adultMatch = text.match(/(\d+)\s*(adult|adults|guest|guests|person|people|वयस्क|अतिथि)/i);
    if (adultMatch) {
      guests.adults = parseInt(adultMatch[1]);
    }
    
    // Extract children
    const childMatch = text.match(/(\d+)\s*(child|children|kid|kids|बच्चा|बच्चे)/i);
    if (childMatch) {
      guests.children = parseInt(childMatch[1]);
    }
    
    return guests;
  }

  private extractRoomType(text: string): string | undefined {
    const roomTypes = [
      'standard', 'deluxe', 'suite', 'ocean view', 'city view', 'king', 'queen', 'twin',
      'स्टैंडर्ड', 'डीलक्स', 'सूट', 'समुद्री दृश्य'
    ];
    
    for (const type of roomTypes) {
      if (text.toLowerCase().includes(type)) {
        return type;
      }
    }
    
    return undefined;
  }

  private extractGuestInfo(text: string): { name?: string; email?: string; phone?: string } {
    const info: { name?: string; email?: string; phone?: string } = {};
    
    // Extract email
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      info.email = emailMatch[1];
    }
    
    // Extract phone
    const phoneMatch = text.match(/(\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\d{10})/);
    if (phoneMatch) {
      info.phone = phoneMatch[1];
    }
    
    // Extract name (simple pattern)
    const nameMatch = text.match(/(?:my name is|i am|नाम है)\s+([a-zA-Z\s]+)/i);
    if (nameMatch) {
      info.name = nameMatch[1].trim();
    }
    
    return info;
  }

  private extractConfirmationNumber(text: string): string | undefined {
    const confirmationMatch = text.match(/(?:confirmation|booking|reference)\s*(?:number|#)?\s*([A-Z0-9]{6,})/i);
    return confirmationMatch ? confirmationMatch[1] : undefined;
  }

  private extractRoomNumber(text: string): string | undefined {
    const roomMatch = text.match(/room\s*(?:number)?\s*(\d+)/i);
    return roomMatch ? roomMatch[1] : undefined;
  }

  private formatDate(dateStr: string): string {
    // Simple date formatting (can be enhanced)
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // If it's just a number, assume it's a day in the current month
    if (/^\d{1,2}$/.test(dateStr)) {
      const day = parseInt(dateStr);
      const month = now.getMonth();
      return new Date(currentYear, month, day).toISOString().split('T')[0];
    }
    
    // More sophisticated date parsing can be added here
    return dateStr;
  }

  // Language detection
  public detectLanguage(text: string): 'en' | 'es' | 'hi' {
    // Check for Hindi (Devanagari script)
    if (/[\u0900-\u097F]/.test(text)) {
      return 'hi';
    }
    
    // Check for Spanish keywords
    const spanishWords = ['reservar', 'habitación', 'huésped', 'llegada', 'salida'];
    if (spanishWords.some(word => text.toLowerCase().includes(word))) {
      return 'es';
    }
    
    // Default to English
    return 'en';
  }
}

  // Process voice command and handle modal opening
  public async processVoiceCommand(
    text: string,
    currentLanguage: string,
    onOpenModal: (modalType: string, data?: any) => void,
    detectedLanguage: string
  ): Promise<string> {
    try {
      const intent = this.detectIntent(text);
      
      switch (intent) {
        case 'reservation':
          const reservationData = this.extractReservationData(text);
          onOpenModal('reservation', reservationData);
          return detectedLanguage === 'hi' 
            ? 'मैं आपकी बुकिंग में मदद करूंगा। कृपया विवरण भरें।'
            : detectedLanguage === 'es'
            ? 'Te ayudaré con tu reserva. Por favor completa los detalles.'
            : 'I\'ll help you with your reservation. Please fill in the details.';
            
        case 'checkin':
          const checkInData = this.extractCheckInData(text);
          onOpenModal('checkin', checkInData);
          return detectedLanguage === 'hi'
            ? 'चेक-इन प्रक्रिया शुरू कर रहा हूं। कृपया जानकारी प्रदान करें।'
            : detectedLanguage === 'es'
            ? 'Iniciando el proceso de check-in. Por favor proporciona la información.'
            : 'Starting check-in process. Please provide your information.';
            
        case 'checkout':
          const checkOutData = this.extractCheckOutData(text);
          onOpenModal('checkout', checkOutData);
          return detectedLanguage === 'hi'
            ? 'चेक-आउट प्रक्रिया शुरू कर रहा हूं।'
            : detectedLanguage === 'es'
            ? 'Iniciando el proceso de check-out.'
            : 'Starting check-out process.';
            
        case 'availability':
          const availabilityData = this.extractAvailabilityData(text);
          onOpenModal('availability', availabilityData);
          return detectedLanguage === 'hi'
            ? 'उपलब्ध कमरे दिखा रहा हूं।'
            : detectedLanguage === 'es'
            ? 'Mostrando habitaciones disponibles.'
            : 'Showing available rooms.';
            
        default:
          return await multilingualAI.getResponse('error', {}, detectedLanguage);
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      return await multilingualAI.getResponse('error', {}, detectedLanguage);
    }
  }

export default VoiceReservationService.getInstance();