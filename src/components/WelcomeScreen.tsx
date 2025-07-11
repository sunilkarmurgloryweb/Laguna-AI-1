import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Container,
  Paper,
  Avatar,
  Rating,
  Chip
} from '@mui/material';
import { 
  Hotel as HotelIcon,
  LocationOn,
  Star
} from '@mui/icons-material';
import { Hotel as HotelType } from '../types/reservation';
import VoiceIndicator from './VoiceIndicator';
import { VoiceState } from '../types/reservation';

interface WelcomeScreenProps {
  hotels: HotelType[];
  voiceState: VoiceState;
  isSupported: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  hotels,
  voiceState,
  isSupported,
  onStartListening,
  onStopListening
}) => {
  const voiceCommands = [
    'Make a reservation',
    'Book a room',
    'I need a hotel room',
    'Show me available rooms'
  ];

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        py: 4
      }}
    >
      <Container maxWidth="lg">
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
                <HotelIcon sx={{ fontSize: 40 }} />
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
                variant="h5" 
                color="text.secondary"
                sx={{ mb: 4 }}
              >
                How can I assist you today?
              </Typography>
            </Box>

            {/* Hotels Grid */}
            <Grid container spacing={4} sx={{ mb: 6 }}>
              {hotels.map((hotel) => (
                <Grid item xs={12} md={4} key={hotel.id}>
                  <Card 
                    elevation={3}
                    sx={{
                      height: '100%',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 8
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box display="flex" alignItems="center" mb={2}>
                        <HotelIcon sx={{ color: '#1976d2', mr: 1 }} />
                        <Typography variant="h6" fontWeight={600}>
                          {hotel.name}
                        </Typography>
                      </Box>
                      
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ mb: 2 }}
                      >
                        {hotel.description}
                      </Typography>
                      
                      <Box display="flex" alignItems="center" mb={2}>
                        <LocationOn sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                        <Typography variant="caption" color="text.secondary">
                          {hotel.address}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center">
                          <Rating value={hotel.rating} precision={0.1} size="small" readOnly />
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {hotel.rating}
                          </Typography>
                        </Box>
                        <Chip 
                          label="Available" 
                          color="success" 
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Voice Indicator */}
            <Box textAlign="center" mb={6}>
              <VoiceIndicator
                voiceState={voiceState}
                isSupported={isSupported}
                onStartListening={onStartListening}
                onStopListening={onStopListening}
              />
            </Box>

            {/* Voice Commands Help */}
            <Paper 
              elevation={2} 
              sx={{ 
                p: 4, 
                backgroundColor: '#f8f9fa',
                borderRadius: 3
              }}
            >
              <Typography 
                variant="h6" 
                fontWeight={600} 
                color="primary.main"
                gutterBottom
              >
                Try saying:
              </Typography>
              <Grid container spacing={2}>
                {voiceCommands.map((command, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Box display="flex" alignItems="center">
                      <Box 
                        sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          backgroundColor: '#1976d2',
                          mr: 2 
                        }} 
                      />
                      <Typography variant="body2" color="text.secondary">
                        "{command}"
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default WelcomeScreen;