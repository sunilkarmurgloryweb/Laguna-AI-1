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
      </Paper>
    </Fade>
  );
};

export default SpeechCaption;