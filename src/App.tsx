import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAppDispatch } from './hooks/useAppDispatch';
import { useAppSelector } from './hooks/useAppSelector';
import { useVoiceRedux } from './hooks/useVoiceRedux';
import { voiceProcessingService } from './services/voiceProcessingService';
import { 
  setCurrentStep,
  setDatesAndGuests,
  setRoomSelection,
  setGuestInfo,
  setPaymentMethod,
  resetReservation
} from './store/slices/reservationSlice';
import { setSelectedLanguage } from './store/slices/voiceSlice';
import { addNotification } from './store/slices/uiSlice';
import { Language } from './types/reservation';
import { getLanguageCode } from './utils/voiceCommands';
import { hotels } from './data/hotels';

import LanguageSelector from './components/LanguageSelector';
import ChatInterface from './components/ChatInterface';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  extractedInfo?: {
    checkIn?: string;
    checkOut?: string;
    adults?: number;
    children?: number;
    roomType?: string;
    guestName?: string;
    phone?: string;
    email?: string;
    paymentMethod?: string;
  };
}

function AppContent() {
  const dispatch = useAppDispatch();
  const { currentStep, data: reservationData } = useAppSelector((state) => state.reservation);
  const { selectedLanguage } = useAppSelector((state) => state.voice);
  const [messages, setMessages] = React.useState<Message[]>([]);
  
  const {
    voiceState,
    isSupported,
    transcript,
    startListening,
    stopListening,
    speak,
    setLanguage
  } = useVoiceRedux();

  // Add initial welcome message
  useEffect(() => {
    if (currentStep === 'welcome' && messages.length === 0) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: 'Welcome to Lagunacreek! I\'m your AI assistant ready to help you book the perfect hotel room. I can help you with reservations, check availability, and answer any questions about our services. How can I assist you today?',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [currentStep, messages.length]);

  // Handle language selection
  const handleLanguageSelect = (language: Language) => {
    dispatch(setSelectedLanguage(language));
    setLanguage(getLanguageCode(language));
    dispatch(setCurrentStep('welcome'));
    
    // Welcome message based on language
    const welcomeMessages = {
      'en': 'Welcome to Lagunacreek. How can I assist you today?',
      'es': 'Bienvenido a Lagunacreek. ¿Cómo puedo ayudarte hoy?',
      'hi': 'लागुनाक्रीक में आपका स्वागत है। आज मैं आपकी कैसे सहायता कर सकता हूं?',
      'en-uk': 'Welcome to Lagunacreek. How may I assist you today?'
    };
    
    setTimeout(() => {
      speak(welcomeMessages[language], getLanguageCode(language));
    }, 1000);
  };

  // Handle voice transcript processing
  useEffect(() => {
    if (transcript && voiceState === 'processing') {
      processVoiceInput(transcript);
    }
  }, [transcript, voiceState]);

  const addMessage = (type: 'user' | 'ai', content: string, extractedInfo?: Message['extractedInfo']) => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random(),
      type,
      content,
      timestamp: new Date(),
      extractedInfo
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = (message: string) => {
    addMessage('user', message);
    processVoiceInput(message);
  };

  const processVoiceInput = (input: string) => {
    // Add user message if it's not already added
    if (voiceState === 'processing') {
      addMessage('user', input);
    }

    const result = voiceProcessingService.processVoiceInput(input, currentStep, reservationData);
    
    // Extract information for display
    const extractedInfo: Message['extractedInfo'] = {};
    if (result.entities) {
      if (result.entities.date) extractedInfo.checkIn = result.entities.date;
      if (result.entities.adults) extractedInfo.adults = result.entities.adults;
      if (result.entities.children) extractedInfo.children = result.entities.children;
      if (result.entities.room_type) extractedInfo.roomType = result.entities.room_type;
      if (result.entities.name) extractedInfo.guestName = result.entities.name;
      if (result.entities.phone) extractedInfo.phone = result.entities.phone;
      if (result.entities.email) extractedInfo.email = result.entities.email;
      if (result.entities.payment_type) extractedInfo.paymentMethod = result.entities.payment_type;
    }

    // Add AI response message
    addMessage('ai', result.response, Object.keys(extractedInfo).length > 0 ? extractedInfo : undefined);
    
    // Speak the response with delay
    setTimeout(() => {
      speak(result.response);
    }, 500);
    
    // Handle actions
    if (result.action) {
      switch (result.action.type) {
        case 'SET_STEP':
          dispatch(setCurrentStep(result.action.payload));
          break;
        case 'UPDATE_DATES_GUESTS':
          dispatch(setDatesAndGuests(result.action.payload));
          break;
        case 'SET_ROOM':
          dispatch(setRoomSelection(result.action.payload));
          break;
        case 'UPDATE_GUEST_INFO':
          dispatch(setGuestInfo(result.action.payload));
          break;
        case 'SET_PAYMENT':
          dispatch(setPaymentMethod(result.action.payload));
          break;
        case 'CONFIRM_BOOKING':
          dispatch(addNotification({
            message: 'Booking confirmed successfully!',
            type: 'success'
          }));
          addMessage('ai', '🎉 Congratulations! Your booking has been confirmed. You will receive a confirmation email shortly. Thank you for choosing Lagunacreek!');
          setTimeout(() => {
            dispatch(resetReservation());
            setMessages([]);
          }, 3000);
          break;
      }
    }
  };

  const handleResetReservation = () => {
    dispatch(resetReservation());
    setMessages([]);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'language':
        return <LanguageSelector onLanguageSelect={handleLanguageSelect} />;
      
      case 'welcome':
      case 'dates-guests':
      case 'room-selection':
      case 'guest-info':
      case 'payment':
      case 'confirmation':
        return (
          <ChatInterface
            messages={messages}
            voiceState={voiceState}
            isSupported={isSupported}
            onStartListening={startListening}
            onStopListening={stopListening}
            onSendMessage={handleSendMessage}
            transcript={transcript}
          />
        );
      
      default:
        return <LanguageSelector onLanguageSelect={handleLanguageSelect} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderCurrentStep()}
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;