import React, { useEffect, useState } from 'react';
import {
  IconButton,
  Tooltip,
  Box,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Fade,
  Paper
} from '@mui/material';
import {
  Mic,
  MicOff,
  VolumeUp,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useProcessVoiceInputMutation } from '../store/api/geminiApi';

export interface VoiceInputProps {
  onTranscriptChange?: (transcript: string, isInterim: boolean) => void;
  onVoiceProcessed?: (data: any) => void;
  language?: string;
  currentStep?: string;
  reservationData?: any;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  showTranscript?: boolean;
  autoProcess?: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscriptChange,
  onVoiceProcessed,
  language = 'en-US',
  currentStep = 'welcome',
  reservationData = {},
  disabled = false,
  size = 'medium',
  showTranscript = true,
  autoProcess = true
}) => {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  
  const {
    isListening,
    transcript,
    interimTranscript,
    finalTranscript,
    isSupported,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition(language, false, true);

  const [processVoiceInput, { 
    isLoading: isProcessing, 
    error: apiError,
    isSuccess,
    isError
  }] = useProcessVoiceInputMutation();

  // Handle transcript changes
  useEffect(() => {
    if (onTranscriptChange) {
      onTranscriptChange(transcript, !!interimTranscript);
    }
  }, [transcript, interimTranscript, onTranscriptChange]);

  // Auto-process final transcript
  useEffect(() => {
    if (finalTranscript && autoProcess && !isProcessing) {
      handleProcessVoice(finalTranscript);
    }
  }, [finalTranscript, autoProcess, isProcessing]);

  const handleProcessVoice = async (text: string) => {
    if (!text.trim()) return;

    try {
      const result = await processVoiceInput({
        text,
        currentStep,
        reservationData,
        language,
        context: `Processing voice input for ${currentStep} step`
      }).unwrap();

      if (onVoiceProcessed) {
        onVoiceProcessed(result);
      }

      // Speak the response
      if (result.response && 'speechSynthesis' in window) {
        setIsSpeaking(true);
        const utterance = new SpeechSynthesisUtterance(result.response);
        utterance.lang = language;
        utterance.rate = 0.9;
        utterance.pitch = 1;
        
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('Voice processing error:', error);
      
      // Show error feedback to user
      if (onVoiceProcessed) {
        onVoiceProcessed({
          intent: 'error',
          confidence: 0,
          entities: {},
          response: 'Sorry, I had trouble processing that. Please try again.',
          extractedData: {},
          suggestions: ['Try speaking more clearly', 'Check your internet connection']
        });
      }
    }
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small': return 20;
      case 'large': return 32;
      default: return 24;
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'small': return 'small' as const;
      case 'large': return 'large' as const;
      default: return 'medium' as const;
    }
  };

  const getIcon = () => {
    if (isProcessing) {
      return <CircularProgress size={getIconSize()} color="primary" />;
    }
    if (isSpeaking) {
      return <VolumeUp sx={{ fontSize: getIconSize() }} />;
    }
    if (isListening) {
      return <Mic sx={{ fontSize: getIconSize() }} />;
    }
    return <MicOff sx={{ fontSize: getIconSize() }} />;
  };

  const getButtonColor = () => {
    if (isError) return 'error';
    if (isSuccess) return 'success';
    if (isProcessing) return 'primary';
    if (isSpeaking) return 'success';
    if (isListening) return 'error';
    return 'default';
  };

  const getTooltipText = () => {
    if (!isSupported) return 'Speech recognition not supported';
    if (disabled) return 'Voice input disabled';
    if (isError) return 'Error processing voice - click to retry';
    if (isProcessing) return 'Processing speech...';
    if (isSpeaking) return 'AI is speaking...';
    if (isListening) return 'Listening... Click to stop';
    return 'Click to start voice input';
  };

  const getStatusText = () => {
    if (isError) return 'Error - Retry';
    if (isSuccess) return 'Success!';
    if (isProcessing) return 'Processing...';
    if (isSpeaking) return 'AI Speaking...';
    if (isListening) return 'Listening...';
    return 'Tap to speak';
  };

  if (!isSupported) {
    return (
      <Alert severity="warning" icon={<ErrorIcon />}>
        Speech recognition is not supported in your browser.
      </Alert>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      {/* Voice Button */}
      <Tooltip title={getTooltipText()}>
        <span>
          <IconButton
            onClick={handleToggleListening}
            disabled={disabled || isProcessing || isSpeaking}
            color={getButtonColor()}
            size={getButtonSize()}
            sx={{
              width: size === 'large' ? 64 : size === 'small' ? 40 : 56,
              height: size === 'large' ? 64 : size === 'small' ? 40 : 56,
              backgroundColor: isListening ? 'error.light' : 'action.hover',
              '&:hover': {
                backgroundColor: isListening ? 'error.main' : 'action.selected',
              },
              '&.Mui-disabled': {
                backgroundColor: 'action.disabledBackground',
              },
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
            {getIcon()}
          </IconButton>
        </span>
      </Tooltip>

      {/* Status Text */}
      <Typography variant="caption" color="text.secondary" fontWeight="medium">
        {getStatusText()}
      </Typography>

      {/* Language Indicator */}
      <Chip
        label={language.split('-')[0].toUpperCase()}
        size="small"
        variant="outlined"
        color="primary"
      />

      {/* Transcript Display */}
      {showTranscript && (transcript || interimTranscript) && (
        <Fade in={true}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              maxWidth: 400,
              backgroundColor: 'background.paper',
              border: 1,
              borderColor: 'divider',
            }}
          >
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {isListening ? 'Listening...' : 'Last heard:'}
            </Typography>
            <Typography variant="body1">
              {finalTranscript}
              {interimTranscript && (
                <span style={{ opacity: 0.6, fontStyle: 'italic' }}>
                  {interimTranscript}
                </span>
              )}
            </Typography>
          </Paper>
        </Fade>
      )}

      {/* Error Display */}
      {(speechError || (apiError && 'message' in apiError)) && (
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          {speechError || (apiError as any)?.message || 'Failed to process voice input. Please try again.'}
        </Alert>
      )}
    </Box>
  );
};

export default VoiceInput;