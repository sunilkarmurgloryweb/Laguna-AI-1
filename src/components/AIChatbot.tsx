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
  Divider
} from '@mui/material';
import {
  Mic,
  MicOff,
  Send,
  SmartToy,
  Person,
  Language,
  VolumeUp
} from '@mui/icons-material';
import { multilingualAI } from '../services/multilingualAIService';
import voiceReservationService from '../services/voiceReservationService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  language?: string;
  data?: any;
}

interface AIChatbotProps {
  onOpenModal: (modalType: 'reservation' | 'checkin' | 'checkout' | 'availability', data?: any) => void;
}

const AIChatbot: React.FC<AIChatbotProps> = ({ onOpenModal }) => {
  const [showLanguageSelector, setShowLanguageSelector] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const availableLanguages = [
    { code: 'en', name: 'English', flag: '🇺🇸', description: 'English - Voice & Text Support' },
    { code: 'es', name: 'Español', flag: '🇪🇸', description: 'Español - Soporte de voz y texto' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳', description: 'हिंदी - आवाज और पाठ समर्थन' },
    { code: 'fr', name: 'Français', flag: '🇫🇷', description: 'Français - Support vocal et textuel' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪', description: 'Deutsch - Sprach- und Textunterstützung' }
  ];

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = getLanguageCode(currentLanguage);
      
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleVoiceInput(transcript);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, [currentLanguage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getLanguageCode = (lang: string) => {
    const codes: { [key: string]: string } = {
      'en': 'en-US',
      'es': 'es-ES',
      'hi': 'hi-IN',
      'fr': 'fr-FR',
      'de': 'de-DE'
    };
    return codes[lang] || 'en-US';
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLanguageSelect = async (languageCode: string) => {
    setCurrentLanguage(languageCode);
    multilingualAI.setLanguage(languageCode);
    setShowLanguageSelector(false);
    
    if (recognition) {
      recognition.lang = getLanguageCode(languageCode);
    }
    
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      text: multilingualAI.getGreeting('welcome'),
      sender: 'ai',
      timestamp: new Date(),
      language: languageCode
    };
    setMessages([welcomeMessage]);
    
    await multilingualAI.speak(welcomeMessage.text, languageCode);
  };

  const handleVoiceInput = async (transcript: string) => {
    // Robust validation for transcript
    if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
      console.warn('Invalid transcript received:', transcript);
      return;
    }

    const detectedLanguage = multilingualAI.detectLanguageFromText(transcript);
    if (detectedLanguage !== currentLanguage) {
      setCurrentLanguage(detectedLanguage);
      multilingualAI.setLanguage(detectedLanguage);
      
      const languageInfo = multilingualAI.getLanguageInfo(detectedLanguage);
      const switchMessage: Message = {
        id: Date.now().toString() + '_lang_switch',
        text: `Language switched to ${languageInfo.name} ${languageInfo.flag}`,
        sender: 'ai',
        timestamp: new Date(),
        language: detectedLanguage
      };
      setMessages(prev => [...prev, switchMessage]);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: transcript,
      sender: 'user',
      timestamp: new Date(),
      language: detectedLanguage
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      setIsProcessing(true);
      
      const response = await voiceReservationService.processVoiceCommand(
        transcript,
        currentLanguage,
        onOpenModal,
        detectedLanguage
      );

      const aiMessage: Message = {
        id: Date.now().toString() + '_ai',
        text: response,
        sender: 'ai',
        timestamp: new Date(),
        language: detectedLanguage
      };
      setMessages(prev => [...prev, aiMessage]);

      await multilingualAI.speak(response, detectedLanguage);
      
    } catch (error) {
      console.error('Voice processing error:', error);
      const errorMessage: Message = {
        id: Date.now().toString() + '_error',
        text: multilingualAI.getResponse('error', {}, detectedLanguage),
        sender: 'ai',
        timestamp: new Date(),
        language: detectedLanguage
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const startVoiceRecognition = () => {
    if (recognition && !isListening) {
      setIsListening(true);
      recognition.start();
    }
  };

  const stopVoiceRecognition = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  };

  const handleTextInput = async (text: string) => {
    if (!text.trim()) return;

    const detectedLanguage = multilingualAI.detectLanguageFromText(text);
    if (detectedLanguage !== currentLanguage) {
      setCurrentLanguage(detectedLanguage);
      multilingualAI.setLanguage(detectedLanguage);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text,
      sender: 'user',
      timestamp: new Date(),
      language: detectedLanguage
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      setIsProcessing(true);
      
      const response = await voiceReservationService.processVoiceCommand(
        text,
        currentLanguage,
        onOpenModal,
        detectedLanguage
      );

      const aiMessage: Message = {
        id: Date.now().toString() + '_ai',
        text: response,
        sender: 'ai',
        timestamp: new Date(),
        language: detectedLanguage
      };
      setMessages(prev => [...prev, aiMessage]);

      await multilingualAI.speak(response, detectedLanguage);
      
    } catch (error) {
      console.error('Text processing error:', error);
      const errorMessage: Message = {
        id: Date.now().toString() + '_error',
        text: multilingualAI.getResponse('error', {}, detectedLanguage),
        sender: 'ai',
        timestamp: new Date(),
        language: detectedLanguage
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = () => {
    if (inputText.trim()) {
      handleTextInput(inputText);
      setInputText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (showLanguageSelector) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Avatar sx={{ bgcolor: 'primary.light', width: 64, height: 64, mx: 'auto', mb: 2 }}>
            <Language sx={{ fontSize: 32 }} />
          </Avatar>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Choose Language
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select your preferred language
          </Typography>
        </Box>

        <List sx={{ flex: 1 }}>
          {availableLanguages.map((lang) => (
            <ListItem
              key={lang.code}
              component={Paper}
              sx={{ 
                mb: 1, 
                cursor: 'pointer',
                '&:hover': { bgcolor: 'primary.light', color: 'primary.contrastText' }
              }}
              onClick={() => handleLanguageSelect(lang.code)}
            >
              <ListItemAvatar>
                <Typography variant="h5">{lang.flag}</Typography>
              </ListItemAvatar>
              <ListItemText
                primary={lang.name}
                secondary={lang.description}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Messages */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
              mb: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, maxWidth: '80%' }}>
              {message.sender === 'ai' && (
                <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
                  <SmartToy sx={{ fontSize: 16 }} />
                </Avatar>
              )}
              <Paper
                sx={{
                  p: 1.5,
                  bgcolor: message.sender === 'user' ? 'primary.main' : 'grey.100',
                  color: message.sender === 'user' ? 'primary.contrastText' : 'text.primary'
                }}
              >
                <Typography variant="body2">{message.text}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                  {message.language && message.language !== 'en' && (
                    <Typography variant="caption">
                      {availableLanguages.find(l => l.code === message.language)?.flag}
                    </Typography>
                  )}
                </Box>
              </Paper>
              {message.sender === 'user' && (
                <Avatar sx={{ bgcolor: 'grey.300', width: 32, height: 32 }}>
                  <Person sx={{ fontSize: 16 }} />
                </Avatar>
              )}
            </Box>
          </Box>
        ))}
        {isProcessing && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
                <SmartToy sx={{ fontSize: 16 }} />
              </Avatar>
              <Paper sx={{ p: 1.5, bgcolor: 'grey.100' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2">Processing...</Typography>
                </Box>
              </Paper>
            </Box>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <TextField
            fullWidth
            size="small"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message or use voice..."
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Chip
                    label={availableLanguages.find(l => l.code === currentLanguage)?.flag}
                    size="small"
                  />
                </InputAdornment>
              ),
            }}
          />
          <IconButton
            onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
            disabled={isProcessing}
            color={isListening ? 'error' : 'default'}
            sx={{ 
              bgcolor: isListening ? 'error.light' : 'grey.200',
              '&:hover': { bgcolor: isListening ? 'error.main' : 'grey.300' }
            }}
          >
            {isListening ? <MicOff /> : <Mic />}
          </IconButton>
          <IconButton
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isProcessing}
            color="primary"
          >
            <Send />
          </IconButton>
        </Box>
        
        <Box sx={{ textAlign: 'center' }}>
          <Button
            size="small"
            startIcon={<Language />}
            onClick={() => setShowLanguageSelector(true)}
            sx={{ textTransform: 'none' }}
          >
            Change Language
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default AIChatbot;