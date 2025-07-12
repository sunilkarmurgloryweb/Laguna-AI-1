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
  searchQuery?: string;
}

export interface ProcessedVoiceResponse {
  intent: string;
  confidence: number;
  extractedData: VoiceProcessedData;
  shouldFillForm: boolean;
  validationErrors: string[];
  suggestions: string[];
  text: string;
}