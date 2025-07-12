import React from 'react';
import { 
  IconButton,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Mic,
  MicOff,
  VolumeUp,
  Warning as WarningIcon
} from '@mui/icons-material';
import { VoiceState } from '../types/reservation';
import { useAppSelector } from '../hooks/useAppSelector';
import AIStatusIndicator from './AIStatusIndicator';

interface VoiceIndicatorProps {
  voiceState: VoiceState;
  isSupported: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  showAIStatus?: boolean;
  aiProcessing?: boolean;
  aiConfidence?: number;
  aiError?: string;
}

const VoiceIndicator: React.FC<VoiceIndicatorProps> = ({
  voiceState,
  isSupported,
  onStartListening,
  onStopListening,
  showAIStatus = true,
  aiProcessing = false,
  aiConfidence = 0,
  aiError
}) => {
  const { lastError } = useAppSelector((state) => state.voice);

  const getIcon = () => {
    switch (voiceState) {
      case 'listening':
        return <Mic sx={{ fontSize: 32 }} />;
      case 'processing':
        return <CircularProgress size={32} color="primary" />;
      case 'speaking':
        return <VolumeUp sx={{ fontSize: 32 }} />;
      default:
        return <MicOff sx={{ fontSize: 32 }} />;
    }
  };

  const getStatusText = () => {
    switch (voiceState) {
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Processing...';
      case 'speaking':
        return 'Speaking...';
      default:
        return 'Tap to speak';
    }
  };

  const getButtonColor = () => {
    switch (voiceState) {
      case 'listening':
        return 'error';
      case 'processing':
        return 'primary';
      case 'speaking':
        return 'success';
      default:
        return 'default';
    }
  };

  const handleClick = () => {
    if (voiceState === 'listening') {
      onStopListening();
    } else if (voiceState === 'idle') {
      onStartListening();
    }
  };

  if (!isSupported) {
    return (
      <Alert severity="warning" icon={<WarningIcon />} sx={{ maxWidth: 400 }}>
        Voice recognition is not supported in your browser.
      </Alert>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      {showAIStatus && (
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <AIStatusIndicator
            isProcessing={aiProcessing || voiceState === 'processing'}
            confidence={aiConfidence}
            error={aiError}
          />
        </Box>
      )}
      
      <Tooltip title={getStatusText()}>
        <IconButton
          onClick={handleClick}
          disabled={voiceState === 'processing' || voiceState === 'speaking'}
          color={getButtonColor() as any}
          sx={{
            width: 80,
            height: 80,
            backgroundColor: voiceState === 'listening' ? 'error.light' : 'action.hover',
            '&:hover': {
              backgroundColor: voiceState === 'listening' ? 'error.main' : 'action.selected',
            },
            '&.Mui-disabled': {
              backgroundColor: 'action.disabledBackground',
            },
            animation: voiceState === 'listening' ? 'pulse 1.5s infinite' : 'none',
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
          {getIcon()}
        </IconButton>
      </Tooltip>
      
      <Typography variant="body2" color="text.secondary" fontWeight="medium">
        {getStatusText()}
      </Typography>
      
      {voiceState === 'processing' && (
        <Typography variant="caption" color="primary.main" sx={{ animation: 'pulse 1.5s infinite' }}>
          🤖 AI is analyzing your request...
        </Typography>
      )}
      
      {lastError && (
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WarningIcon sx={{ mr: 1 }} />
            <Typography variant="body2">
              {lastError}
            </Typography>
          </Box>
        </Alert>
      )}
    </Box>
  );
};

export default VoiceIndicator;