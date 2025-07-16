import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Chip,
  CircularProgress,
  Fade,
  Tooltip,
  useTheme,
  useMediaQuery,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Send as SendIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Chat as ChatIcon,
  Close as CloseIcon,
  Psychology as AIIcon,
  Person as PersonIcon,
  Language as LanguageIcon
} from '@mui/icons-material';
import { useSendMessageMutation } from '../store/api/geminiApi';
import { multilingualAI } from '../services/multilingualAIService';
import { languageConfigs, LanguageConfig } from '../services/multilingualAIService';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { 
  ChatMessage, 
  ModalType, 
  IntentType, 
  VoiceProcessedData,
  ProcessedVoiceResponse
} from '../types/reservation';
import ProcessCompletionMessage from './ProcessCompletionMessage';
import SpeechCaption from './SpeechCaption';
import ReservationPreview from './ReservationPreview';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { addReservation, selectAllReservations, selectReservationsByGuest, selectReservationsByPhone, selectReservationByConfirmation } from '../store/slices/mockDataSlice';
import { getDefaultCheckInDate, getDefaultCheckOutDate, getCurrentMonthYear } from '../utils/dateUtils';

type Message = ChatMessage & {
  isUser: boolean;
  text: string;
};

interface AIChatbotProps {
  onOpenModal?: (modalType: ModalType, data?: VoiceProcessedData) => void;
  context?: string;
  processCompleteData?: {
    modelType: string;
    condfirmationData: unknown;
  } | null;
  onReceiveMessage?: (handler: (message: string, shouldSpeak?: boolean) => void) => void;
  onProcessCompleted?: (processType: 'reservation' | 'checkin' | 'checkout', confirmationData: any) => void;
}

