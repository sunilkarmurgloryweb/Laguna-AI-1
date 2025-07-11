import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { VoiceState, Language } from '../../types/reservation';

interface VoiceSliceState {
  voiceState: VoiceState;
  isSupported: boolean;
  transcript: string;
  lastError: string;
  selectedLanguage: Language;
  recognition: SpeechRecognition | null;
}

const initialState: VoiceSliceState = {
  voiceState: 'idle',
  isSupported: false,
  transcript: '',
  lastError: '',
  selectedLanguage: 'en',
  recognition: null,
};

const voiceSlice = createSlice({
  name: 'voice',
  initialState,
  reducers: {
    setVoiceState: (state, action: PayloadAction<VoiceState>) => {
      state.voiceState = action.payload;
    },
    setIsSupported: (state, action: PayloadAction<boolean>) => {
      state.isSupported = action.payload;
    },
    setTranscript: (state, action: PayloadAction<string>) => {
      state.transcript = action.payload;
    },
    setLastError: (state, action: PayloadAction<string>) => {
      state.lastError = action.payload;
    },
    clearError: (state) => {
      state.lastError = '';
    },
    setSelectedLanguage: (state, action: PayloadAction<Language>) => {
      state.selectedLanguage = action.payload;
    },
    setRecognition: (state, action: PayloadAction<SpeechRecognition | null>) => {
      state.recognition = action.payload;
    },
  },
});

export const {
  setVoiceState,
  setIsSupported,
  setTranscript,
  setLastError,
  clearError,
  setSelectedLanguage,
  setRecognition,
} = voiceSlice.actions;

export default voiceSlice.reducer;