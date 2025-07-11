import { useEffect, useCallback } from 'react';
import { useAppDispatch } from './useAppDispatch';
import { useAppSelector } from './useAppSelector';
import { multilingualAI } from '../services/multilingualAIService';
import {
  setVoiceState,
  setIsSupported,
  setTranscript,
  setLastError,
  clearError,
  setRecognition,
} from '../store/slices/voiceSlice';

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
      recognitionInstance.lang = multilingualAI.getSpeechRecognitionLanguage();
      
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
      
      multilingualAI.speak(text, lang).then(() => {
        dispatch(setVoiceState('idle'));
      }).catch((error) => {
        console.error('Speech error:', error);
        dispatch(setVoiceState('idle'));
      });
    }
  }, [dispatch]);

  const setLanguage = useCallback((lang: string) => {
    multilingualAI.setLanguage(lang);
    if (recognition) {
      recognition.lang = multilingualAI.getSpeechRecognitionLanguage();
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