import React from 'react';
import { 
  Mic, 
  MicOff, 
  VolumeUp, 
  Warning 
} from '@mui/icons-material';
import { 
  Box, 
  Button, 
  Typography, 
  Alert,
  CircularProgress 
} from '@mui/material';
import { VoiceState } from '../types/reservation';
import { useAppSelector } from '../hooks/useAppSelector';

interface VoiceIndicatorProps {
  voiceState: VoiceState;
  isSupported: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
}

const VoiceIndicator: React.FC<VoiceIndicatorProps> = ({
  voiceState,
  isSupported,
  onStartListening,
  onStopListening
}) => {
  const { lastError } = useAppSelector((state) => state.voice);

  const getIcon = () => {
    switch (voiceState) {
      case 'listening':
        return <Mic sx={{ fontSize: 32, color: 'error.main' }} />;
      case 'processing':
        return <CircularProgress size={32} color="primary" />;
      case 'speaking':
        return <VolumeUp sx={{ fontSize: 32, color: 'success.main' }} />;
      default:
        return <MicOff sx={{ fontSize: 32, color: 'grey.500' }} />;
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
        return 'inherit';
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
      <Box 
        sx={{ 
          p: 2,
          maxWidth: { xs: '100%', sm: 400 },
          mx: 'auto'
        }}
      >
        <Alert 
          severity="warning" 
          icon={<Warning />}
          sx={{ 
            borderRadius: 2,
            '& .MuiAlert-message': {
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }
          }}
        >
          Voice recognition is not supported in your browser.
        </Alert>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: 3,
        p: 2,
        maxWidth: { xs: '100%', sm: 400 },
        mx: 'auto'
      }}
    >
      <Button
        onClick={handleClick}
        disabled={voiceState === 'processing' || voiceState === 'speaking'}
        color={getButtonColor()}
        variant="contained"
        sx={{
          width: { xs: 70, sm: 80 },
          height: { xs: 70, sm: 80 },
          borderRadius: '50%',
          minWidth: 'unset',
          animation: voiceState === 'listening' ? 'pulse 1.5s infinite' : 'none',
          '@keyframes pulse': {
            '0%': {
              transform: 'scale(1)',
              opacity: 1,
            },
            '50%': {
              transform: 'scale(1.05)',
              opacity: 0.8,
            },
            '100%': {
              transform: 'scale(1)',
              opacity: 1,
            },
          },
          '&:disabled': {
            opacity: 0.5,
          },
          transition: 'all 0.2s ease-in-out',
        }}
      >
        {getIcon()}
      </Button>
      
      <Typography 
        variant="body2" 
        color="text.secondary" 
        fontWeight="medium"
        sx={{ 
          fontSize: { xs: '0.875rem', sm: '1rem' },
          textAlign: 'center'
        }}
      >
        {getStatusText()}
      </Typography>
      
      {lastError && (
        <Box sx={{ maxWidth: { xs: '100%', sm: 300 } }}>
          <Alert 
            severity="error" 
            icon={<Warning />}
            sx={{ 
              borderRadius: 2,
              '& .MuiAlert-message': {
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                textAlign: 'center'
              }
            }}
          >
            {lastError}
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default VoiceIndicator;