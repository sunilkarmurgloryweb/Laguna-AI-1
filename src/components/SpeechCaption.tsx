import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Fade,
  LinearProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  VolumeUp,
  VolumeOff
} from '@mui/icons-material';

interface SpeechCaptionProps {
  isVisible: boolean;
  text: string;
  isPlaying: boolean;
  onToggleSound?: () => void;
  isSoundEnabled?: boolean;
}

const SpeechCaption: React.FC<SpeechCaptionProps> = ({
  isVisible,
  text,
  isPlaying,
  onToggleSound,
  isSoundEnabled = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Typewriter effect for the caption
  useEffect(() => {
    if (isVisible && text && isPlaying) {
      setDisplayText('');
      setCurrentIndex(0);
      
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          if (prevIndex < text.length) {
            setDisplayText(text.substring(0, prevIndex + 1));
            return prevIndex + 1;
          } else {
            clearInterval(interval);
            return prevIndex;
          }
        });
      }, 50); // Adjust speed as needed

      return () => clearInterval(interval);
    } else if (!isPlaying) {
      setDisplayText(text);
      setCurrentIndex(text.length);
    }
  }, [isVisible, text, isPlaying]);

  if (!isVisible || !text) {
    return null;
  }

  return (
    <Fade in={isVisible}>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: { xs: 16, md: 24 },
          left: { xs: 16, md: 24 },
          right: { xs: 16, md: 24 },
          zIndex: 1400,
          bgcolor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          borderRadius: 2,
          overflow: 'hidden',
          maxWidth: { xs: 'calc(100vw - 32px)', md: '600px' },
          mx: 'auto'
        }}
      >
        {/* Progress bar for speech */}
        {isPlaying && (
          <LinearProgress
            sx={{
              height: 2,
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'primary.main'
              }
            }}
          />
        )}
        
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            {/* AI Speaking Indicator */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              minWidth: 'fit-content'
            }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: isPlaying ? 'success.main' : 'grey.500',
                  animation: isPlaying ? 'pulse 1.5s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                    '100%': { opacity: 1 }
                  }
                }}
              />
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'grey.300',
                  fontSize: { xs: '0.7rem', md: '0.75rem' }
                }}
              >
                AI {isPlaying ? 'Speaking' : 'Ready'}
              </Typography>
            </Box>

            {/* Sound Toggle */}
            {onToggleSound && (
              <Box
                onClick={onToggleSound}
                sx={{
                  cursor: 'pointer',
                  p: 0.5,
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                {isSoundEnabled ? (
                  <VolumeUp sx={{ fontSize: 16, color: 'grey.300' }} />
                ) : (
                  <VolumeOff sx={{ fontSize: 16, color: 'grey.500' }} />
                )}
              </Box>
            )}
          </Box>

          {/* Caption Text */}
          <Typography
            variant="body1"
            sx={{
              mt: 1,
              fontSize: { xs: '0.9rem', md: '1rem' },
              lineHeight: 1.4,
              fontFamily: 'monospace',
              minHeight: '1.4em'
            }}
          >
            {displayText}
            {isPlaying && currentIndex < text.length && (
              <Box
                component="span"
                sx={{
                  display: 'inline-block',
                  width: 2,
                  height: '1em',
                  bgcolor: 'primary.main',
                  ml: 0.5,
                  animation: 'blink 1s infinite',
                  '@keyframes blink': {
                    '0%, 50%': { opacity: 1 },
                    '51%, 100%': { opacity: 0 }
                  }
                }}
              />
            )}
          </Typography>

          {/* Word count indicator for long text */}
          {text.length > 100 && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 1,
                color: 'grey.400',
                fontSize: '0.7rem'
              }}
            >
              {displayText.length} / {text.length} characters
            </Typography>
          )}
        </Box>
      </Paper>
    </Fade>
  );
};

export default SpeechCaption;