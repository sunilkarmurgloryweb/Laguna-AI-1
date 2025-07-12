import React, { useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  Container,
  IconButton,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  SmartToy,
  Person,
  Mic,
  Send,
  CheckCircle,
  CalendarToday,
  People,
  Hotel as HotelIcon
} from '@mui/icons-material';
import { VoiceState } from '../types/reservation';

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

interface ChatInterfaceProps {
  messages: Message[];
  voiceState: VoiceState;
  isSupported: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onSendMessage: (message: string) => void;
  transcript: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  voiceState,
  isSupported,
  onStartListening,
  onStopListening,
  onSendMessage,
  transcript
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = React.useState('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const renderExtractedInfo = (info: Message['extractedInfo']) => {
    if (!info) return null;

    const infoItems = [];
    
    if (info.checkIn) {
      infoItems.push(
        <Chip
          key="checkin"
          icon={<CalendarToday />}
          label={`Check-in: ${info.checkIn}`}
          variant="outlined"
          color="success"
          size="small"
          sx={{ m: 0.5 }}
        />
      );
    }
    
    if (info.checkOut) {
      infoItems.push(
        <Chip
          key="checkout"
          icon={<CalendarToday />}
          label={`Check-out: ${info.checkOut}`}
          variant="outlined"
          color="success"
          size="small"
          sx={{ m: 0.5 }}
        />
      );
    }
    
    if (info.adults || info.children) {
      const guestText = `${info.adults || 0} adults${info.children ? `, ${info.children} children` : ''}`;
      infoItems.push(
        <Chip
          key="guests"
          icon={<People />}
          label={guestText}
          variant="outlined"
          color="success"
          size="small"
          sx={{ m: 0.5 }}
        />
      );
    }
    
    if (info.roomType) {
      infoItems.push(
        <Chip
          key="room"
          icon={<HotelIcon />}
          label={info.roomType}
          variant="outlined"
          color="success"
          size="small"
          sx={{ m: 0.5 }}
        />
      );
    }

    if (infoItems.length === 0) return null;

    return (
      <Box sx={{ mt: 2, p: 2, backgroundColor: '#f0f7ff', borderRadius: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Extracted Information:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {infoItems}
        </Box>
      </Box>
    );
  };

  const getVoiceButtonColor = () => {
    switch (voiceState) {
      case 'listening':
        return 'error';
      case 'processing':
        return 'primary';
      case 'speaking':
        return 'success';
      default:
        return 'inherit';
    }
  };

  const handleVoiceClick = () => {
    if (voiceState === 'listening') {
      onStopListening();
    } else if (voiceState === 'idle') {
      onStartListening();
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Container maxWidth="md" sx={{ flex: 1, display: 'flex', flexDirection: 'column', py: 2 }}>
        {/* Header */}
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 3 },
            mb: 2,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            color: 'white'
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
              <SmartToy />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Lagunacreek AI Assistant
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Voice-powered hotel reservations
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Messages Container */}
        <Paper
          elevation={3}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
            overflow: 'hidden',
            minHeight: { xs: '60vh', sm: '70vh' }
          }}
        >
          {/* Messages */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: { xs: 1, sm: 2 },
              backgroundColor: '#fafafa'
            }}
          >
            {messages.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  textAlign: 'center'
                }}
              >
                <Box>
                  <SmartToy sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Welcome to Lagunacreek
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start by saying "I want to book a room" or type your message below
                  </Typography>
                </Box>
              </Box>
            ) : (
              messages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                    mb: 2
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: { xs: '85%', sm: '70%' },
                      display: 'flex',
                      flexDirection: message.type === 'user' ? 'row-reverse' : 'row',
                      alignItems: 'flex-start',
                      gap: 1
                    }}
                  >
                    <Avatar
                      sx={{
                        width: { xs: 32, sm: 40 },
                        height: { xs: 32, sm: 40 },
                        bgcolor: message.type === 'user' ? '#1976d2' : '#757575'
                      }}
                    >
                      {message.type === 'user' ? <Person /> : <SmartToy />}
                    </Avatar>
                    
                    <Box sx={{ flex: 1 }}>
                      <Paper
                        elevation={1}
                        sx={{
                          p: { xs: 1.5, sm: 2 },
                          borderRadius: 2,
                          backgroundColor: message.type === 'user' ? '#1976d2' : 'white',
                          color: message.type === 'user' ? 'white' : 'text.primary',
                          borderTopLeftRadius: message.type === 'user' ? 2 : 0.5,
                          borderTopRightRadius: message.type === 'user' ? 0.5 : 2
                        }}
                      >
                        <Typography
                          variant="body1"
                          sx={{
                            fontSize: { xs: '0.875rem', sm: '1rem' },
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap'
                          }}
                        >
                          {message.content}
                        </Typography>
                        
                        {message.type === 'ai' && renderExtractedInfo(message.extractedInfo)}
                      </Paper>
                      
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: 'block',
                          mt: 0.5,
                          textAlign: message.type === 'user' ? 'right' : 'left',
                          fontSize: { xs: '0.75rem', sm: '0.8rem' }
                        }}
                      >
                        {formatTime(message.timestamp)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))
            )}
            
            {/* Typing indicator */}
            {voiceState === 'processing' && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: '#757575' }}>
                    <SmartToy />
                  </Avatar>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: 'white',
                      borderTopLeftRadius: 0.5
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {[0, 1, 2].map((i) => (
                        <Box
                          key={i}
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: '#1976d2',
                            animation: 'pulse 1.4s ease-in-out infinite',
                            animationDelay: `${i * 0.2}s`,
                            '@keyframes pulse': {
                              '0%, 80%, 100%': { opacity: 0.3 },
                              '40%': { opacity: 1 }
                            }
                          }}
                        />
                      ))}
                    </Box>
                  </Paper>
                </Box>
              </Box>
            )}
            
            <div ref={messagesEndRef} />
          </Box>

          {/* Input Area */}
          <Box
            sx={{
              p: { xs: 1.5, sm: 2 },
              backgroundColor: 'white',
              borderTop: '1px solid #e0e0e0'
            }}
          >
            {transcript && (
              <Box
                sx={{
                  mb: 1,
                  p: 1.5,
                  backgroundColor: '#e3f2fd',
                  borderRadius: 1,
                  border: '1px solid #2196f3'
                }}
              >
                <Typography variant="body2" color="primary.main" gutterBottom>
                  Voice Input:
                </Typography>
                <Typography variant="body2" fontStyle="italic">
                  "{transcript}"
                </Typography>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
              <TextField
                fullWidth
                multiline
                maxRows={3}
                placeholder="Type your message or use voice..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={voiceState === 'processing' || voiceState === 'speaking'}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || voiceState === 'processing' || voiceState === 'speaking'}
                        color="primary"
                        size="small"
                      >
                        <Send />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              
              {isSupported && (
                <IconButton
                  onClick={handleVoiceClick}
                  disabled={voiceState === 'processing' || voiceState === 'speaking'}
                  color={getVoiceButtonColor()}
                  sx={{
                    width: { xs: 48, sm: 56 },
                    height: { xs: 48, sm: 56 },
                    borderRadius: 2,
                    backgroundColor: voiceState === 'listening' ? 'error.light' : 'grey.100',
                    animation: voiceState === 'listening' ? 'pulse 1.5s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(1)', opacity: 1 },
                      '50%': { transform: 'scale(1.05)', opacity: 0.8 },
                      '100%': { transform: 'scale(1)', opacity: 1 }
                    }
                  }}
                >
                  <Mic />
                </IconButton>
              )}
            </Box>
            
            {/* Voice Status */}
            {voiceState !== 'idle' && (
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography
                  variant="caption"
                  color={
                    voiceState === 'listening' ? 'error.main' :
                    voiceState === 'processing' ? 'primary.main' :
                    voiceState === 'speaking' ? 'success.main' : 'text.secondary'
                  }
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}
                >
                  {voiceState === 'listening' && '🎤 Listening...'}
                  {voiceState === 'processing' && '⚡ Processing...'}
                  {voiceState === 'speaking' && '🔊 Speaking...'}
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ChatInterface;