import { useState, useEffect, useCallback, useRef } from 'react';

export interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  finalTranscript: string;
  isSupported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export const useSpeechRecognition = (
  language: string = 'en-US',
  continuous: boolean = true,
  interimResults: boolean = true,
  noSpeechTimeout: number = 10000 // 10 seconds timeout
): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [finalTranscript, setFinalTranscript] = useState<string>('');
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = language;
      recognition.maxAlternatives = 3;
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };
      
      // Clear any existing timeout when recognition starts
      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        setInterimTranscript(interimTranscript);
        setFinalTranscript(prev => {
          const newFinalTranscript = prev + finalTranscript;
          setTranscript(newFinalTranscript + interimTranscript);
          return newFinalTranscript;
        });
        
        // Reset timeout on speech detection
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
      
      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setError(event.error);
        setIsListening(false);
        console.error('Speech recognition error:', event.error);
      };
      
      // Handle no speech timeout
      recognition.onnomatch = () => {
      };
      
      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        recognitionRef.current.abort();
      }
    };
  }, [language, continuous, interimResults]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening && isSupported) {
      setError(null);
      
      // Set up no-speech timeout
      timeoutRef.current = setTimeout(() => {
        if (recognitionRef.current && isListening) {
          recognitionRef.current.stop();
          setError('No speech detected. Click to try again.');
        }
      }, noSpeechTimeout);
      
      recognitionRef.current.start();
    }
  }, [isListening, isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setFinalTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    finalTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
};