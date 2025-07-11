import { configureStore } from '@reduxjs/toolkit';
import reservationReducer from './slices/reservationSlice';
import voiceReducer from './slices/voiceSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    reservation: reservationReducer,
    voice: voiceReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['voice/setRecognition'],
        ignoredPaths: ['voice.recognition'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;