import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ReservationData } from '../../types/reservation';

export interface MockReservation extends ReservationData {
  id: string;
  confirmationNumber: string;
  status: 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
  createdAt: string;
  totalAmount: number;
  nights: number;
}

export interface MockCheckIn {
  id: string;
  reservationId: string;
  guestName: string;
  roomNumber: string;
  checkInTime: string;
  keyCards: number;
  status: 'active' | 'completed';
}

export interface MockCheckOut {
  id: string;
  reservationId: string;
  guestName: string;
  roomNumber: string;
  checkOutTime: string;
  totalAmount: number;
  status: 'pending' | 'completed';
}

interface MockDataState {
  reservations: MockReservation[];
  checkIns: MockCheckIn[];
  checkOuts: MockCheckOut[];
  roomAvailability: Record<string, {
    available: number;
    total: number;
    occupied: number;
    maintenance: number;
  }>;
}

const generateConfirmationNumber = () => {
  return 'LG' + Math.random().toString(36).substr(2, 8).toUpperCase();
};

const calculateNights = (checkIn: string, checkOut: string): number => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

const calculateTotalAmount = (roomPrice: number, nights: number): number => {
  return roomPrice * nights;
};

const initialState: MockDataState = {
  reservations: [
    {
      id: '1',
      confirmationNumber: 'LG12345678',
      checkIn: '2024-01-20',
      checkOut: '2024-01-23',
      adults: 2,
      children: 1,
      roomType: 'Ocean View King Suite',
      roomPrice: 299,
      guestName: 'John Smith',
      phone: '+1-555-0123',
      email: 'john.smith@email.com',
      paymentMethod: 'Credit Card',
      hotel: 'Laguna Creek Downtown',
      status: 'confirmed',
      createdAt: '2024-01-15T10:00:00Z',
      totalAmount: 897,
      nights: 3
    },
    {
      id: '2',
      confirmationNumber: 'LG87654321',
      checkIn: '2024-01-25',
      checkOut: '2024-01-27',
      adults: 1,
      children: 0,
      roomType: 'Deluxe Garden Room',
      roomPrice: 199,
      guestName: 'Sarah Johnson',
      phone: '+1-555-0456',
      email: 'sarah.johnson@email.com',
      paymentMethod: 'Pay at Hotel',
      hotel: 'Laguna Creek Seaside Resort',
      status: 'confirmed',
      createdAt: '2024-01-16T14:30:00Z',
      totalAmount: 398,
      nights: 2
    }
  ],
  checkIns: [],
  checkOuts: [],
  roomAvailability: {
    'Ocean View King Suite': { available: 8, total: 12, occupied: 3, maintenance: 1 },
    'Deluxe Garden Room': { available: 15, total: 20, occupied: 4, maintenance: 1 },
    'Family Oceanfront Suite': { available: 6, total: 8, occupied: 2, maintenance: 0 },
    'Presidential Suite': { available: 1, total: 2, occupied: 1, maintenance: 0 },
    'Standard Double Room': { available: 25, total: 30, occupied: 4, maintenance: 1 },
    'Luxury Spa Suite': { available: 3, total: 5, occupied: 2, maintenance: 0 }
  }
};

