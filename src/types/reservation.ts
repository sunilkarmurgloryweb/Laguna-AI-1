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