import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from './api/baseApi';
import { geminiApi } from './api/geminiApi';
import reservationReducer from './slices/reservationSlice';
import voiceReducer from './slices/voiceSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    reservation: reservationReducer,
    voice: voiceReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['voice/setRecognition', 'persist/PERSIST'],
        ignoredPaths: ['voice.recognition', 'register'],
      },
    }).concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;