import { configureStore } from '@reduxjs/toolkit';
import { geminiApi } from './api/geminiApi';
import reservationReducer from './slices/reservationSlice';
import voiceReducer from './slices/voiceSlice';
import uiReducer from './slices/uiSlice';
import mockDataReducer from './slices/mockDataSlice';
import otaApiSlice from './slices/otaApiSlice';
import { otaReservationApi } from './api/otaReservationApi';

export const store = configureStore({
  reducer: {
    [geminiApi.reducerPath]: geminiApi.reducer,
    [otaReservationApi.reducerPath]: otaReservationApi.reducer,
    reservation: reservationReducer,
    voice: voiceReducer,
    ui: uiReducer,
    mockData: mockDataReducer,
    ota: otaApiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'voice/setRecognition', 
          'persist/PERSIST',
          'geminiApi/executeMutation/pending',
          'geminiApi/executeMutation/fulfilled'
        ],
        ignoredPaths: [
          'voice.recognition', 
          'register',
          'geminiApi.mutations'
        ],
      },
    }).concat(geminiApi.middleware, otaReservationApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;