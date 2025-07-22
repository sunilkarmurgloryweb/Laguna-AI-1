import React from 'react';
import {
  Box,
  Avatar,
  Typography,
  Select,
  MenuItem,
  FormControl,
  Chip,
  Tooltip,
  IconButton,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Psychology as AIIcon,
export { useChatLogic } from './useChatLogic';
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { languageConfigs } from '../services/multilingualAIService';

interface ChatHeaderProps {
  currentLanguage: string;
  isListening: boolean;
  isSpeechEnabled: boolean;
  availableLanguages: Array<{code: string, name: string, flag: string}>;
  onLanguageChange: (language: string) => void;
  onToggleSpeech: () => void;
  onMinimize?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  currentLanguage,
  isListening,
  isSpeechEnabled,
  availableLanguages,
  onLanguageChange,
  onToggleSpeech,
  onMinimize
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
        color: 'white',
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: 'white', color: 'primary.main', width: 32, height: 32 }}>
          <AIIcon />
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">
            AI Assistant
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            {languageConfigs[currentLanguage]?.flag} {languageConfigs[currentLanguage]?.name} • Powered by Gemini AI
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Language Selector */}
        <FormControl size="small" sx={{ minWidth: 80 }}>
          <Select
            value={currentLanguage}
            onChange={(e) => onLanguageChange(e.target.value)}
            sx={{
              color: 'white',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.3)'
              },
              '& .MuiSvgIcon-root': {
                color: 'white'
              }
            }}
          >
            {availableLanguages.map((lang) => (
              <MenuItem key={lang.code} value={lang.code}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography>{lang.flag}</Typography>
                  <Typography variant="caption">{lang.code.toUpperCase()}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Speech Status */}
        {isListening && (
          <Chip
            label="Listening..."
            size="small"
            sx={{
              bgcolor: 'error.main',
              color: 'white',
              animation: 'pulse 1.5s infinite'
            }}
          />
        )}

        {/* Speech Toggle */}
        <Tooltip title={isSpeechEnabled ? 'Disable Speech' : 'Enable Speech'}>
          <IconButton onClick={onToggleSpeech} sx={{ color: 'white' }}>
            {isSpeechEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
          </IconButton>
        </Tooltip>

        {/* Minimize Button */}
        {!isMobile && onMinimize && (
          <Tooltip title="Minimize">
            <IconButton onClick={onMinimize} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

export default ChatHeader;