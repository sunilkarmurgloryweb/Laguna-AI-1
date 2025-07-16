import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  Divider,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Close,
  CalendarToday,
  People,
  Hotel,
  CreditCard,
  Person,
  Email,
  Phone
} from '@mui/icons-material';
import { ReservationData } from '../types/reservation';
import { formatDateForDisplay, calculateNights } from '../utils/dateUtils';

interface ReservationPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  reservationData: ReservationData;
}

const ReservationPreview: React.FC<ReservationPreviewProps> = ({
  isOpen,
  onClose,
  onConfirm,
  reservationData
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const nights = calculateNights(reservationData.checkIn, reservationData.checkOut);
  const totalAmount = reservationData.roomPrice * nights;

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          m: isMobile ? 0 : 1
        }
      }}
    >
      <DialogTitle sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
            Confirm Your Reservation
          </Typography>
          <Button onClick={onClose} sx={{ minWidth: 'auto', p: 1 }}>
            <Close />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Please review your reservation details before confirming.
        </Typography>

        {/* Hotel Information */}
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.light' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Hotel color="primary" />
            <Typography variant="h6" fontWeight="bold" color="primary.main">
              {reservationData.hotel}
            </Typography>
          </Box>
          <Typography variant="body2" color="primary.contrastText">
            Luxury resort experience with world-class amenities
          </Typography>
        </Paper>

        {/* Reservation Details */}
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Reservation Details
          </Typography>
          
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CalendarToday sx={{ fontSize: 20, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Check-in</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDateForDisplay(reservationData.checkIn)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CalendarToday sx={{ fontSize: 20, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Check-out</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDateForDisplay(reservationData.checkOut)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <People sx={{ fontSize: 20, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Guests</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {reservationData.adults} adults, {reservationData.children} children
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Hotel sx={{ fontSize: 20, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Duration</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {nights} {nights === 1 ? 'night' : 'nights'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Room Information */}
        <Paper sx={{ p: 3, mb: 3, border: 2, borderColor: 'success.main' }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom color="success.main">
            Selected Room
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {reservationData.roomType}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Premium accommodation with luxury amenities
              </Typography>
            </Box>
            <Chip 
              label="Available" 
              color="success" 
              size="small"
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Rate per night
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="success.main">
              ${reservationData.roomPrice}
            </Typography>
          </Box>
        </Paper>

        {/* Guest Information */}
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Guest Information
          </Typography>
          
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person sx={{ fontSize: 20, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Guest Name</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {reservationData.guestName}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone sx={{ fontSize: 20, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Phone</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {reservationData.phone}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email sx={{ fontSize: 20, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Email</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {reservationData.email}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Payment Information */}
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Payment Information
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CreditCard sx={{ fontSize: 20, color: 'text.secondary' }} />
            <Box>
              <Typography variant="body2" color="text.secondary">Payment Method</Typography>
              <Typography variant="body1" fontWeight="medium">
                {reservationData.paymentMethod}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Total Amount */}
        <Paper sx={{ p: 3, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Total Amount
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              ${totalAmount}
            </Typography>
          </Box>
          
          <Divider sx={{ bgcolor: 'primary.contrastText', opacity: 0.3, mb: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">
              {nights} nights × ${reservationData.roomPrice}
            </Typography>
            <Typography variant="body2">
              ${totalAmount}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Taxes & Fees</Typography>
            <Typography variant="body2">Included</Typography>
          </Box>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ 
        p: { xs: 2, md: 3 }, 
        bgcolor: 'grey.50',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1, sm: 0 }
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          fullWidth={isMobile}
          size={isMobile ? 'large' : 'medium'}
        >
          Cancel
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          onClick={onConfirm}
          variant="contained"
          color="success"
          fullWidth={isMobile}
          size={isMobile ? 'large' : 'medium'}
          sx={{ fontWeight: 'bold' }}
        >
          Confirm Reservation
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReservationPreview;