import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  Avatar,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Alert,
  Fade
} from '@mui/material';
import {
  Mic,
  MicOff,
  Send,
  SmartToy,
  Person,
  Language,
  VolumeUp,
  VolumeOff,
  Refresh,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSendMessageMutation, useResetChatMutation, useSetContextMutation } from '../store/api/geminiApi';
import { ChatMessage } from '../services/geminiService';

interface AIChatbotProps {
  onOpenModal: (modalType: 'reservation' | 'checkin' | 'checkout' | 'availability', data?: any) => void;
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
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
  } = useSpeechRecognition('en-US', false, true);

  const [sendMessage, { 
    isLoading: isProcessing, 
    error: apiError 
  }] = useSendMessageMutation();

  const [resetChat] = useResetChatMutation();
  const [setContext] = useSetContextMutation();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (context) {
      setContext(context);
    }
  }, [context, setContext]);

  useEffect(() => {
    if (finalTranscript && finalTranscript.trim()) {
      handleSendMessage(finalTranscript);
      resetTranscript();
    }
  }, [finalTranscript]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpenModal = (modalType: 'reservation' | 'checkin' | 'checkout' | 'availability', data?: any) => {
    // Close the chat interface temporarily while modal is open
    // The main app will handle the modal display
    switch (modalType) {
      case 'reservation':
        onOpenModal('reservation', data);
        break;
      case 'checkin':
        onOpenModal('checkin', data);
        break;
      case 'checkout':
        onOpenModal('checkout', data);
        break;
      case 'availability':
        onOpenModal('availability', data);
        break;
      default:
        console.warn('Unknown modal type:', modalType);
        break;
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    try {
      const result = await sendMessage({
        message: textToSend,
        currentFormData,
        context
      }).unwrap();

      // Add AI response
      setMessages(prev => [...prev, result.chatMessage]);

      // Handle form filling if applicable
      if (result.response.shouldFillForm && result.response.extractedData) {
        if (onFormDataUpdate) {
          onFormDataUpdate(result.response.extractedData);
        }

        // Handle modal opening based on intent
        if (result.response.intent === 'reservation') {
          onOpenModal('reservation', result.response.extractedData);
        } else if (result.response.intent === 'checkin') {
          onOpenModal('checkin', result.response.extractedData);
        } else if (result.response.intent === 'checkout') {
          onOpenModal('checkout', result.response.extractedData);
        } else if (result.response.intent === 'availability') {
          onOpenModal('availability', result.response.extractedData);
        } else if (result.response.intent === 'search_reservation') {
          // Handle reservation search in chat - don't open modal
          // The AI response will contain the reservation details
        }
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + '_error',
        role: 'assistant',
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleResetChat = async () => {
    try {
      await resetChat().unwrap();
      setMessages([]);
      
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: "Hello! I'm your AI assistant for Lagunacreek Hotels. I can help you with reservations, check-ins, check-outs, and answer any questions about our services. How can I assist you today?",
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Failed to reset chat:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageIcon = (message: ChatMessage) => {
    if (message.role === 'assistant') {
      return (
        <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
          <SmartToy sx={{ fontSize: 16 }} />
        </Avatar>
      );
    }
    return (
      <Avatar sx={{ bgcolor: 'grey.300', width: 32, height: 32 }}>
        <Person sx={{ fontSize: 16 }} />
      </Avatar>
    );
  };

  const getMessageColor = (message: ChatMessage) => {
    return message.role === 'user' ? 'primary.main' : 'grey.100';
  };

  const getTextColor = (message: ChatMessage) => {
    return message.role === 'user' ? 'primary.contrastText' : 'text.primary';
  };

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: "Hello! I'm your AI assistant for Lagunacreek Hotels. I can help you with reservations, check-ins, check-outs, and answer any questions about our services. How can I assist you today?",
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
              <SmartToy sx={{ fontSize: 16 }} />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">
                AI Assistant
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Powered by Gemini AI
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
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
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              mb: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, maxWidth: '80%' }}>
              {message.role === 'assistant' && getMessageIcon(message)}
              
              <Box>
                <Paper
                  sx={{
                    p: 1.5,
                    bgcolor: getMessageColor(message),
                    color: getTextColor(message),
                    borderRadius: 2,
                    maxWidth: '100%'
                  }}
                >
                  <Typography variant="body2">{message.content}</Typography>
                  
                  {/* Show extracted data if available */}
                  {message.extractedData && Object.keys(message.extractedData).length > 0 && (
                    <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Extracted Information:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {Object.entries(message.extractedData).map(([key, value]) => (
                          <Chip
                            key={key}
                            label={`${key}: ${value}`}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                  
                  {/* Show form filled indicator */}
                  {message.formFilled && (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CheckCircle sx={{ fontSize: 14, color: 'success.main' }} />
                      <Typography variant="caption" color="success.main">
                        Form data updated
                      </Typography>
                    </Box>
                  )}
                </Paper>
                
                <Typography variant="caption" sx={{ opacity: 0.7, mt: 0.5, display: 'block' }}>
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
              
              {message.role === 'user' && getMessageIcon(message)}
            </Box>
          </Box>
        ))}
        
        {/* Processing indicator */}
        {isProcessing && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
                <SmartToy sx={{ fontSize: 16 }} />
              </Avatar>
              <Paper sx={{ p: 1.5, bgcolor: 'grey.100' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2">AI is thinking...</Typography>
                </Box>
              </Paper>
            </Box>
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Box>

      {/* Voice transcript display */}
      {(transcript || interimTranscript) && (
        <Fade in={true}>
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              {isListening ? 'Listening...' : 'Voice input:'}
            </Typography>
            <Typography variant="body2">
              {transcript}
              {interimTranscript && (
                <span style={{ opacity: 0.6, fontStyle: 'italic' }}>
                  {interimTranscript}
                </span>
              )}
            </Typography>
          </Box>
        </Fade>
      )}

      {/* Error display */}
      {(speechError || apiError) && (
        <Alert severity="error" sx={{ m: 2 }}>
          {speechError || 'Failed to process message. Please try again.'}
        </Alert>
      )}

      {/* Input Area */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <TextField
            fullWidth
            size="small"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message or use voice..."
            disabled={isProcessing}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Chip
                    label={context.replace('_', ' ').toUpperCase()}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </InputAdornment>
              ),
            }}
          />
          
          {/* Voice button */}
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
                  '0%': {
                    boxShadow: '0 0 0 0 rgba(244, 67, 54, 0.7)',
                  },
                  '70%': {
                    boxShadow: '0 0 0 10px rgba(244, 67, 54, 0)',
                  },
                  '100%': {
                    boxShadow: '0 0 0 0 rgba(244, 67, 54, 0)',
                  },
                },
              }}
            >
              {isListening ? <MicOff /> : <Mic />}
            </IconButton>
          )}
          
          {/* Send button */}
          <IconButton
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isProcessing}
            color="primary"
          >
            <Send />
          </IconButton>
        </Box>
        
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {speechSupported 
              ? 'Type or speak your message. AI responses include automatic speech.'
              : 'Type your message. Speech recognition not available.'
            }
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default AIChatbot;