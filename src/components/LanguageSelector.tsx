import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Avatar,
  Container,
  Paper
} from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';
import { Language } from '../types/reservation';

interface LanguageSelectorProps {
  onLanguageSelect: (language: Language) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onLanguageSelect }) => {
  const languages = [
    { code: 'en' as Language, name: 'English', flag: '🇺🇸', subtitle: 'Press or say 1' },
    { code: 'es' as Language, name: 'Español', flag: '🇪🇸', subtitle: 'Press or say 2' },
    { code: 'hi' as Language, name: 'हिंदी', flag: '🇮🇳', subtitle: 'Press or say 3' },
    { code: 'en-uk' as Language, name: 'English (UK)', flag: '🇬🇧', subtitle: 'Press or say 4' }
  ];

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 4
      }}
    >
      <Container maxWidth="md">
        <Paper 
          elevation={24} 
          sx={{ 
            borderRadius: 4, 
            overflow: 'hidden',
            backgroundColor: 'white'
          }}
        >
          <Box sx={{ p: 6 }}>
            {/* Header */}
            <Box textAlign="center" mb={6}>
              <Avatar 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  mx: 'auto', 
                  mb: 3,
                  backgroundColor: '#1976d2'
                }}
              >
                <LanguageIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography 
                variant="h3" 
                component="h1" 
                fontWeight={700}
                color="primary.main"
                gutterBottom
              >
                Welcome to Lagunacreek
              </Typography>
              <Typography 
                variant="h6" 
                color="text.secondary"
                sx={{ maxWidth: 400, mx: 'auto' }}
              >
                Please select your preferred language to continue
              </Typography>
            </Box>
            
            {/* Language Options */}
            <Grid container spacing={3}>
              {languages.map((language, index) => (
                <Grid item xs={12} sm={6} key={language.code}>
                  <Card
                    onClick={() => onLanguageSelect(language.code)}
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 8,
                        backgroundColor: '#f8f9fa'
                      },
                      border: '2px solid transparent',
                      '&:hover': {
                        borderColor: '#1976d2'
                      }
                    }}
                    elevation={2}
                  >
                    <CardContent sx={{ p: 4, textAlign: 'center' }}>
                      <Typography 
                        variant="h2" 
                        component="div" 
                        sx={{ mb: 2, fontSize: '3rem' }}
                      >
                        {language.flag}
                      </Typography>
                      <Typography 
                        variant="h6" 
                        component="h3" 
                        fontWeight={600}
                        color="text.primary"
                        gutterBottom
                      >
                        {language.name}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                      >
                        {language.subtitle}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            {/* Footer */}
            <Box mt={6} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                You can also use voice commands: "1 for English", "2 for Spanish", "3 for Hindi", or "4 for UK English"
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LanguageSelector;