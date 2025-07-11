import { useState, useEffect, useCallback } from 'react';
import { VoiceState } from '../types/reservation';

export const useVoice = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastError, setLastError] = useState<string>('');
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setVoiceState('listening');
        setLastError(''); // Clear any previous errors
      };
      
      recognition.onresult = (event) => {
        const result = event.results[0][0].transcript;
        setTranscript(result);
        setVoiceState('processing');
        setLastError(''); // Clear errors on successful recognition
      };
      
      recognition.onend = () => {
        setVoiceState('idle');
      };
      
      recognition.onerror = (event) => {
        const errorMessage = event.error === 'no-speech' 
          ? 'No speech detected. Please try speaking again.'
          : `Speech recognition error: ${event.error}`;
        setLastError(errorMessage);
        setVoiceState('idle');
      };
      
      setRecognition(recognition);
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognition && voiceState === 'idle') {
      setLastError(''); // Clear errors when starting new session
      recognition.start();
    }
  }, [recognition, voiceState]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
    }
  }, [recognition]);

  const speak = useCallback((text: string, lang: string = 'en-US') => {
    if ('speechSynthesis' in window) {
      setVoiceState('speaking');
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onend = () => {
        setVoiceState('idle');
      };
      
      speechSynthesis.speak(utterance);
    }
  }, []);

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