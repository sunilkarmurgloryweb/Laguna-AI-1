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
  SmartToy as AIIcon,
  Person as PersonIcon,
  Language as LanguageIcon
} from '@mui/icons-material';
import { useSendMessageMutation } from '../store/api/geminiApi';
import { multilingualAI, languageConfigs } from '../services/multilingualAIService';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  extractedData?: Record<string, unknown>;
  intent?: string;
  language?: string;
}

interface AIChatbotProps {
  onOpenModal?: (modalType: 'reservation' | 'checkin' | 'checkout' | 'availability', data?: Record<string, unknown>) => void;
  context?: string;
  onReceiveMessage?: (handler: (message: string, shouldSpeak?: boolean) => void) => void;
}

const AIChatbot: React.FC<AIChatbotProps> = ({ 
  onOpenModal,
  context = 'hotel_general',
  onReceiveMessage
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [detectedLanguage, setDetectedLanguage] = useState('en');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sendMessage, { isLoading: isProcessing }] = useSendMessageMutation();
  
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

  // Initialize with welcome message in current language
  useEffect(() => {
    const welcomeMessage: Message = {
      id: '1',
      text: multilingualAI.getGreeting('welcome'),
      isUser: false,
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
          text: message,
          isUser: false,
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

    try {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      // Use multilingual AI service
      await multilingualAI.speak(text, language);
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
        console.error('Fallback speech synthesis failed:', fallbackError);
      }
    }
  }, [isSpeechEnabled, currentLanguage]);

  // Handle language change
  const handleLanguageChange = (language: string) => {
    setCurrentLanguage(language);
    multilingualAI.setLanguage(language);
    
    // Add language change notification
    const langInfo = multilingualAI.getLanguageInfo(language);
    const changeMessage: Message = {
      id: Date.now().toString(),
      text: multilingualAI.getResponse('help', {}, language),
      isUser: false,
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
  const detectIntentAndOpenModal = useCallback((intent: string, extractedData: any, language: string) => {
    if (!onOpenModal) return;

    const modalMappings: Record<string, string> = {
      'reservation': 'reservation',
      'checkin': 'checkin', 
      'checkout': 'checkout',
      'availability': 'availability'
    };

    const modalType = modalMappings[intent];
    if (modalType) {
      // Add language context to extracted data
      const dataWithLanguage = {
        ...extractedData,
        preferredLanguage: language
      };
      
      // Delay modal opening to allow AI response to be spoken first
      setTimeout(() => {
        onOpenModal(modalType, dataWithLanguage);
      }, 2000);
    }
  }, [onOpenModal]);

  // Enhanced message processing with language detection
  const handleSendMessage = async (text?: string, detectedLang?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || isProcessing) return;

    const messageLang = detectedLang || currentLanguage;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
      language: messageLang
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
      console.log(result, messageText, "response.intent");

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
        text: responseText,
        isUser: false,
        timestamp: new Date(),
        extractedData: response.extractedData,
        intent: response.intent,
        language: messageLang
      };

      setMessages(prev => [...prev, aiMessage]);

      // Speak AI response in appropriate language
      if (isSpeechEnabled) {
        setTimeout(() => {
          speakMessage(responseText, messageLang);
        }, 500);
      }

      // Handle modal opening based on intent
      if (response.intent && response.extractedData) {
        detectIntentAndOpenModal(response.intent, response.extractedData, messageLang);
      }

    } catch (error) {
      console.error('Error processing message:', error);
      
      const errorText = multilingualAI.getResponse('error', {}, messageLang);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        isUser: false,
        timestamp: new Date(),
        language: messageLang
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      if (isSpeechEnabled) {
        speakMessage(errorText, messageLang);
      }
    }
  };

  // Toggle speech synthesis
  const toggleSpeech = () => {
    setIsSpeechEnabled(!isSpeechEnabled);
    if (isSpeechEnabled) {
      speechSynthesis.cancel();
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
                justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start',
                gap: 1
              }}
            >
              {!message.isUser && (
                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                  <AIIcon sx={{ fontSize: 18 }} />
                </Avatar>
              )}
              
              <Paper
                elevation={1}
                sx={{
                  maxWidth: '75%',
                  p: 2,
                  bgcolor: message.isUser ? 'primary.main' : 'white',
                  color: message.isUser ? 'white' : 'text.primary',
                  borderRadius: 2,
                  borderTopLeftRadius: message.isUser ? 2 : 0.5,
                  borderTopRightRadius: message.isUser ? 0.5 : 2
                }}
              >
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
                {!message.isUser && message.extractedData && Object.keys(message.extractedData).length > 0 && (
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
              </Paper>
              
              {message.isUser && (
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
  );
};

export default AIChatbot;