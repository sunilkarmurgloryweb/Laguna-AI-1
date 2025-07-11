import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAppDispatch } from './hooks/useAppDispatch';
import { useAppSelector } from './hooks/useAppSelector';
import { useVoiceRedux } from './hooks/useVoiceRedux';
import { enhancedVoiceProcessingService } from './services/enhancedVoiceProcessingService';
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
import WelcomeScreen from './components/WelcomeScreen';
import ReservationFlow from './components/ReservationFlow';
import ConfirmationScreen from './components/ConfirmationScreen';

function AppContent() {
  const dispatch = useAppDispatch();
  const { currentStep, data: reservationData } = useAppSelector((state) => state.reservation);
  const { selectedLanguage } = useAppSelector((state) => state.voice);
  
  const {
    voiceState,
    isSupported,
    transcript,
    startListening,
    stopListening,
    speak,
    setLanguage
  } = useVoiceRedux();

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
    if (transcript && voiceState === 'processing' && transcript.trim()) {
      processVoiceInputAsync(transcript);
    }
  }, [transcript, voiceState]);

  const processVoiceInputAsync = async (input: string) => {
    try {
      const result = await enhancedVoiceProcessingService.processVoiceInput(input, currentStep, reservationData);
      
      // Speak the response
      speak(result.response);
      
      // Handle actions
      if (result.action) {
        handleVoiceAction(result.action);
      }
    } catch (error) {
      console.error('Voice processing error:', error);
      speak("I'm sorry, I'm having trouble processing that. Could you please try again?");
    }
  };

  const handleVoiceAction = (action: any) => {
    switch (action.type) {
      case 'SET_STEP':
        dispatch(setCurrentStep(action.payload));
        break;
      case 'UPDATE_DATES_GUESTS':
        dispatch(setDatesAndGuests(action.payload));
        break;
      case 'SET_ROOM':
        dispatch(setRoomSelection(action.payload));
        break;
      case 'UPDATE_GUEST_INFO':
        dispatch(setGuestInfo(action.payload));
        break;
      case 'SET_PAYMENT':
        dispatch(setPaymentMethod(action.payload));
        break;
      case 'CONFIRM_BOOKING':
        dispatch(addNotification({
          message: 'Booking confirmed successfully!',
          type: 'success'
        }));
        setTimeout(() => {
          dispatch(resetReservation());
        }, 3000);
        break;
    }
  };

  // Handle help requests
  const handleHelpRequest = async () => {
    try {
      const helpText = await enhancedVoiceProcessingService.getStepHelp(currentStep, reservationData);
      speak(helpText);
    } catch (error) {
      speak("I'm here to help you with your reservation. Please let me know what you need assistance with.");
    }
  };

  // Enhanced voice processing with AI
  const processVoiceInput = async (input: string) => {
    // Check for help requests
    if (input.toLowerCase().includes('help')) {
      await handleHelpRequest();
      return;
    }
    
    const result = await enhancedVoiceProcessingService.processVoiceInput(input, currentStep, reservationData);
    
    // Speak the AI-generated response
    speak(result.response);
    
    // Handle actions
    if (result.action) {
      handleVoiceAction(result.action);
    }

    // Handle "next" command
    if (input.toLowerCase().includes('next')) {
      handleNext();
    }
  };

  const handleNext = () => {
    switch (currentStep) {
      case 'dates-guests':
        if (reservationData.checkIn && reservationData.adults > 0) {
          dispatch(setCurrentStep('room-selection'));
          speak("Now let's choose your room. Please say the room type you'd like to book.");
        } else {
          speak("Please provide your check-in date and number of adults first.");
        }
        break;
      case 'room-selection':
        if (reservationData.roomType) {
          dispatch(setCurrentStep('guest-info'));
          speak("Please tell me your full name, contact number, and email address.");
        } else {
          speak("Please select a room type first.");
        }
        break;
      case 'guest-info':
        if (reservationData.guestName) {
          dispatch(setCurrentStep('payment'));
          speak("Please choose your payment method: Credit Card, Pay at Hotel, or UPI.");
        } else {
          speak("Please provide your name first.");
        }
        break;
      case 'payment':
        if (reservationData.paymentMethod) {
          dispatch(setCurrentStep('confirmation'));
          speak("Here is your reservation summary. Please review and say 'Yes, confirm the booking' to proceed.");
        } else {
          speak("Please select a payment method first.");
        }
        break;
    }
  };

  const handleResetReservation = () => {
    dispatch(resetReservation());
    speak("Starting a new reservation. Please select your language to continue.");
  };

  const handleEmergencyReset = () => {
    dispatch(resetReservation());
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'language':
        return <LanguageSelector onLanguageSelect={handleLanguageSelect} />;
      
      case 'welcome':
        return (
          <WelcomeScreen
            hotels={hotels}
            voiceState={voiceState}
            isSupported={isSupported}
            onStartListening={startListening}
            onStopListening={stopListening}
          />
        );
      
      case 'dates-guests':
      case 'room-selection':
      case 'guest-info':
      case 'payment':
        return (
          <ReservationFlow
            step={currentStep}
            reservationData={reservationData}
            voiceState={voiceState}
            isSupported={isSupported}
            onStartListening={startListening}
            onStopListening={stopListening}
            onNext={handleNext}
            onHelp={handleHelpRequest}
            onReset={handleEmergencyReset}
            transcript={transcript}
          />
        );
      
      case 'confirmation':
        return (
          <ConfirmationScreen
            reservationData={reservationData}
            onNewReservation={handleResetReservation}
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