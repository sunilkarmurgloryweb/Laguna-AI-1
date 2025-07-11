import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ReservationData, ReservationStep } from '../../types/reservation';

interface ReservationState {
  currentStep: ReservationStep;
  data: ReservationData;
  isLoading: boolean;
  error: string | null;
}

const initialState: ReservationState = {
  currentStep: 'language',
  data: {
    checkIn: '',
    checkOut: '',
    adults: 0,
    children: 0,
    roomType: '',
    roomPrice: 0,
    guestName: '',
    phone: '',
    email: '',
    paymentMethod: '',
    hotel: 'Laguna Creek Downtown'
  },
  isLoading: false,
  error: null,
};

const reservationSlice = createSlice({
  name: 'reservation',
  initialState,
  reducers: {
    setCurrentStep: (state, action: PayloadAction<ReservationStep>) => {
      state.currentStep = action.payload;
    },
    updateReservationData: (state, action: PayloadAction<Partial<ReservationData>>) => {
      state.data = { ...state.data, ...action.payload };
    },
    setDatesAndGuests: (state, action: PayloadAction<{
      checkIn?: string;
      checkOut?: string;
      adults?: number;
      children?: number;
    }>) => {
      const { checkIn, checkOut, adults, children } = action.payload;
      if (checkIn) state.data.checkIn = checkIn;
      if (checkOut) state.data.checkOut = checkOut;
      if (adults !== undefined) state.data.adults = adults;
      if (children !== undefined) state.data.children = children;
    },
    setRoomSelection: (state, action: PayloadAction<{ roomType: string; roomPrice: number }>) => {
      state.data.roomType = action.payload.roomType;
      state.data.roomPrice = action.payload.roomPrice;
    },
    setGuestInfo: (state, action: PayloadAction<{
      guestName?: string;
      phone?: string;
      email?: string;
    }>) => {
      const { guestName, phone, email } = action.payload;
      if (guestName) state.data.guestName = guestName;
      if (phone) state.data.phone = phone;
      if (email) state.data.email = email;
    },
    setPaymentMethod: (state, action: PayloadAction<string>) => {
      state.data.paymentMethod = action.payload;
    },
    resetReservation: (state) => {
      state.currentStep = 'language';
      state.data = initialState.data;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setCurrentStep,
  updateReservationData,
  setDatesAndGuests,
  setRoomSelection,
  setGuestInfo,
  setPaymentMethod,
  resetReservation,
  setLoading,
  setError,
} = reservationSlice.actions;

export default reservationSlice.reducer;