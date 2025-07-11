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
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert
} from '@mui/material';
import { 
  CalendarToday,
  People,
  Hotel as HotelIcon,
  Person,
  Payment,
  CheckCircle,
  Wifi,
  LocalBar,
  Balcony,
  Kitchen,
  Bed
} from '@mui/icons-material';
import { ReservationData, ReservationStep } from '../types/reservation';
import { roomTypes, paymentMethods } from '../data/hotels';
import VoiceIndicator from './VoiceIndicator';
import { VoiceState } from '../types/reservation';

interface ReservationFlowProps {
  step: ReservationStep;
  reservationData: ReservationData;
  voiceState: VoiceState;
  isSupported: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onNext: () => void;
  transcript: string;
}

const ReservationFlow: React.FC<ReservationFlowProps> = ({
  step,
  reservationData,
  voiceState,
  isSupported,
  onStartListening,
  onStopListening,
  onNext,
  transcript
}) => {
  const stepIcons = {
    'dates-guests': CalendarToday,
    'room-selection': HotelIcon,
    'guest-info': Person,
    'payment': Payment,
    'confirmation': CheckCircle
  };

  const getAmenityIcon = (amenity: string) => {
    if (amenity.includes('WiFi')) return <Wifi />;
    if (amenity.includes('Bar')) return <LocalBar />;
    if (amenity.includes('Balcony')) return <Balcony />;
    if (amenity.includes('Kitchen')) return <Kitchen />;
    if (amenity.includes('Bed')) return <Bed />;
    return <CheckCircle />;
  };

  const canProceed = () => {
    switch (step) {
      case 'dates-guests':
        return reservationData.checkIn && reservationData.adults > 0;
      case 'room-selection':
        return reservationData.roomType;
      case 'guest-info':
        return reservationData.guestName;
      case 'payment':
        return reservationData.paymentMethod;
      default:
        return false;
    }
  };

  const getStepContent = () => {
    switch (step) {
      case 'dates-guests':
        return (
          <Box>
            <Typography variant="h4" fontWeight={700} color="primary.main" gutterBottom>
              Let's Plan Your Stay
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Please tell me your check-in and check-out dates, number of adults, and number of children.
            </Typography>
            
            <Alert severity="info" sx={{ mb: 4 }}>
              <Typography variant="body2">
                <strong>Example:</strong> "Check-in on July 15, check-out on July 18, 2 adults and 1 child"
              </Typography>
            </Alert>

            {reservationData.checkIn && (
              <Alert severity="success" sx={{ mb: 4 }}>
                <Typography variant="body2">
                  <strong>Captured:</strong> 
                  {reservationData.checkIn && ` Check-in: ${reservationData.checkIn}`}
                  {reservationData.checkOut && `, Check-out: ${reservationData.checkOut}`}
                  {reservationData.adults > 0 && `, ${reservationData.adults} adults`}
                  {reservationData.children > 0 && `, ${reservationData.children} children`}
                </Typography>
              </Alert>
            )}
          </Box>
        );
      
      case 'room-selection':
        return (
          <Box>
            <Typography variant="h4" fontWeight={700} color="primary.main" gutterBottom>
              Choose Your Room
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Here are our available room types. Please say the room type you'd like to book.
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {roomTypes.map((room) => (
                <Grid item xs={12} md={4} key={room.id}>
                  <Card 
                    elevation={reservationData.roomType === room.name ? 8 : 2}
                    sx={{
                      height: '100%',
                      border: reservationData.roomType === room.name ? '2px solid #1976d2' : '2px solid transparent',
                      backgroundColor: reservationData.roomType === room.name ? '#e3f2fd' : 'white',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Typography variant="h6" fontWeight={600}>
                          {room.name}
                        </Typography>
                        <Chip 
                          label={`${room.available} available`} 
                          color="success" 
                          size="small"
                        />
                      </Box>
                      
                      <Typography 
                        variant="h4" 
                        color="primary.main" 
                        fontWeight={700}
                        sx={{ mb: 1 }}
                      >
                        ${room.price}
                        <Typography component="span" variant="body2" color="text.secondary">
                          /night
                        </Typography>
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {room.description}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Max occupancy: {room.maxOccupancy} guests
                      </Typography>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                        Amenities:
                      </Typography>
                      <List dense>
                        {room.amenities.slice(0, 3).map((amenity, index) => (
                          <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              {getAmenityIcon(amenity)}
                            </ListItemIcon>
                            <ListItemText 
                              primary={amenity} 
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {reservationData.roomType && (
              <Alert severity="success">
                <Typography variant="body2">
                  <strong>Selected:</strong> {reservationData.roomType}
                </Typography>
              </Alert>
            )}
          </Box>
        );
      
      case 'guest-info':
        return (
          <Box>
            <Typography variant="h4" fontWeight={700} color="primary.main" gutterBottom>
              Guest Information
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Please say your full name, contact number, and email address.
            </Typography>
            
            <Alert severity="info" sx={{ mb: 4 }}>
              <Typography variant="body2">
                <strong>Example:</strong> "My name is John Smith, my number is 1234567890, and my email is john@example.com"
              </Typography>
            </Alert>

            {reservationData.guestName && (
              <Alert severity="success">
                <Typography variant="body2">
                  <strong>Captured:</strong> {reservationData.guestName} 
                  {reservationData.phone && `, ${reservationData.phone}`}
                  {reservationData.email && `, ${reservationData.email}`}
                </Typography>
              </Alert>
            )}
          </Box>
        );
      
      case 'payment':
        return (
          <Box>
            <Typography variant="h4" fontWeight={700} color="primary.main" gutterBottom>
              Payment Method
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Please choose your preferred payment method.
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {paymentMethods.map((method) => (
                <Grid item xs={12} sm={4} key={method.id}>
                  <Card 
                    elevation={reservationData.paymentMethod === method.name ? 8 : 2}
                    sx={{
                      height: '100%',
                      border: reservationData.paymentMethod === method.name ? '2px solid #1976d2' : '2px solid transparent',
                      backgroundColor: reservationData.paymentMethod === method.name ? '#e3f2fd' : 'white',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                  >
                    <CardContent sx={{ p: 4, textAlign: 'center' }}>
                      <Typography variant="h6" fontWeight={600}>
                        {method.name}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {reservationData.paymentMethod && (
              <Alert severity="success">
                <Typography variant="body2">
                  <strong>Selected:</strong> {reservationData.paymentMethod}
                </Typography>
              </Alert>
            )}
          </Box>
        );
      
      case 'confirmation':
        return (
          <Box>
            <Typography variant="h4" fontWeight={700} color="primary.main" gutterBottom>
              Booking Confirmation
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Please review your reservation details and say "Yes, confirm the booking" to proceed.
            </Typography>
            
            <Paper elevation={3} sx={{ p: 4, mb: 4, backgroundColor: '#f8f9fa' }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Hotel</Typography>
                  <Typography variant="body1" fontWeight={600}>{reservationData.hotel}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Room Type</Typography>
                  <Typography variant="body1" fontWeight={600}>{reservationData.roomType}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Check-in</Typography>
                  <Typography variant="body1" fontWeight={600}>{reservationData.checkIn}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Check-out</Typography>
                  <Typography variant="body1" fontWeight={600}>{reservationData.checkOut}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Guests</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {reservationData.adults} adults, {reservationData.children} children
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Payment Method</Typography>
                  <Typography variant="body1" fontWeight={600}>{reservationData.paymentMethod}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Guest Name</Typography>
                  <Typography variant="body1" fontWeight={600}>{reservationData.guestName}</Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 3 }} />
              
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight={600}>
                  Total Amount:
                </Typography>
                <Typography variant="h4" color="primary.main" fontWeight={700}>
                  ${reservationData.roomPrice}/night
                </Typography>
              </Box>
            </Paper>
          </Box>
        );
      
      default:
        return null;
    }
  };

  const getCurrentIcon = () => {
    const IconComponent = stepIcons[step as keyof typeof stepIcons];
    return IconComponent ? <IconComponent sx={{ fontSize: 40 }} /> : null;
  };

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
                {getCurrentIcon()}
              </Avatar>
              {getStepContent()}
            </Box>

            {/* Voice Indicator */}
            <Box textAlign="center" mb={6}>
              <VoiceIndicator
                voiceState={voiceState}
                isSupported={isSupported}
                onStartListening={onStartListening}
                onStopListening={onStopListening}
              />
            </Box>

            {/* Transcript Display */}
            {transcript && (
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 3, 
                  mb: 4, 
                  backgroundColor: '#f5f5f5',
                  borderRadius: 2
                }}
              >
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Last heard:
                </Typography>
                <Typography variant="body1" fontStyle="italic">
                  "{transcript}"
                </Typography>
              </Paper>
            )}

            {/* Action Buttons */}
            <Box display="flex" justifyContent="center" gap={2}>
              <Button
                variant="contained"
                size="large"
                onClick={onNext}
                disabled={!canProceed()}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 2
                }}
              >
                Next Step
              </Button>
            </Box>

            {/* Help Text */}
            <Box mt={4} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Say "Next" or press the "Next Step" button to continue
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ReservationFlow;