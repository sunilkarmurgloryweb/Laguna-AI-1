import { Hotel, RoomType } from '../types/reservation';

export const hotels: Hotel[] = [
  {
    id: 'downtown',
    name: 'Laguna Creek Downtown',
    description: 'Modern luxury in the heart of the city',
    address: '123 Downtown Plaza, City Center',
    rating: 4.8
  },
  {
    id: 'seaside',
    name: 'Laguna Creek Seaside Resort',
    description: 'Oceanfront paradise with pristine beaches',
    address: '456 Ocean Drive, Beachfront',
    rating: 4.9
  },
  {
    id: 'airport',
    name: 'Laguna Creek Airport Hotel',
    description: 'Convenient comfort for travelers',
    address: '789 Airport Boulevard, Terminal Area',
    rating: 4.6
  }
];

export const roomTypes: RoomType[] = [
  {
    id: 'deluxe-king',
    name: 'Deluxe King Room',
    price: 120,
    description: 'Spacious room with king bed and city views',
    amenities: ['King Bed', 'City View', 'Free WiFi', 'Mini Bar', 'Work Desk'],
    maxOccupancy: 2,
    available: 8
  },
  {
    id: 'family-suite',
    name: 'Family Suite',
    price: 180,
    description: 'Large suite perfect for families with separate living area',
    amenities: ['2 Queen Beds', 'Living Area', 'Kitchenette', 'Balcony', 'Free WiFi'],
    maxOccupancy: 6,
    available: 4
  },
  {
    id: 'ocean-view',
    name: 'Ocean View Room',
    price: 150,
    description: 'Breathtaking ocean views from your private balcony',
    amenities: ['Queen Bed', 'Ocean View', 'Private Balcony', 'Free WiFi', 'Mini Fridge'],
    maxOccupancy: 2,
    available: 12
  }
];

export const paymentMethods = [
  { id: 'credit-card', name: 'Credit Card', icon: 'CreditCard' },
  { id: 'pay-at-hotel', name: 'Pay at Hotel', icon: 'Hotel' },
  { id: 'upi', name: 'UPI or Digital Wallet', icon: 'AccountBalance' }
];