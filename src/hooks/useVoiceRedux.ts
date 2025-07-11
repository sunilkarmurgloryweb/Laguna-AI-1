import { useEffect, useCallback } from 'react';
import { useAppDispatch } from './useAppDispatch';
import { useAppSelector } from './useAppSelector';
import {
  setVoiceState,
  setIsSupported,
  setTranscript,
  setLastError,
  clearError,
  setRecognition,
} from '../store/slices/voiceSlice';
import { getLanguageCode } from '../utils/voiceCommands';

export const useVoiceRedux = () => {
  const dispatch = useAppDispatch();
  const { voiceState, isSupported, transcript, lastError, selectedLanguage, recognition } = useAppSelector(
    (state) => state.voice
  );

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      dispatch(setIsSupported(true));
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = getLanguageCode(selectedLanguage);
      
      recognitionInstance.onstart = () => {
        dispatch(setVoiceState('listening'));
        dispatch(clearError());
      };
      
      recognitionInstance.onresult = (event) => {
        const result = event.results[0][0].transcript;
        dispatch(setTranscript(result));
        dispatch(setVoiceState('processing'));
        dispatch(clearError());
      };
      
      recognitionInstance.onend = () => {
        dispatch(setVoiceState('idle'));
      };
      
      recognitionInstance.onerror = (event) => {
        const errorMessage = event.error === 'no-speech' 
          ? 'No speech detected. Please try speaking again.'
          : `Speech recognition error: ${event.error}`;
        dispatch(setLastError(errorMessage));
        dispatch(setVoiceState('idle'));
      };
      
      dispatch(setRecognition(recognitionInstance));
    }
  }, [dispatch, selectedLanguage]);

  const startListening = useCallback(() => {
    if (recognition && voiceState === 'idle') {
      dispatch(clearError());
      recognition.start();
    }
  }, [recognition, voiceState, dispatch]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
    }
  }, [recognition]);

  const speak = useCallback((text: string, lang?: string) => {
    if ('speechSynthesis' in window) {
      dispatch(setVoiceState('speaking'));
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang || getLanguageCode(selectedLanguage);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onend = () => {
        dispatch(setVoiceState('idle'));
      };
      
      speechSynthesis.speak(utterance);
    }
  }, [dispatch, selectedLanguage]);

  const setLanguage = useCallback((lang: string) => {
    if (recognition) {
      recognition.lang = lang;
    }
  }, [recognition]);

  return {
    voiceState,
    isSupported,
    transcript,
    lastError,
    startListening,
    stopListening,
    speak,
    setLanguage
  };
};