const AIChatbot: React.FC<AIChatbotProps> = ({ 
  onOpenModal,
  context = 'hotel_general',
  onReceiveMessage,
  processCompleteData
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [detectedLanguage, setDetectedLanguage] = useState('en');
  const [showReservationPreview, setShowReservationPreview] = useState(false);
  const [previewReservationData, setPreviewReservationData] = useState<any>(null);
  const [currentSpeechText, setCurrentSpeechText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sendMessage, { isLoading: isProcessing }] = useSendMessageMutation();
  const dispatch = useAppDispatch();
  const allReservations = useAppSelector(selectAllReservations);
  
  // Speech recognition hook with dynamic language
  const {
    isListening,
    transcript,
    finalTranscript,
    isSupported: speechSupported,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition( 
    languageConfigs[currentLanguage]?.speechCode || 'en-US', 
    languageConfigs[currentLanguage]?.speechCode || 'en-US', 
    false, 
    true
  );

  // Initialize with welcome message in current language
  useEffect(() => {
    const welcomeMessage: Message = {
      id: '1',
      role: 'assistant' as const,
      content: multilingualAI.getGreeting('welcome'),
      text: multilingualAI.getGreeting('welcome'),
      timestamp: new Date(),
      language: currentLanguage
    };
    setMessages([welcomeMessage]);
    
    // Speak welcome message
    if (isSpeechEnabled) {
      setTimeout(() => {
        speakMessage(welcomeMessage.text, currentLanguage);
      }, 1000);
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Process final transcript from speech recognition
  useEffect(() => {
    if (finalTranscript && finalTranscript.trim()) {
      // Detect language from speech
      const detectedLang = multilingualAI.detectLanguageFromText(finalTranscript);
      setDetectedLanguage(detectedLang);
      
      // Auto-switch language if different from current
      if (detectedLang !== currentLanguage) {
        handleLanguageChange(detectedLang);
      }
      
      setInputText(finalTranscript);
      handleSendMessage(finalTranscript, detectedLang);
      resetTranscript();
    }
  }, [finalTranscript, currentLanguage]);

  // Provide message handler to parent component
  useEffect(() => {
    if (onReceiveMessage) {
      onReceiveMessage((message: string, shouldSpeak: boolean = true) => {
        const aiMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant' as const,
          content: message,
          text: message,
          timestamp: new Date(),
          language: currentLanguage
        };
        setMessages(prev => [...prev, aiMessage]);
        
        if (shouldSpeak && isSpeechEnabled) {
          speakMessage(message, currentLanguage);
        }
      });
    }
  }, [onReceiveMessage, isSpeechEnabled, currentLanguage]);

  // Speech synthesis function with language support
  const speakMessage = useCallback(async (text: string, language: string = currentLanguage) => {
    if (!isSpeechEnabled || !text) return;
    
    setCurrentSpeechText(text);
    setIsSpeaking(true);

    try {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      // Use multilingual AI service
      await multilingualAI.speak(text, language);
      
      setIsSpeaking(false);
    } catch (error) {
      console.error('Speech synthesis error:', error);
      
      // Fallback to browser speech synthesis
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = languageConfigs[language]?.speechCode || 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        speechSynthesis.speak(utterance);
      } catch (fallbackError) {
        setIsSpeaking(false);
        console.error('Fallback speech synthesis failed:', fallbackError);
      }
    } finally {
      setTimeout(() => setIsSpeaking(false), 100);
    }
  }, [isSpeechEnabled, currentLanguage]);

  useEffect(() => {
  if (processCompleteData) {
    const completionMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Process completed successfully',
      text: multilingualAI.getResponse('processCompleted', {}, currentLanguage),
      timestamp: new Date(),
      language: currentLanguage,
      isProcessCompletion: true,
      processType: processCompleteData.modelType as 'reservation' | 'checkin' | 'checkout',
      confirmationData: processCompleteData.condfirmationData
    } as any;

    setMessages((prev) => [...prev, completionMessage]);

    if (isSpeechEnabled) {
      setTimeout(() => {
        speakMessage(completionMessage.text, currentLanguage);
      }, 300);
    }
  }
}, [processCompleteData, currentLanguage, isSpeechEnabled, speakMessage]);

  // Handle language change
  const handleLanguageChange = (language: string) => {
    setCurrentLanguage(language);
    multilingualAI.setLanguage(language);
    
    // Add language change notification
    const changeMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant' as const,
      content: multilingualAI.getResponse('help', {}, language),
      text: multilingualAI.getResponse('help', {}, language),
      timestamp: new Date(),
      language: language
    };
    setMessages(prev => [...prev, changeMessage]);
    
    // Speak in new language
    if (isSpeechEnabled) {
      setTimeout(() => {
        speakMessage(changeMessage.text, language);
      }, 500);
    }
  };

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
      // Add language context to extracted data
      const dataWithLanguage: VoiceProcessedData = {
        ...extractedData,
        // Note: preferredLanguage is not in VoiceProcessedData type, 
        // but we can add it as additional context
      };
      
      // Show user which modal is opening
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
        language: language
      };
      
      setMessages(prev => [...prev, modalMessage]);
      
      // Open modal immediately for better user experience
      console.log('🚀 Opening modal:', modalType, 'with data:', dataWithLanguage);
      onOpenModal(modalType, dataWithLanguage);
    }
  }, [onOpenModal]);

  // Handle reservation search
  const handleReservationSearch = (extractedData: VoiceProcessedData) => {
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
    
    if (isSpeechEnabled) {
      setTimeout(() => {
        speakMessage(responseText, currentLanguage);
      }, 500);
    }
  };

  // Enhanced date processing with current month/year defaults
  const processDateWithDefaults = (extractedData: VoiceProcessedData) => {
    const currentDate = getCurrentMonthYear();
    const processedData = { ...extractedData };
    
    // If no check-in date provided, use tomorrow
    if (!processedData.checkIn) {
      processedData.checkIn = getDefaultCheckInDate();
    }
    
    // If no check-out date provided, use day after check-in
    if (!processedData.checkOut) {
      processedData.checkOut = getDefaultCheckOutDate();
    }
    
    return processedData;
  };

  // Handle reservation preview and confirmation
  const handleReservationIntent = (extractedData: VoiceProcessedData, responseText: string) => {
    const processedData = processDateWithDefaults(extractedData);
    
    // Check if we have enough data for a preview
    const hasMinimumData = processedData.checkIn && processedData.checkOut && 
                          processedData.adults && processedData.roomType && 
                          processedData.guestName && processedData.phone && 
                          processedData.email && processedData.paymentMethod;
    
    if (hasMinimumData) {
      // Show preview instead of opening modal directly
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
      
      if (isSpeechEnabled) {
        setTimeout(() => {
          speakMessage('Please review your reservation details and confirm to proceed.', currentLanguage);
        }, 500);
      }
    } else {
      // Open modal for data collection
      detectIntentAndOpenModal('reservation', processedData, currentLanguage);
    }
  };

  // Get room price helper
  const getRoomPrice = (roomType: string): number => {
    const roomPrices: Record<string, number> = {
      'Ocean View King Suite': 299,
      'Deluxe Garden Room': 199,
      'Family Oceanfront Suite': 399,
      'Presidential Suite': 599,
      'Standard Double Room': 149,
      'Luxury Spa Suite': 449
    };
    return roomPrices[roomType] || 199;
  };

  // Confirm reservation from preview
  const handleConfirmReservation = () => {
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
      
      if (isSpeechEnabled) {
        setTimeout(() => {
          speakMessage('Your reservation has been confirmed successfully!', currentLanguage);
        }, 500);
      }
    }
  };

  // Generate confirmation number
  const generateConfirmationNumber = () => {
    return 'LG' + Math.random().toString(36).substr(2, 8).toUpperCase();
  };

  // Enhanced message processing with language detection
  const handleSendMessage = async (text?: string, detectedLang?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || isProcessing) return;

    const messageLang = detectedLang || currentLanguage;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: messageText,
      text: messageText,
      timestamp: new Date(),
      language: messageLang,
      isUser: true,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    try {
      // Send to Gemini AI with language context
      const result = await sendMessage({
        message: messageText,
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

      // Speak AI response in appropriate language
      if (isSpeechEnabled) {
        setTimeout(() => {
          speakMessage(responseText, messageLang);
        }, 500);
      }

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
        case 'search_reservation':
          detectIntentAndOpenModal(response.intent, response.extractedData, messageLang);
          break;
        default:
          break;
      }
      
      if (response.intent && response.intent !== 'inquiry' && response.intent !== 'help' && response.intent !== 'unknown') {
        detectIntentAndOpenModal(response.intent, response.extractedData, messageLang);
      }

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
      
      if (isSpeechEnabled) {
        speakMessage(errorText, messageLang);
      }
    }
  };

  // Toggle speech synthesis
  const toggleSpeech = () => {
    const newState = !isSpeechEnabled;
    setIsSpeechEnabled(newState);
    if (isSpeechEnabled) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      setCurrentSpeechText('');
    }
  };

  // Toggle voice input with language detection
  const toggleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Handle keyboard input
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Get available languages
  const availableLanguages = multilingualAI.getAvailableLanguages();

  // Minimized view
  if (isMinimized) {
    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: 16, md: 24 },
          right: { xs: 16, md: 24 },
          zIndex: 1000
        }}
      >
        <Tooltip title="Open AI Assistant">
          <IconButton
            onClick={() => setIsMinimized(false)}
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              width: { xs: 56, md: 64 },
              height: { xs: 56, md: 64 },
              '&:hover': {
                bgcolor: 'primary.dark',
                transform: 'scale(1.1)'
              },
              transition: 'all 0.2s',
              boxShadow: 3
            }}
          >
            <ChatIcon sx={{ fontSize: { xs: 24, md: 28 } }} />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  // Full chatbot interface
  return (
    <Paper
      elevation={8}
      sx={{
        position: isMobile ? 'fixed' : 'relative',
        bottom: isMobile ? 0 : 'auto',
        right: isMobile ? 0 : 'auto',
        left: isMobile ? 0 : 'auto',
        width: isMobile ? '100%' : '100%',
        height: isMobile ? '100vh' : '100%',
        maxHeight: isMobile ? '100vh' : '100%',
        display: 'flex',
        flexDirection: 'column',
        zIndex: isMobile ? 1300 : 'auto',
        borderRadius: isMobile ? 0 : 2,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
          color: 'white',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'white', color: 'primary.main', width: 32, height: 32 }}>
            <AIIcon />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              AI Assistant
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {languageConfigs[currentLanguage]?.flag} {languageConfigs[currentLanguage]?.name} • Powered by Gemini AI
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Language Selector */}
          <FormControl size="small" sx={{ minWidth: 80 }}>
            <Select
              value={currentLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              sx={{
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.3)'
                },
                '& .MuiSvgIcon-root': {
                  color: 'white'
                }
              }}
            >
              {availableLanguages.map((lang) => (
                <MenuItem key={lang.code} value={lang.code}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>{lang.flag}</Typography>
                    <Typography variant="caption">{lang.code.toUpperCase()}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Speech Status */}
          {isListening && (
            <Chip
              label="Listening..."
              size="small"
              sx={{
                bgcolor: 'error.main',
                color: 'white',
                animation: 'pulse 1.5s infinite'
              }}
            />
          )}
          
          {/* Speech Toggle */}
          <Tooltip title={isSpeechEnabled ? 'Disable Speech' : 'Enable Speech'}>
            <IconButton onClick={toggleSpeech} sx={{ color: 'white' }}>
              {isSpeechEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
            </IconButton>
          </Tooltip>
          
          {/* Minimize Button */}
          {!isMobile && (
            <Tooltip title="Minimize">
              <IconButton onClick={() => setIsMinimized(true)} sx={{ color: 'white' }}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          bgcolor: 'grey.50',
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        {messages.map((message) => (
          <Fade in={true} key={message.id}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start',
                gap: 1
              }}
            >
              {message.role === 'assistant' && (
                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                  <AIIcon sx={{ fontSize: 18 }} />
                </Avatar>
              )}
              
              <Paper
                elevation={1}
                sx={{
                  maxWidth: '75%',
                  p: 2,
                  bgcolor: message.role === 'user' ? 'primary.main' : 'white',
                  color: message.role === 'user' ? 'white' : 'text.primary',
                  borderRadius: 2,
                  borderTopLeftRadius: message.role === 'user' ? 2 : 0.5,
                  borderTopRightRadius: message.role === 'user' ? 0.5 : 2
                }}
              >
                {/* Process Completion Message */}
                {message.role === 'assistant' && (message as any).isProcessCompletion && (
                  <ProcessCompletionMessage
                    processType={(message as any).processType}
                    confirmationData={(message as any).confirmationData}
                    timestamp={message.timestamp}
                    language={message.language || currentLanguage}
                  />
                )}
                
                {/* Regular Message */}
                {!(message as any).isProcessCompletion && (
                  <>
                    {/* Language indicator for messages */}
                    {message.language && message.language !== 'en' && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <LanguageIcon sx={{ fontSize: 14 }} />
                        <Typography variant="caption">
                          {languageConfigs[message.language]?.flag} {languageConfigs[message.language]?.name}
                        </Typography>
                      </Box>
                    )}

                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {message.text}
                    </Typography>
                    
                    {/* Show extracted data for AI messages */}
                    {message.role === 'assistant' && message.extractedData && Object.keys(message.extractedData).length > 0 && (
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {Object.entries(message.extractedData).map(([key, value]) => (
                          <Chip
                            key={key}
                            label={`${key}: ${value}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        ))}
                      </Box>
                    )}
                    
                    <Typography variant="caption" sx={{ 
                      display: 'block', 
                      mt: 0.5, 
                      opacity: 0.7,
                      fontSize: '0.7rem'
                    }}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </>
                )}
              </Paper>
              
              {message.role === 'user' && (
                <Avatar sx={{ bgcolor: 'grey.400', width: 32, height: 32 }}>
                  <PersonIcon sx={{ fontSize: 18 }} />
                </Avatar>
              )}
            </Box>
          </Fade>
        ))}
        
        {/* Processing Indicator */}
        {isProcessing && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
              <AIIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Paper elevation={1} sx={{ p: 2, borderRadius: 2, borderTopLeftRadius: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  AI is thinking...
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}
        
        {/* Current transcript display */}
        {transcript && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Paper
              elevation={1}
              sx={{
                maxWidth: '75%',
                p: 2,
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
                borderRadius: 2,
                borderTopRightRadius: 0.5,
                opacity: 0.8
              }}
            >
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                {transcript}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {languageConfigs[detectedLanguage]?.flag} Speaking...
              </Typography>
            </Paper>
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box
        sx={{
          p: 2,
          bgcolor: 'white',
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={3}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`Type your message in any language or use voice...`}
          disabled={isProcessing || isListening}
          variant="outlined"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3
            }
          }}
        />
        
        {/* Voice Input Button */}
        {speechSupported && (
          <Tooltip title={isListening ? 'Stop Listening' : 'Start Voice Input'}>
            <IconButton
              onClick={toggleVoiceInput}
              disabled={isProcessing}
              sx={{
                bgcolor: isListening ? 'error.main' : 'grey.100',
                color: isListening ? 'white' : 'grey.600',
                '&:hover': {
                  bgcolor: isListening ? 'error.dark' : 'grey.200'
                },
                animation: isListening ? 'pulse 1.5s infinite' : 'none'
              }}
            >
              {isListening ? <MicOffIcon /> : <MicIcon />}
            </IconButton>
          </Tooltip>
        )}
        
        {/* Send Button */}
        <Tooltip title="Send Message">
          <IconButton
            onClick={() => handleSendMessage()}
            disabled={isProcessing || !inputText.trim()}
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': {
                bgcolor: 'primary.dark'
              },
              '&.Mui-disabled': {
                bgcolor: 'grey.300'
              }
            }}
          >
            <SendIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Speech Error Display */}
      {speechError && (
        <Box sx={{ p: 1, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography variant="caption">
            Speech Error: {speechError}
          </Typography>
        </Box>
      )}
    </Paper>
      {/* Speech Caption */}
      <SpeechCaption
        isVisible={isSpeaking && currentSpeechText.length > 0}
        text={currentSpeechText}
        isPlaying={isSpeaking}
        onToggleSound={toggleSpeech}
        isSoundEnabled={isSpeechEnabled}
      />

      {/* Reservation Preview Modal */}
      {showReservationPreview && previewReservationData && (
        <ReservationPreview
          isOpen={showReservationPreview}
          onClose={() => {
            setShowReservationPreview(false);
            setPreviewReservationData(null);
          }}
          onConfirm={handleConfirmReservation}
          reservationData={previewReservationData}
        />
      )}

  );
};

export default AIChatbot;