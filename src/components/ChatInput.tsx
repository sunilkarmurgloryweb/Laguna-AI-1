import React from 'react';
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material';
import {
  Send as SendIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon
} from '@mui/icons-material';

interface ChatInputProps {
  inputText: string;
  isProcessing: boolean;
  isListening: boolean;
  speechSupported: boolean;
  speechError?: string | null;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onToggleVoiceInput: () => void;
  onKeyPress: (event: React.KeyboardEvent) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  inputText,
  isProcessing,
  isListening,
  speechSupported,
  speechError,
  onInputChange,
  onSendMessage,
  onToggleVoiceInput,
  onKeyPress
}) => {
  return (
    <>
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
          onChange={(e) => onInputChange(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder="Type your message in any language or use voice..."
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
              onClick={onToggleVoiceInput}
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
            onClick={onSendMessage}
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
    </>
  );
};

export default ChatInput;