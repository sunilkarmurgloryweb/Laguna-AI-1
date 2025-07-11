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
  ListItemText
} from '@mui/material';
import { 
  CheckCircle,
  CalendarToday,
  People,
  Hotel as HotelIcon,
  Person,
  Payment,
  Email,
  Phone,
  Notifications
} from '@mui/icons-material';
import { ReservationData } from '../types/reservation';

interface ConfirmationScreenProps {
  reservationData: ReservationData;
  onNewReservation: () => void;
}

const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({
  reservationData,
  onNewReservation
}) => {
  const bookingId = `LG${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #2e7d32 0%, #388e3c 100%)',
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
            {/* Success Header */}
            <Box textAlign="center" mb={6}>
              <Avatar 
                sx={{ 
                  width: 100, 
                  height: 100, 
                  mx: 'auto', 
                  mb: 3,
                  backgroundColor: '#4caf50'
                }}
              >
                <CheckCircle sx={{ fontSize: 60 }} />
              </Avatar>
              <Typography 
                variant="h3" 
                component="h1" 
                fontWeight={700}
                color="success.main"
                gutterBottom
              >
                Booking Confirmed!
              </Typography>
              <Typography 
                variant="h6" 
                color="text.secondary"
                sx={{ mb: 4 }}
              >
                Your reservation has been successfully created.
              </Typography>
              
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 3, 
                  backgroundColor: '#e8f5e8',
                  border: '2px solid #4caf50',
                  borderRadius: 2,
                  display: 'inline-block'
                }}
              >
                <Typography 
                  variant="h6" 
                  color="success.dark" 
                  fontWeight={600}
                >
                  Booking ID: {bookingId}
                </Typography>
              </Paper>
            </Box>

            {/* Reservation Details */}
            <Paper elevation={3} sx={{ p: 4, mb: 4, backgroundColor: '#f8f9fa' }}>
              <Typography variant="h5" fontWeight={600} color="primary.main" gutterBottom>
                Reservation Details
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <CalendarToday sx={{ color: '#1976d2', mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Check-in
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {reservationData.checkIn}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <CalendarToday sx={{ color: '#1976d2', mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Check-out
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {reservationData.checkOut}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <People sx={{ color: '#1976d2', mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Guests
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {reservationData.adults} adults, {reservationData.children} children
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <HotelIcon sx={{ color: '#1976d2', mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Room Type
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {reservationData.roomType}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Guest & Payment Info */}
            <Paper elevation={3} sx={{ p: 4, mb: 4, backgroundColor: '#f8f9fa' }}>
              <Typography variant="h5" fontWeight={600} color="primary.main" gutterBottom>
                Guest & Payment Information
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Person sx={{ color: '#757575', mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Guest Name
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {reservationData.guestName}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Payment sx={{ color: '#757575', mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Payment Method
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {reservationData.paymentMethod}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* What's Next */}
            <Paper 
              elevation={2} 
              sx={{ 
                p: 4, 
                mb: 4, 
                backgroundColor: '#e3f2fd',
                border: '1px solid #2196f3'
              }}
            >
              <Typography variant="h6" fontWeight={600} color="primary.main" gutterBottom>
                What's Next?
              </Typography>
              <List>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Email sx={{ color: '#1976d2' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`A confirmation email has been sent to ${reservationData.email}`}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Notifications sx={{ color: '#1976d2' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="You'll receive a reminder 24 hours before check-in"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Phone sx={{ color: '#1976d2' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Contact us at support@lagunacreek.com for any changes"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              </List>
            </Paper>

            {/* Action Button */}
            <Box textAlign="center">
              <Button
                variant="contained"
                size="large"
                onClick={onNewReservation}
                sx={{
                  px: 6,
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  backgroundColor: '#1976d2',
                  '&:hover': {
                    backgroundColor: '#1565c0'
                  }
                }}
              >
                Make Another Reservation
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ConfirmationScreen;