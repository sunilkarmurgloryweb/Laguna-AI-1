import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { multilingualAI } from '../services/multilingualAIService';
import { languageConfigs } from '../services/multilingualAIService';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useChatLogic } from '../hooks/useChatLogic';
import {
  ModalType,
  VoiceProcessedData
} from '../types/reservation';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import MinimizedChatButton from './MinimizedChatButton';
import SpeechCaption from './SpeechCaption';
import ReservationPreview from './ReservationModel/ReservationPreview';

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

  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [detectedLanguage, setDetectedLanguage] = useState('en');
  const [currentSpeechText, setCurrentSpeechText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use chat logic hook
  const {
    messages,
    isProcessing,
    showReservationPreview,
    previewReservationData,
    handleSendMessage: chatHandleSendMessage,
    handleConfirmReservation,
    addMessage,
    addProcessCompletionMessage,
    setShowReservationPreview,
    setPreviewReservationData
  } = useChatLogic({
    context,
    currentLanguage,
    isSpeechEnabled,
    onOpenModal
  });

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
    false,
    true
  );

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
        addMessage(message, shouldSpeak);

        if (shouldSpeak && isSpeechEnabled) {
          speakMessage(message, currentLanguage);
        }
      });
    }
  }, [onReceiveMessage, isSpeechEnabled, currentLanguage, addMessage]);

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
      return true;
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
      return true;
    } finally {
      setTimeout(() => setIsSpeaking(false), 100);
      return true;
    }
  }, [isSpeechEnabled, currentLanguage]);

  useEffect(() => {
    if (processCompleteData) {
      addProcessCompletionMessage(
        processCompleteData.modelType as 'reservation' | 'checkin' | 'checkout',
        processCompleteData.condfirmationData
      );

      if (isSpeechEnabled) {
        setTimeout(() => {
          speakMessage(multilingualAI.getResponse('bookingConfirmed', {}, currentLanguage), currentLanguage);
        }, 300);
      }
    }
  }, [processCompleteData, currentLanguage, isSpeechEnabled, speakMessage, addProcessCompletionMessage]);

  // Handle language change
  const handleLanguageChange = (language: string) => {
    setCurrentLanguage(language);
    multilingualAI.setLanguage(language);

    addMessage(multilingualAI.getResponse('help', {}, language));

    // Speak in new language
    if (isSpeechEnabled) {
      setTimeout(() => {
        speakMessage(multilingualAI.getResponse('help', {}, language), language);
      }, 500);
    }
  };

  // Handle sending message
  const handleSendMessage = async (text?: string, detectedLang?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    const responseText = await chatHandleSendMessage(messageText, detectedLang);
    setInputText('');

    // Speak AI response if enabled
    if (isSpeechEnabled && responseText) {
      await speakMessage(responseText, detectedLang || currentLanguage);
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
    return <MinimizedChatButton onExpand={() => setIsMinimized(false)} />;
  }

  // Full chatbot interface
  return (
    <>
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
        <ChatHeader
          currentLanguage={currentLanguage}
          isListening={isListening}
          isSpeechEnabled={isSpeechEnabled}
          availableLanguages={availableLanguages}
          onLanguageChange={handleLanguageChange}
          onToggleSpeech={toggleSpeech}
          onMinimize={!isMobile ? () => setIsMinimized(true) : undefined}
        />

        <ChatMessages
          messages={messages}
          isProcessing={isProcessing}
          transcript={transcript}
          detectedLanguage={detectedLanguage}
          currentLanguage={currentLanguage}
          messagesEndRef={messagesEndRef}
        />

        <ChatInput
          inputText={inputText}
          isProcessing={isProcessing}
          isListening={isListening}
          speechSupported={speechSupported}
          speechError={speechError}
          onInputChange={setInputText}
          onSendMessage={() => handleSendMessage()}
          onToggleVoiceInput={toggleVoiceInput}
          onKeyPress={handleKeyPress}
        />
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
    </>
  );
}

export default AIChatbot;