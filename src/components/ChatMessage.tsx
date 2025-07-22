import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  Fade
} from '@mui/material';
import {
  Psychology as AIIcon,
  Person as PersonIcon,
  Language as LanguageIcon
} from '@mui/icons-material';
import { languageConfigs } from '../services/multilingualAIService';
import ProcessCompletionMessage from './ProcessCompletionMessage';

interface ChatMessageProps {
  message: {
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
  };
  currentLanguage: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, currentLanguage }) => {
  return (
    <Fade in={true}>
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
          {message.role === 'assistant' && message.isProcessCompletion && (
            <ProcessCompletionMessage
              processType={message.processType!}
              confirmationData={message.confirmationData}
              timestamp={message.timestamp}
              language={message.language || currentLanguage}
            />
          )}

          {/* Regular Message */}
          {!message.isProcessCompletion && (
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
  );
};

export default ChatMessage;