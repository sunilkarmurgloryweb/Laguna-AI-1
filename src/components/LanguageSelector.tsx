import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Close,
  Language as LanguageIcon
} from '@mui/icons-material';
import { multilingualAI } from '../services/multilingualAIService';

interface LanguageSelectorProps {
  currentLanguage: string;
  onLanguageSelect: (language: string) => void;
  onClose: () => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  currentLanguage,
  onLanguageSelect, 
  onClose 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸', subtitle: 'Press or say 1' },
    { code: 'es', name: 'Español', flag: '🇪🇸', subtitle: 'Press or say 2' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳', subtitle: 'Press or say 3' },
    { code: 'fr', name: 'Français', flag: '🇫🇷', subtitle: 'Press or say 4' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪', subtitle: 'Press or say 5' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹', subtitle: 'Press or say 6' },
    { code: 'pt', name: 'Português', flag: '🇵🇹', subtitle: 'Press or say 7' },
    { code: 'ja', name: '日本語', flag: '🇯🇵', subtitle: 'Press or say 8' },
    { code: 'ko', name: '한국어', flag: '🇰🇷', subtitle: 'Press or say 9' },
    { code: 'zh', name: '中文', flag: '🇨🇳', subtitle: 'Press or say 0' }
  ];

  const handleLanguageSelect = (languageCode: string) => {
    onLanguageSelect(languageCode);
  };

  return (
    <Dialog 
      open={true} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          m: isMobile ? 0 : 2
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LanguageIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Select Language
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          Choose your preferred language for the AI assistant
        </Typography>
        
        {/* Language Options */}
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {languages.map((language) => (
            <Grid size={{ xs: 6, sm: 4, md: 3 }} key={language.code}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: currentLanguage === language.code ? 2 : 1,
                  borderColor: currentLanguage === language.code ? 'primary.main' : 'divider',
                  bgcolor: currentLanguage === language.code ? 'primary.light' : 'background.paper',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                    boxShadow: 2
                  }
                }}
                onClick={() => handleLanguageSelect(language.code)}
              >
                <CardContent sx={{ 
                  textAlign: 'center', 
                  p: { xs: 2, sm: 3 },
                  '&:last-child': { pb: { xs: 2, sm: 3 } }
                }}>
                  <Typography 
                    variant="h3" 
                    sx={{ 
                      mb: 1,
                      fontSize: { xs: '2rem', sm: '3rem' }
                    }}
                  >
                    {language.flag}
                  </Typography>
                  <Typography 
                    variant="h6" 
                    fontWeight="bold" 
                    sx={{ 
                      mb: 0.5,
                      fontSize: { xs: '1rem', sm: '1.25rem' },
                      color: currentLanguage === language.code ? 'primary.main' : 'text.primary'
                    }}
                  >
                    {language.name}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                  >
                    {language.subtitle}
                  </Typography>
                  {currentLanguage === language.code && (
                    <Box sx={{ mt: 1 }}>
                      <Typography 
                        variant="caption" 
                        color="primary.main" 
                        fontWeight="bold"
                        sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                      >
                        ✓ Selected
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        {/* Footer */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            You can also use voice commands: "1 for English", "2 for Spanish", etc.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: { xs: 2, sm: 3 }, justifyContent: 'center' }}>
        <Button onClick={onClose} size="large">
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={onClose} 
          size="large"
          disabled={!currentLanguage}
        >
          Confirm Selection
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LanguageSelector;