export interface ReservationData {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  roomType: string;
  roomPrice: number;
  guestName: string;
  phone: string;
  email: string;
  paymentMethod: string;
  hotel: string;
}

export interface Hotel {
  id: string;
  name: string;
  description: string;
  address: string;
  rating: number;
}

export interface RoomType {
  id: string;
  name: string;
  price: number;
  description: string;
  amenities: string[];
  maxOccupancy: number;
  available: number;
}

export type Language = 'en' | 'es' | 'hi' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'zh';

export type ReservationStep = 
  | 'language'
  | 'welcome'
  | 'hotel-selection'
  | 'dates-guests'
  | 'room-selection'
  | 'guest-info'
  | 'payment'
  | 'confirmation';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export interface CheckInData {
  guestName?: string;
  email?: string;
  phone?: string;
  confirmationNumber?: string;
}

export interface CheckOutData {
  roomNumber?: string;
  guestName?: string;
}

export interface RoomAvailabilityData {
  checkInDate?: string;
  checkOutDate?: string;
  adults?: number;
  children?: number;
  roomType?: string;
}

// Additional types for better type safety
export interface GuestInfo {
  name: string;
  phone: string;
  email: string;
}

export interface PassportInfo {
  name: string;
  passportNumber: string;
  nationality: string;
  dateOfBirth: string;
  expiryDate: string;
  photo?: string;
}

export interface ReservationSearchResult {
  id: string;
  guestName: string;
  confirmationNumber: string;
  phone: string;
  email: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled';
  totalAmount: number;
  nights: number;
  adults: number;
  children: number;
  specialRequests: string;
}

export interface RoomAvailabilityInfo {
  available: number;
  total: number;
  price: number;
}

export interface DayAvailability {
  date: string;
  rooms: Record<string, RoomAvailabilityInfo>;
}

export interface VoiceProcessedData {
  checkIn?: string | Date;
  checkOut?: string | Date;
  adults?: number;
  children?: number;
  roomType?: string;
  guestName?: string;
  phone?: string;
  email?: string;
  paymentMethod?: string;
  confirmationNumber?: string;
  searchQuery?: string;
  room?: string;
  name?: string;
  language?: string;
}

export interface FormDataWithDayjs {
  checkIn: dayjs.Dayjs | null;
  checkOut: dayjs.Dayjs | null;
  adults: number;
  children: number;
  roomType: string;
  guestName: string;
  phone: string;
  email: string;
  paymentMethod: string;
}

export interface ProcessedVoiceResponse {
  intent: string;
  confidence: number;
  extractedData: VoiceProcessedData;
  shouldFillForm: boolean;
  validationErrors: string[];
  suggestions: string[];
  text: string;
  originalInput?: string;
  chatMessage?: ChatMessage;
  processCompleted?: boolean;
  processType?: 'reservation' | 'checkin' | 'checkout';
  confirmationData?: {
    confirmationNumber?: string;
    roomNumber?: string;
    guestName?: string;
    checkInDate?: string;
    checkOutDate?: string;
    roomType?: string;
    totalAmount?: number;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  extractedData?: VoiceProcessedData;
  formFilled?: boolean;
  language?: string;
  intent?: string;
}

export interface GeminiResponse {
  text: string;
  intent: IntentType;
  confidence: number;
  extractedData: VoiceProcessedData;
  shouldFillForm: boolean;
  validationErrors: string[];
  suggestions: string[];
}

export type IntentType = 
  | 'reservation' 
  | 'checkin' 
  | 'checkout' 
  | 'availability' 
  | 'search_reservation' 
  | 'inquiry' 
  | 'help' 
  | 'error' 
  | 'unknown';

export type ModalType = 'reservation' | 'checkin' | 'checkout' | 'availability';

export interface LanguageConfig {
  code: string;
  name: string;
  flag: string;
  speechCode: string;
  voiceNames: string[];
  greetings: {
    welcome: string;
    reservation: string;
    checkin: string;
    checkout: string;
    roomAvailability: string;
  };
  prompts: {
    dates: string;
    guests: string;
    roomType: string;
    guestInfo: string;
    payment: string;
    confirmation: string;
  };
  responses: {
    dateConfirm: string;
    roomSelected: string;
    infoReceived: string;
    paymentSet: string;
    bookingConfirmed: string;
    error: string;
    help: string;
  };
  processCompletion: {
    reservation: {
      title: string;
      description: string;
      voiceMessage: string;
      fields: {
        confirmationNumber: string;
        guestName: string;
        roomType: string;
        checkInDate: string;
        checkOutDate: string;
        totalAmount: string;
      };
    };
    checkin: {
      title: string;
      description: string;
      voiceMessage: string;
      fields: {
        roomNumber: string;
        guestName: string;
        roomType: string;
        keyCards: string;
      };
    };
    checkout: {
      title: string;
      description: string;
      voiceMessage: string;
      fields: {
        guestName: string;
        roomNumber: string;
        totalAmount: string;
        receipt: string;
      };
    };
  };
}

export interface MultilingualBookingPatterns {
  reservation: Record<string, string[]>;
  checkin: Record<string, string[]>;
  checkout: Record<string, string[]>;
  availability: Record<string, string[]>;
}

// Utility type for converting dayjs to string
export type ConvertDayjsToString<T> = {
  [K in keyof T]: T[K] extends dayjs.Dayjs | null 
    ? string | undefined 
    : T[K];
};