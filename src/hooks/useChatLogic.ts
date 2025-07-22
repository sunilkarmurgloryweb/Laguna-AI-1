import { useState, useEffect, useCallback } from 'react';
import { useSendMessageMutation } from '../store/api/geminiApi';
import { useAppDispatch, useAppSelector } from '../hooks';
import { addReservation, selectAllReservations, selectReservationsByGuest, selectReservationsByPhone, selectReservationByConfirmation } from '../store/slices/mockDataSlice';
import { multilingualAI } from '../services/multilingualAIService';
import { getDefaultCheckInDate, getDefaultCheckOutDate, getCurrentMonthYear } from '../utils/dateUtils';
import {
  ChatMessage,
  ModalType,
  IntentType,
  VoiceProcessedData
} from '../types/reservation';

type Message = ChatMessage & {
  isUser: boolean;
  text: string;
};

interface UseChatLogicProps {
  context: string;
  currentLanguage: string;
  isSpeechEnabled: boolean;
  onOpenModal?: (modalType: ModalType, data?: VoiceProcessedData) => void;
}

export const useChatLogic = ({
  context,
  currentLanguage,
  isSpeechEnabled,
  onOpenModal
}: UseChatLogicProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [showReservationPreview, setShowReservationPreview] = useState(false);
  const [previewReservationData, setPreviewReservationData] = useState<any>(null);

  const [sendMessage, { isLoading: isProcessing }] = useSendMessageMutation();
  const dispatch = useAppDispatch();
  const allReservations = useAppSelector(selectAllReservations);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: '1',
      role: 'assistant' as const,
      content: multilingualAI.getGreeting('welcome'),
      text: multilingualAI.getGreeting('welcome'),
      timestamp: new Date(),
      language: currentLanguage,
      isUser: false,
    };
    setMessages([welcomeMessage]);
  }, [currentLanguage]);

  // Handle reservation search
  const handleReservationSearch = useCallback((extractedData: VoiceProcessedData) => {
    let foundReservations: any[] = [];

    if (extractedData.confirmationNumber) {
      const reservation = selectReservationByConfirmation({ mockData: { reservations: allReservations, checkIns: [], checkOuts: [], roomAvailability: {} } }, extractedData.confirmationNumber);
      if (reservation) foundReservations = [reservation];
    } else if (extractedData.guestName) {
      foundReservations = selectReservationsByGuest({ mockData: { reservations: allReservations, checkIns: [], checkOuts: [], roomAvailability: {} } }, extractedData.guestName);
    } else if (extractedData.phone) {
      foundReservations = selectReservationsByPhone({ mockData: { reservations: allReservations, checkIns: [], checkOuts: [], roomAvailability: {} } }, extractedData.phone);
    }

    let responseText = '';
    if (foundReservations.length > 0) {
      const reservation = foundReservations[0];
      responseText = `Found reservation for ${reservation.guestName}. Confirmation: ${reservation.confirmationNumber}, Room: ${reservation.roomType}, Check-in: ${reservation.checkIn}, Status: ${reservation.status}`;
    } else {
      responseText = 'No reservations found with the provided information. Please check your confirmation number or contact details.';
    }

    const searchMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant' as const,
      content: responseText,
      text: responseText,
      timestamp: new Date(),
      language: currentLanguage,
      isUser: false,
    };

    setMessages(prev => [...prev, searchMessage]);
    return responseText;
  }, [allReservations, currentLanguage]);

  // Detect intent and open appropriate modal
  const detectIntentAndOpenModal = useCallback((intent: IntentType, extractedData: VoiceProcessedData, language: string) => {
    if (!onOpenModal) return;

    console.log('🎯 Intent detected:', intent, 'Data:', extractedData);

    // Handle reservation search
    if (intent === 'search_reservation') {
      handleReservationSearch(extractedData);
      return;
    }

    const modalMappings: Record<IntentType, ModalType | null> = {
      'reservation': 'reservation',
      'checkin': 'checkin',
      'checkout': 'checkout',
      'availability': 'availability',
      'search_reservation': null,
      'inquiry': null,
      'help': null,
      'error': null,
      'unknown': null
    };

    const modalType = modalMappings[intent];
    if (modalType) {
      const dataWithLanguage: VoiceProcessedData = {
        ...extractedData,
      };

      const modalMessages: Record<ModalType, string> = {
        'reservation': 'Opening reservation form...',
        'checkin': 'Opening check-in process...',
        'checkout': 'Opening check-out process...',
        'availability': 'Opening room availability calendar...'
      };

      const modalMessage: Message = {
        id: Date.now().toString() + '_modal',
        role: 'assistant' as const,
        content: modalMessages[modalType] || 'Opening requested service...',
        text: modalMessages[modalType] || 'Opening requested service...',
        timestamp: new Date(),
        language: language,
        isUser: false,
      };

      setMessages(prev => [...prev, modalMessage]);
      onOpenModal(modalType, dataWithLanguage);
    }
  }, [onOpenModal, handleReservationSearch]);

  // Enhanced date processing with current month/year defaults
  const processDateWithDefaults = useCallback((extractedData: VoiceProcessedData) => {
    const processedData = { ...extractedData };

    if (!processedData.checkIn) {
      processedData.checkIn = getDefaultCheckInDate();
    }

    if (!processedData.checkOut) {
      processedData.checkOut = getDefaultCheckOutDate();
    }

    return processedData;
  }, []);

  // Get room price helper
  const getRoomPrice = useCallback((roomType: string): number => {
    const roomPrices: Record<string, number> = {
      'Ocean View King Suite': 299,
      'Deluxe Garden Room': 199,
      'Family Oceanfront Suite': 399,
      'Presidential Suite': 599,
      'Standard Double Room': 149,
      'Luxury Spa Suite': 449
    };
    return roomPrices[roomType] || 199;
  }, []);

  // Handle reservation preview and confirmation
  const handleReservationIntent = useCallback((extractedData: VoiceProcessedData, responseText: string) => {
    const processedData = processDateWithDefaults(extractedData);

    const hasMinimumData = processedData.checkIn && processedData.checkOut &&
      processedData.adults && processedData.roomType &&
      processedData.guestName && processedData.phone &&
      processedData.email && processedData.paymentMethod;

    if (hasMinimumData) {
      const reservationData = {
        checkIn: processedData.checkIn as string,
        checkOut: processedData.checkOut as string,
        adults: processedData.adults as number,
        children: processedData.children || 0,
        roomType: processedData.roomType as string,
        roomPrice: getRoomPrice(processedData.roomType as string),
        guestName: processedData.guestName as string,
        phone: processedData.phone as string,
        email: processedData.email as string,
        paymentMethod: processedData.paymentMethod as string,
        hotel: 'Laguna Creek Downtown'
      };

      setPreviewReservationData(reservationData);
      setShowReservationPreview(true);

      const previewMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant' as const,
        content: 'I have all the information needed for your reservation. Please review the details and confirm.',
        text: 'I have all the information needed for your reservation. Please review the details and confirm.',
        timestamp: new Date(),
        language: currentLanguage,
        isUser: false,
      };

      setMessages(prev => [...prev, previewMessage]);
    } else {
      detectIntentAndOpenModal('reservation', processedData, currentLanguage);
    }
  }, [processDateWithDefaults, getRoomPrice, currentLanguage, detectIntentAndOpenModal]);

  // Generate confirmation number
  const generateConfirmationNumber = useCallback(() => {
    return 'LG' + Math.random().toString(36).substr(2, 8).toUpperCase();
  }, []);

  // Confirm reservation from preview
  const handleConfirmReservation = useCallback(() => {
    if (previewReservationData) {
      dispatch(addReservation(previewReservationData));

      const confirmationMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant' as const,
        content: `Reservation confirmed! Your confirmation number is ${generateConfirmationNumber()}. You will receive an email confirmation shortly.`,
        text: `Reservation confirmed! Your confirmation number is ${generateConfirmationNumber()}. You will receive an email confirmation shortly.`,
        timestamp: new Date(),
        language: currentLanguage,
        isUser: false,
      };

      setMessages(prev => [...prev, confirmationMessage]);
      setShowReservationPreview(false);
      setPreviewReservationData(null);
    }
  }, [previewReservationData, dispatch, generateConfirmationNumber, currentLanguage]);

  // Enhanced message processing with language detection
  const handleSendMessage = useCallback(async (text: string, detectedLang?: string) => {
    if (!text.trim() || isProcessing) return;

    const messageLang = detectedLang || currentLanguage;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: text,
      text: text,
      timestamp: new Date(),
      language: messageLang,
      isUser: true,
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Send to Gemini AI with language context
      const result = await sendMessage({
        message: text,
        context: `${context}_${messageLang}`,
        currentFormData: { language: messageLang }
      }).unwrap();
      
      const { response } = result;

      // Generate response in detected/current language  
      let responseText = response.text;

      // If language was auto-detected and different, acknowledge it
      if (detectedLang && detectedLang !== currentLanguage) {
        const langInfo = multilingualAI.getLanguageInfo(detectedLang);
        responseText = `${langInfo.flag} ${responseText}`;
      }

      // Add AI response message
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: responseText,
        text: responseText,
        timestamp: new Date(),
        extractedData: response.extractedData,
        intent: response.intent,
        language: messageLang,
        isUser: false,
      };

      setMessages(prev => [...prev, aiMessage]);

      // Handle modal opening based on intent
      switch (response.intent) {
        case 'reservation':
          handleReservationIntent(response.extractedData, responseText);
          break;
        case 'checkin':
          detectIntentAndOpenModal(response.intent, response.extractedData, messageLang);
          break;
        case 'checkout':
          detectIntentAndOpenModal(response.intent, response.extractedData, messageLang);
          break;
        case 'availability':
          detectIntentAndOpenModal(response.intent, response.extractedData, messageLang);
          break;
        case 'search_reservation':
          handleReservationSearch(response.extractedData);
          break;
        default:
          break;
      }

      return responseText;

    } catch (error) {
      console.error('Error processing message:', error);

      const errorText = multilingualAI.getResponse('error', {}, messageLang);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: errorText,
        text: errorText,
        timestamp: new Date(),
        language: messageLang,
        isUser: false,
      };

      setMessages(prev => [...prev, errorMessage]);
      return errorText;
    }
  }, [isProcessing, currentLanguage, context, sendMessage, handleReservationIntent, detectIntentAndOpenModal, handleReservationSearch]);

  // Add message from external source
  const addMessage = useCallback((message: string, shouldSpeak: boolean = true) => {
    const aiMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant' as const,
      content: message,
      text: message,
      timestamp: new Date(),
      language: currentLanguage,
      isUser: false,
    };
    setMessages(prev => [...prev, aiMessage]);
  }, [currentLanguage]);

  // Add process completion message
  const addProcessCompletionMessage = useCallback((processType: 'reservation' | 'checkin' | 'checkout', confirmationData: any) => {
    const completionMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Process completed successfully',
      text: multilingualAI.getResponse('bookingConfirmed', {}, currentLanguage),
      timestamp: new Date(),
      language: currentLanguage,
      isProcessCompletion: true,
      processType,
      confirmationData
    } as any;

    setMessages(prev => [...prev, completionMessage]);
  }, [currentLanguage]);

  return {
    messages,
    isProcessing,
    showReservationPreview,
    previewReservationData,
    handleSendMessage,
    handleConfirmReservation,
    addMessage,
    addProcessCompletionMessage,
    setShowReservationPreview,
    setPreviewReservationData
  };
};