const mockDataSlice = createSlice({
  name: 'mockData',
  initialState,
  reducers: {
    addReservation: (state, action: PayloadAction<Omit<ReservationData, 'roomPrice'>>) => {
      const roomPrices: Record<string, number> = {
        'Ocean View King Suite': 299,
        'Deluxe Garden Room': 199,
        'Family Oceanfront Suite': 399,
        'Presidential Suite': 599,
        'Standard Double Room': 149,
        'Luxury Spa Suite': 449
      };

      const roomPrice = roomPrices[action.payload.roomType] || 199;
      const nights = calculateNights(action.payload.checkIn, action.payload.checkOut);
      const totalAmount = calculateTotalAmount(roomPrice, nights);

      const newReservation: MockReservation = {
        ...action.payload,
        id: Date.now().toString(),
        confirmationNumber: generateConfirmationNumber(),
        roomPrice,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        totalAmount,
        nights
      };

      state.reservations.push(newReservation);
      
      // Update room availability
      if (state.roomAvailability[action.payload.roomType]) {
        state.roomAvailability[action.payload.roomType].available -= 1;
        state.roomAvailability[action.payload.roomType].occupied += 1;
      }
    },

    updateReservationStatus: (state, action: PayloadAction<{ id: string; status: MockReservation['status'] }>) => {
      const reservation = state.reservations.find(r => r.id === action.payload.id);
      if (reservation) {
        reservation.status = action.payload.status;
      }
    },

    addCheckIn: (state, action: PayloadAction<{
      reservationId: string;
      roomNumber: string;
      keyCards: number;
    }>) => {
      const reservation = state.reservations.find(r => r.id === action.payload.reservationId);
      if (reservation) {
        const checkIn: MockCheckIn = {
          id: Date.now().toString(),
          reservationId: action.payload.reservationId,
          guestName: reservation.guestName,
          roomNumber: action.payload.roomNumber,
          checkInTime: new Date().toISOString(),
          keyCards: action.payload.keyCards,
          status: 'active'
        };
        
        state.checkIns.push(checkIn);
        reservation.status = 'checked-in';
      }
    },

    addCheckOut: (state, action: PayloadAction<{
      reservationId: string;
      roomNumber: string;
      totalAmount: number;
    }>) => {
      const reservation = state.reservations.find(r => r.id === action.payload.reservationId);
      const checkIn = state.checkIns.find(c => c.reservationId === action.payload.reservationId);
      
      if (reservation && checkIn) {
        const checkOut: MockCheckOut = {
          id: Date.now().toString(),
          reservationId: action.payload.reservationId,
          guestName: reservation.guestName,
          roomNumber: action.payload.roomNumber,
          checkOutTime: new Date().toISOString(),
          totalAmount: action.payload.totalAmount,
          status: 'completed'
        };
        
        state.checkOuts.push(checkOut);
        reservation.status = 'checked-out';
        checkIn.status = 'completed';
        
        // Update room availability
        if (state.roomAvailability[reservation.roomType]) {
          state.roomAvailability[reservation.roomType].available += 1;
          state.roomAvailability[reservation.roomType].occupied -= 1;
        }
      }
    },

    searchReservations: (state, action: PayloadAction<string>) => {
      // This is handled by a selector, but we can add search history if needed
    },

    updateRoomAvailability: (state, action: PayloadAction<{
      roomType: string;
      available: number;
      occupied: number;
      maintenance: number;
    }>) => {
      if (state.roomAvailability[action.payload.roomType]) {
        state.roomAvailability[action.payload.roomType] = {
          ...state.roomAvailability[action.payload.roomType],
          available: action.payload.available,
          occupied: action.payload.occupied,
          maintenance: action.payload.maintenance
        };
      }
    }
  }
});

export const {
  addReservation,
  updateReservationStatus,
  addCheckIn,
  addCheckOut,
  searchReservations,
  updateRoomAvailability
} = mockDataSlice.actions;

// Selectors
export const selectAllReservations = (state: { mockData: MockDataState }) => state.mockData.reservations;
export const selectReservationById = (state: { mockData: MockDataState }, id: string) => 
  state.mockData.reservations.find(r => r.id === id);
export const selectReservationByConfirmation = (state: { mockData: MockDataState }, confirmationNumber: string) => 
  state.mockData.reservations.find(r => r.confirmationNumber === confirmationNumber);
export const selectReservationsByGuest = (state: { mockData: MockDataState }, guestName: string) => 
  state.mockData.reservations.filter(r => 
    r.guestName.toLowerCase().includes(guestName.toLowerCase())
  );
export const selectReservationsByPhone = (state: { mockData: MockDataState }, phone: string) => 
  state.mockData.reservations.filter(r => r.phone.includes(phone));
export const selectAllCheckIns = (state: { mockData: MockDataState }) => state.mockData.checkIns;
export const selectAllCheckOuts = (state: { mockData: MockDataState }) => state.mockData.checkOuts;
export const selectRoomAvailability = (state: { mockData: MockDataState }) => state.mockData.roomAvailability;

export default mockDataSlice.reducer;