import React from 'react';
import {
  Box,
  Paper,
  Avatar,
  CircularProgress,
  Typography
} from '@mui/material';
import {
  Psychology as AIIcon
} from '@mui/icons-material';
import { languageConfigs } from '../services/multilingualAIService';
import ChatMessage from './ChatMessage';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  text: string;
  timestamp: Date;
  language?: string;
  isUser: boolean;
  extractedData?: Record<string, any>;
  isProcessCompletion?: boolean;
  processType?: 'reservation' | 'checkin' | 'checkout';
  confirmationData?: any;
}

interface ChatMessagesProps {
  messages: Message[];
  isProcessing: boolean;
  transcript?: string;
  detectedLanguage: string;
  currentLanguage: string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isProcessing,
  transcript,
  detectedLanguage,
  currentLanguage,
  messagesEndRef
}) => {
  return (
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
        <ChatMessage
          key={message.id}
          message={message}
          currentLanguage={currentLanguage}
        />
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
  );
};

export default ChatMessages;