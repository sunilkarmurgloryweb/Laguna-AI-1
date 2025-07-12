import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  Avatar,
  Chip,
  CircularProgress,
  InputAdornment,
  Alert,
  Fade,
  useTheme,
  useMediaQuery,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Mic,
  MicOff,
  Send,
  SmartToy,
  Person,
  VolumeUp,
  VolumeOff,
  Refresh,
  CheckCircle,
  Language,
  Translate
} from '@mui/icons-material';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import {
  useSendMessageMutation,
  useResetChatMutation,
  useSetContextMutation
} from '../store/api/geminiApi';
import { ChatMessage } from '../services/geminiService';
import { multilingualAI } from '../services/multilingualAIService';

interface AIChatbotProps {
  onOpenModal: (
    modalType: 'reservation' | 'checkin' | 'checkout' | 'availability',
    data?: any
  ) => void;
  onFormDataUpdate?: (data: Record<string, any>) => void;
  currentFormData?: Record<string, any>;
  context?: string;
}

const AIChatbot: React.FC<AIChatbotProps> = ({
  onOpenModal,
  onFormDataUpdate,
  currentFormData = {},
  context = 'hotel_general'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [languageMenuAnchor, setLanguageMenuAnchor] = useState<null | HTMLElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    isListening,
    transcript,
    interimTranscript,
    finalTranscript,
    isSupported: speechSupported,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition(multilingualAI.getSpeechRecognitionLanguage(), false, true);

  const [sendMessage, { isLoading: isProcessing, error: apiError }] = useSendMessageMutation();
  const [resetChat] = useResetChatMutation();
  const [setContext] = useSetContextMutation();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (context) {
      setContext(`${context}_${currentLanguage}`);
    }
  }, [context, currentLanguage, setContext]);

  useEffect(() => {
    if (finalTranscript && finalTranscript.trim()) {
      handleSendMessage(finalTranscript);
      resetTranscript();
    }
  }, [finalTranscript]);

  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: multilingualAI.getGreeting('welcome'),
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [currentLanguage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (messageText?: string): Promise<void> => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    try {
      const result = await sendMessage({
        message: textToSend,
        currentFormData,
        context: `${context}_${currentLanguage}`
      }).unwrap();

      if (result?.chatMessage) {
        setMessages((prev) => [...prev, result.chatMessage]);
      }

      const intent = result?.response?.intent;
      if (['reservation', 'checkin', 'checkout', 'availability'].includes(intent)) {
        onOpenModal(intent as 'reservation' | 'checkin' | 'checkout' | 'availability', result.response.extractedData);
      }

      if (result?.response?.shouldFillForm && result.response.extractedData) {
        onFormDataUpdate?.(result.response.extractedData);
      }

      // Speak response in current language
      if (result?.response?.text && isSpeechEnabled) {
        try {
          await multilingualAI.speak(result.response.text, currentLanguage);
        } catch (speechError) {
          console.warn('Text-to-speech failed:', speechError);
        }
      }
    } catch (error) {
      console.error('Send failed:', error);
      const errorMessage = multilingualAI.getResponse('error', {}, currentLanguage);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + '_error',
          role: 'assistant',
          content: errorMessage,
          timestamp: new Date()
        }
      ]);
    }
  };

  const handleVoiceToggle = () => {
    isListening ? stopListening() : startListening();
  };

  const handleResetChat = async () => {
    try {
      await resetChat().unwrap();
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: multilingualAI.getGreeting('welcome'),
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Reset failed:', error);
    }
  };

  const handleLanguageChange = (languageCode: string) => {
    setCurrentLanguage(languageCode);
    multilingualAI.setLanguage(languageCode);
    setLanguageMenuAnchor(null);
    
    // Add language change message
    const languageInfo = multilingualAI.getLanguageInfo(languageCode);
    const changeMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Language changed to ${languageInfo.name}. ${multilingualAI.getGreeting('welcome')}`,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, changeMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageIcon = (message: ChatMessage) =>
    message.role === 'assistant' ? (
      <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
        <SmartToy sx={{ fontSize: 16 }} />
      </Avatar>
    ) : (
      <Avatar sx={{ bgcolor: 'grey.300', width: 32, height: 32 }}>
        <Person sx={{ fontSize: 16 }} />
      </Avatar>
    );

  const getMessageColor = (message: ChatMessage) =>
    message.role === 'user' ? 'primary.main' : 'grey.100';

  const getTextColor = (message: ChatMessage) =>
    message.role === 'user' ? 'primary.contrastText' : 'text.primary';

  const availableLanguages = multilingualAI.getAvailableLanguages();
  const currentLanguageInfo = multilingualAI.getLanguageInfo(currentLanguage);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Language Selector */}
      <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button
            size="small"
            startIcon={<Language />}
            onClick={(e) => setLanguageMenuAnchor(e.currentTarget)}
            sx={{ fontSize: '0.75rem' }}
          >
            {currentLanguageInfo.flag} {currentLanguageInfo.name}
          </Button>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton 
              size="small" 
              onClick={() => setIsSpeechEnabled(!isSpeechEnabled)}
              color={isSpeechEnabled ? 'primary' : 'default'}
            >
              {isSpeechEnabled ? <VolumeUp /> : <VolumeOff />}
            </IconButton>
            <IconButton size="small" onClick={handleResetChat}>
              <Refresh />
            </IconButton>
          </Box>
        </Box>
        
        <Menu
          anchorEl={languageMenuAnchor}
          open={Boolean(languageMenuAnchor)}
          onClose={() => setLanguageMenuAnchor(null)}
          PaperProps={{
            sx: { maxHeight: 300 }
          }}
        >
          {availableLanguages.map((lang) => (
            <MenuItem
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              selected={lang.code === currentLanguage}
            >
              <ListItemIcon>
                <Typography variant="h6">{lang.flag}</Typography>
              </ListItemIcon>
              <ListItemText 
                primary={lang.name}
                secondary={lang.code.toUpperCase()}
              />
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {/* Message Area */}
      <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 1, md: 2 } }}>
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              mb: { xs: 1.5, md: 2 }
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: 1, 
              maxWidth: { xs: '90%', md: '80%' },
              flexDirection: message.role === 'user' ? 'row-reverse' : 'row'
            }}>
              {getMessageIcon(message)}
              <Box>
                <Paper
                  sx={{
                    p: { xs: 1, md: 1.5 },
                    bgcolor: getMessageColor(message),
                    color: getTextColor(message),
                    borderRadius: 2
                  }}
                >
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                    {message.content}
                  </Typography>
                </Paper>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    opacity: 0.7, 
                    mt: 0.5, 
                    display: 'block',
                    fontSize: { xs: '0.7rem', md: '0.75rem' }
                  }}
                >
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
            </Box>
          </Box>
        ))}

        {/* AI Typing Indicator */}
        {isProcessing && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, maxWidth: '80%' }}>
              <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
                <SmartToy sx={{ fontSize: 16 }} />
              </Avatar>
              <Paper sx={{ p: 1.5, bgcolor: 'grey.100', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {[...Array(3)].map((_, i) => (
                    <Box
                      key={i}
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        animation: `blink 1.4s infinite ${i * 0.2}s`,
                        '@keyframes blink': {
                          '0%': { opacity: 0.2 },
                          '20%': { opacity: 1 },
                          '100%': { opacity: 0.2 }
                        }
                      }}
                    />
                  ))}
                  <Typography variant="body2" sx={{ ml: 1, fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                    AI is thinking...
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Section */}
      <Box sx={{ p: { xs: 1, md: 2 }, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <TextField
            fullWidth
            size={isMobile ? 'small' : 'medium'}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Type your message in ${currentLanguageInfo.name}...`}
            disabled={isProcessing}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Chip
                    label={currentLanguageInfo.flag}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </InputAdornment>
              )
            }}
          />
          {speechSupported && (
            <IconButton
              onClick={handleVoiceToggle}
              disabled={isProcessing}
              color={isListening ? 'error' : 'default'}
              sx={{
                bgcolor: isListening ? 'error.light' : 'grey.200',
                '&:hover': { bgcolor: isListening ? 'error.main' : 'grey.300' },
                animation: isListening ? 'pulse 1.5s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { boxShadow: '0 0 0 0 rgba(244, 67, 54, 0.7)' },
                  '70%': { boxShadow: '0 0 0 10px rgba(244, 67, 54, 0)' },
                  '100%': { boxShadow: '0 0 0 0 rgba(244, 67, 54, 0)' }
                }
              }}
            >
              {isListening ? <MicOff /> : <Mic />}
            </IconButton>
          )}
          <IconButton
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isProcessing}
            color="primary"
          >
            <Send />
          </IconButton>
        </Box>
      </Box>

      {/* Voice Transcript Display */}
      {(transcript || interimTranscript) && (
        <Fade in={true}>
          <Box sx={{ p: { xs: 1, md: 2 }, borderTop: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              {isListening ? 'Listening...' : 'Voice input:'}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
              {transcript}
              {interimTranscript && (
                <span style={{ opacity: 0.6, fontStyle: 'italic' }}>{interimTranscript}</span>
              )}
            </Typography>
          </Box>
        </Fade>
      )}

      {/* Error Display */}
      {(speechError || apiError) && (
        <Alert severity="error" sx={{ m: { xs: 1, md: 2 } }}>
          {speechError || 'Failed to process message. Please try again.'}
        </Alert>
      )}
    </Box>
  );
};

export default AIChatbot;