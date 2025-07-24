import { useState, useEffect, useCallback } from 'react';
import { useSendMessageMutation } from '../store/api/geminiApi';
import { useAppDispatch, useAppSelector } from '../hooks';
import {
  addReservation,
  selectAllReservations,
  selectReservationsByGuest,
  selectReservationsByPhone,
  selectReservationByConfirmation
} from '../store/slices/mockDataSlice';
import { multilingualAI } from '../services/multilingualAIService';
import { getDefaultCheckInDate, getDefaultCheckOutDate } from '../utils/dateUtils';
import {
  ChatMessage,
  ModalType,
  IntentType,
  VoiceProcessedData,
  RoomType
} from '../types/reservation';
import { useAuth } from '../hooks/useAuth';
import { useLazyGetAvailabilityQuery } from '../store/api/otaReservationApi';
import { GetAvailabilityResponse } from '../types/otaReservationApi';
import {useSpeechVoices} from './useSpeechVoices';

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
  const voices = useSpeechVoices();

  const [messages, setMessages] = useState<Message[]>([]);
  const [showReservationPreview, setShowReservationPreview] = useState(false);
  const [previewReservationData, setPreviewReservationData] = useState<any>(null);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)

  const [sendMessage, { isLoading: isProcessing }] = useSendMessageMutation();
  const dispatch = useAppDispatch();
  const allReservations = useAppSelector(selectAllReservations);
  const { user, properties, roomTypes } = useAuth();

  // Lazy availability query
  const [getAvailability] = useLazyGetAvailabilityQuery();

  useEffect(()=>{
    if (voices) {
      const sVoice = voices.find(v => v.name === 'Google US English'); 
      setSelectedVoice(sVoice)
    }
  },[voices])

  const speakMessage = useCallback((text: string, lang?: string) => {
  if (!isSpeechEnabled || !window.speechSynthesis) return;

  const utterance = new SpeechSynthesisUtterance(text);
  if (lang) utterance.lang = lang;
  if (selectedVoice) utterance.voice = selectedVoice;

  window.speechSynthesis.speak(utterance);
}, [isSpeechEnabled, selectedVoice]);


  useEffect(() => {
    const welcomeText = multilingualAI.getGreeting('welcome');
    const welcomeMessage: Message = {
      id: '1',
      role: 'assistant',
      content: welcomeText,
      text: welcomeText,
      timestamp: new Date(),
      language: currentLanguage,
      isUser: false,
    };
    setMessages([welcomeMessage]);
    // speakMessage(welcomeText, currentLanguage);
  }, [currentLanguage, speakMessage]);

  const handleReservationSearch = useCallback((data: VoiceProcessedData) => {
    const { confirmationNumber, guestName, phone } = data;
    let found = [];
    if (confirmationNumber) {
      const res = selectReservationByConfirmation(
        { mockData: { reservations: allReservations, checkIns: [], checkOuts: [], roomAvailability: {} } },
        confirmationNumber
      );
      if (res) found = [res];
    } else if (guestName) {
      found = selectReservationsByGuest({ mockData: { reservations: allReservations, checkIns: [], checkOuts: [], roomAvailability: {} } }, guestName);
    } else if (phone) {
      found = selectReservationsByPhone({ mockData: { reservations: allReservations, checkIns: [], checkOuts: [], roomAvailability: {} } }, phone);
    }

    const text = found.length > 0
      ? `Found reservation for ${found[0].guestName}. Confirmation: ${found[0].confirmationNumber}, Room: ${found[0].roomType}, Check-in: ${found[0].checkIn}, Status: ${found[0].status}`
      : 'No reservations found with the provided information. Please check your confirmation number or contact details.';

    const msg: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: text,
      text,
      timestamp: new Date(),
      language: currentLanguage,
      isUser: false,
    };
    setMessages(prev => [...prev, msg]);
    speakMessage(text, currentLanguage);
    return text;
  }, [allReservations, currentLanguage, speakMessage]);

  const processDateWithDefaults = useCallback((d: VoiceProcessedData): VoiceProcessedData => ({
    ...d,
    checkIn: d.checkIn || getDefaultCheckInDate(),
    checkOut: d.checkOut || getDefaultCheckOutDate(),
  }), []);

  const getRoomPrice = useCallback((name: string): number => {
    const rt = roomTypes?.find(r => r.name === name);
    return rt?.price ?? 199;
  }, [roomTypes]);

  const handleReservationIntent = useCallback((data: VoiceProcessedData, responseText: string) => {
    const p = processDateWithDefaults(data);
    const has = p.checkIn && p.checkOut && p.adults && p.roomType && p.guestName && p.phone && p.email && p.paymentMethod;
    if (has) {
      const resData = {
        checkIn: p.checkIn!,
        checkOut: p.checkOut!,
        adults: p.adults!,
        children: p.children || 0,
        roomType: p.roomType!,
        roomPrice: getRoomPrice(p.roomType!),
        guestName: p.guestName!,
        phone: p.phone!,
        email: p.email!,
        paymentMethod: p.paymentMethod!,
        hotel: properties?.name || 'Default Hotel',
        userId: user?.id,
      };
      setPreviewReservationData(resData);
      setShowReservationPreview(true);
      const previewText = 'I have all the information needed for your reservation. Please review and confirm.';
      const msg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: previewText,
        text: previewText,
        timestamp: new Date(),
        language: currentLanguage,
        isUser: false,
      };
      setMessages(prev => [...prev, msg]);
      speakMessage(previewText, currentLanguage);
    } else {
      detectIntentAndOpenModal('reservation', p, currentLanguage);
    }
  }, [processDateWithDefaults, getRoomPrice, currentLanguage, user, properties, speakMessage]);

  const generateConfirmationNumber = useCallback(() => 'LG' + Math.random().toString(36).substr(2, 8).toUpperCase(), []);

  const handleConfirmReservation = useCallback(() => {
    if (!previewReservationData) return;
    const confirmationNumber = generateConfirmationNumber();
    const finalRes = {
      ...previewReservationData,
      confirmationNumber,
      status: 'confirmed',
      createdBy: user?.id,
      createdAt: new Date().toISOString(),
    };
    dispatch(addReservation(finalRes));
    const text = `Reservation confirmed! Your confirmation number is ${confirmationNumber}.`;
    const msg: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: text,
      text,
      timestamp: new Date(),
      language: currentLanguage,
      isUser: false,
    };
    setMessages(prev => [...prev, msg]);
    speakMessage(text, currentLanguage);
    setPreviewReservationData(null);
    setShowReservationPreview(false);
  }, [previewReservationData, currentLanguage, user, speakMessage, dispatch, generateConfirmationNumber]);

  const findRoomTypeIdByName = (name: string): number | null => {
    const norm = name.toLowerCase();
    const rt = roomTypes?.find(r => r.name.toLowerCase().includes(norm));
    return rt?.id ?? null;
  };

  const handleAvailabilityIntent = useCallback(async (data: VoiceProcessedData, lang: string) => {
    const { start_date, end_date, adults = 0, children = 0, property_id, room_type_name } = data;
    const guests = adults + children;
    const loadingMsg: Message = {
      id: Date.now().toString() + '_load',
      role: 'assistant',
      content: 'We are finding the room availability...',
      text: 'We are finding the room availability...',
      timestamp: new Date(),
      language: lang,
      isUser: false
    };
    setMessages(prev => [...prev, loadingMsg]);
    speakMessage(loadingMsg.content, lang);

    try {
      const availabilityData: GetAvailabilityResponse = await getAvailability({
        start_date, end_date, number_of_guests: guests, property_id
      }).unwrap();

      const res = availabilityData.availability;

      if (!res?.length) {
        const msg: Message = {
          id: Date.now().toString() + '_none',
          role: 'assistant',
          content: 'No rooms available for those dates and guests.',
          text: 'No rooms available for those dates and guests.',
          timestamp: new Date(),
          language: lang,
          isUser: false
        };
        setMessages(prev => [...prev, msg]);
        speakMessage(msg.content, lang);
        return;
      }

      const rtId = room_type_name ? findRoomTypeIdByName(room_type_name) : null;
      let matched: AvailabilityItem | undefined;
      if (rtId) matched = res.find(item => item.room_type_id === rtId);

      if (matched) {
        const msg: Message = {
          id: Date.now().toString() + '_match',
          role: 'assistant',
          content: `Yes, we have ${matched.room_type.name} available.`,
          text: `Yes, we have ${matched.room_type.name} available.`,
          timestamp: new Date(),
          language: lang,
          isUser: false
        };
        setMessages(prev => [...prev, msg]);
        speakMessage(msg.content, lang);
        onOpenModal?.('availability', { ...data, selected_room_type_id: rtId });
      } else {
        const opts = res.map(r => r.room_type.name).join(', ');
        const msg: Message = {
          id: Date.now().toString() + '_alt',
          role: 'assistant',
          content: `No match found. Available room types: ${opts}`,
          text: `No match found. Available room types: ${opts}`,
          timestamp: new Date(),
          language: lang,
          isUser: false
        };
        setMessages(prev => [...prev, msg]);
        speakMessage(msg.content, lang);
        onOpenModal?.('availability', data);
      }
    } catch (err) {
      console.error(err);
      const msg: Message = {
        id: Date.now().toString() + '_err',
        role: 'assistant',
        content: 'Error checking availability. Please try again.',
        text: 'Error checking availability. Please try again.',
        timestamp: new Date(),
        language: lang,
        isUser: false
      };
      setMessages(prev => [...prev, msg]);
      speakMessage(msg.content, lang);
    }
  }, [currentLanguage, speakMessage, getAvailability, roomTypes, onOpenModal]);

  const detectIntentAndOpenModal = useCallback(async (
    intent: IntentType,
    data: VoiceProcessedData,
    lang: string
  ) => {
    if (!onOpenModal) return;
    console.log('🎯', intent, data);

    switch (intent) {
      case 'availability':
        await handleAvailabilityIntent(data, lang);
        break;
      case 'search_reservation':
        handleReservationSearch(data);
        break;
      case 'reservation':
      case 'checkin':
      case 'checkout':
        onOpenModal(intent as ModalType, data);
        const messagesMap: Record<ModalType, string> = {
          reservation: 'Opening reservation form...',
          checkin: 'Opening check-in process...',
          checkout: 'Opening check-out process...'
        };
        const msg: Message = {
          id: Date.now().toString() + `_${intent}`,
          role: 'assistant',
          content: messagesMap[intent as ModalType]!,
          text: messagesMap[intent as ModalType]!,
          timestamp: new Date(),
          language: lang,
          isUser: false
        };
        setMessages(prev => [...prev, msg]);
        speakMessage(msg.content, lang);
        break;
      default:
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Sorry, I didn’t get that.',
          text: 'Sorry, I didn’t get that.',
          timestamp: new Date(),
          language: lang,
          isUser: false
        }]);
        break;
    }
  }, [handleAvailabilityIntent, handleReservationSearch, onOpenModal, speakMessage]);

  const handleSendMessage = useCallback(async (text: string, detectedLang?: string) => {
    if (!text.trim() || isProcessing) return;
    const lang = detectedLang || currentLanguage;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      text,
      timestamp: new Date(),
      language: lang,
      isUser: true
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const { response } = await sendMessage({
        message: text,
        context: `${context}_${lang}`,
        currentFormData: { language: lang }
      }).unwrap();
      let respText = response.text;
      if (detectedLang && detectedLang !== currentLanguage) {
        respText = `${multilingualAI.getLanguageInfo(detectedLang).flag} ${respText}`;
      }

      const aiMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: respText,
        text: respText,
        timestamp: new Date(),
        extractedData: response.extractedData,
        intent: response.intent,
        language: lang,
        isUser: false
      };
      setMessages(prev => [...prev, aiMsg]);
      speakMessage(respText, lang);

      switch (response.intent) {
        case 'reservation':
          handleReservationIntent(response.extractedData, respText);
          break;
        case 'availability':
          await detectIntentAndOpenModal('availability', response.extractedData, lang);
          break;
        case 'search_reservation':
          handleReservationSearch(response.extractedData);
          break;
        case 'checkin':
        case 'checkout':
          await detectIntentAndOpenModal(response.intent, response.extractedData, lang);
          break;
      }
      return respText;
    } catch (e) {
      console.error(e);
      const err = multilingualAI.getResponse('error', {}, lang);
      const errMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: err,
        text: err,
        timestamp: new Date(),
        language: lang,
        isUser: false
      };
      setMessages(prev => [...prev, errMsg]);
      speakMessage(err, lang);
      return err;
    }
  }, [isProcessing, currentLanguage, sendMessage, context, handleReservationSearch, handleReservationIntent, detectIntentAndOpenModal, speakMessage]);

  const addMessage = useCallback((message: string, shouldSpeak = true) => {
    const aiMsg: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: message,
      text: message,
      timestamp: new Date(),
      language: currentLanguage,
      isUser: false
    };
    setMessages(prev => [...prev, aiMsg]);
    if (shouldSpeak) speakMessage(message, currentLanguage);
  }, [currentLanguage, speakMessage]);

  const addProcessCompletionMessage = useCallback((processType: 'reservation' | 'checkin' | 'checkout', confirmationData: any) => {
    const content = multilingualAI.getResponse('bookingConfirmed', {}, currentLanguage);
    const msg: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      text: content,
      timestamp: new Date(),
      language: currentLanguage,
      isProcessCompletion: true,
      processType,
      confirmationData
    } as any;
    setMessages(prev => [...prev, msg]);
    speakMessage(content, currentLanguage);
  }, [currentLanguage, speakMessage]);

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
