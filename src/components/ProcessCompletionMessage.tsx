import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  CheckCircle,
  Hotel,
  Person,
  CreditCard,
  CalendarToday,
  ConfirmationNumber,
  Room,
  Payment,
  ExitToApp,
  Login
} from '@mui/icons-material';

interface ProcessCompletionMessageProps {
  processType: 'reservation' | 'checkin' | 'checkout';
  confirmationData: {
    confirmationNumber?: string;
    roomNumber?: string;
    guestName?: string;
    checkInDate?: string;
    checkOutDate?: string;
    roomType?: string;
    totalAmount?: number;
  };
  timestamp: Date;
}

const ProcessCompletionMessage: React.FC<ProcessCompletionMessageProps> = ({
  processType,
  confirmationData,
  timestamp
}) => {
  const getProcessConfig = () => {
    switch (processType) {
      case 'reservation':
        return {
          title: 'Reservation Created Successfully! 🎉',
          icon: <Hotel sx={{ fontSize: 32, color: 'success.main' }} />,
          color: 'success.main',
          bgColor: 'success.light',
          description: 'Your hotel reservation has been confirmed and is ready for your stay.'
        };
      case 'checkin':
        return {
          title: 'Check-in Completed Successfully! 🏨',
          icon: <Login sx={{ fontSize: 32, color: 'primary.main' }} />,
          color: 'primary.main',
          bgColor: 'primary.light',
          description: 'Welcome to Lagunacreek! Your room is ready and key cards have been prepared.'
        };
      case 'checkout':
        return {
          title: 'Check-out Completed Successfully! ✅',
          icon: <ExitToApp sx={{ fontSize: 32, color: 'warning.main' }} />,
          color: 'warning.main',
          bgColor: 'warning.light',
          description: 'Thank you for staying with us! We hope you enjoyed your experience.'
        };
      default:
        return {
          title: 'Process Completed Successfully!',
          icon: <CheckCircle sx={{ fontSize: 32, color: 'success.main' }} />,
          color: 'success.main',
          bgColor: 'success.light',
          description: 'Your request has been processed successfully.'
        };
    }
  };

  const config = getProcessConfig();

  const renderReservationDetails = () => (
    <Card sx={{ mt: 2, border: 1, borderColor: 'success.main' }}>
      <CardContent sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight="bold" color="success.main" gutterBottom>
          Reservation Details
        </Typography>
        
        <Grid container spacing={2}>
          {confirmationData.confirmationNumber && (
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ConfirmationNumber sx={{ fontSize: 20, color: 'success.main' }} />
                <Typography variant="body2" fontWeight="bold">
                  Confirmation Number:
                </Typography>
                <Chip 
                  label={confirmationData.confirmationNumber} 
                  color="success" 
                  size="small"
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
            </Grid>
          )}
          
          {confirmationData.guestName && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">Guest:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {confirmationData.guestName}
                </Typography>
              </Box>
            </Grid>
          )}
          
          {confirmationData.roomType && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Hotel sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">Room:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {confirmationData.roomType}
                </Typography>
              </Box>
            </Grid>
          )}
          
          {confirmationData.checkInDate && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">Check-in:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {confirmationData.checkInDate}
                </Typography>
              </Box>
            </Grid>
          )}
          
          {confirmationData.checkOutDate && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">Check-out:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {confirmationData.checkOutDate}
                </Typography>
              </Box>
            </Grid>
          )}
          
          {confirmationData.totalAmount && (
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Payment sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">Total Amount:</Typography>
                </Box>
                <Typography variant="h6" fontWeight="bold" color="success.main">
                  ${confirmationData.totalAmount}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );

  const renderCheckInDetails = () => (
    <Card sx={{ mt: 2, border: 1, borderColor: 'primary.main' }}>
      <CardContent sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom>
          Check-in Details
        </Typography>
        
        <Grid container spacing={2}>
          {confirmationData.roomNumber && (
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Room sx={{ fontSize: 20, color: 'primary.main' }} />
                <Typography variant="body2" fontWeight="bold">
                  Room Number:
                </Typography>
                <Chip 
                  label={confirmationData.roomNumber} 
                  color="primary" 
                  size="small"
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
            </Grid>
          )}
          
          {confirmationData.guestName && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">Guest:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {confirmationData.guestName}
                </Typography>
              </Box>
            </Grid>
          )}
          
          {confirmationData.roomType && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Hotel sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">Room Type:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {confirmationData.roomType}
                </Typography>
              </Box>
            </Grid>
          )}
          
          <Grid size={{ xs: 12 }}>
            <Box sx={{ 
              bgcolor: 'primary.light', 
              p: 2, 
              borderRadius: 1, 
              textAlign: 'center',
              mt: 1
            }}>
              <Typography variant="body2" fontWeight="bold" color="primary.contrastText">
                🗝️ Key cards are ready at the front desk
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderCheckOutDetails = () => (
    <Card sx={{ mt: 2, border: 1, borderColor: 'warning.main' }}>
      <CardContent sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight="bold" color="warning.main" gutterBottom>
          Check-out Summary
        </Typography>
        
        <Grid container spacing={2}>
          {confirmationData.guestName && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">Guest:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {confirmationData.guestName}
                </Typography>
              </Box>
            </Grid>
          )}
          
          {confirmationData.roomNumber && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Room sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">Room:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {confirmationData.roomNumber}
                </Typography>
              </Box>
            </Grid>
          )}
          
          {confirmationData.totalAmount && (
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Payment sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">Final Amount:</Typography>
                </Box>
                <Typography variant="h6" fontWeight="bold" color="warning.main">
                  ${confirmationData.totalAmount}
                </Typography>
              </Box>
            </Grid>
          )}
          
          <Grid size={{ xs: 12 }}>
            <Box sx={{ 
              bgcolor: 'warning.light', 
              p: 2, 
              borderRadius: 1, 
              textAlign: 'center',
              mt: 1
            }}>
              <Typography variant="body2" fontWeight="bold" color="warning.contrastText">
                🧾 Receipt has been sent to your email
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        bgcolor: config.bgColor,
        border: 2,
        borderColor: config.color,
        borderRadius: 2,
        maxWidth: '100%'
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Avatar sx={{ bgcolor: config.color, width: 48, height: 48 }}>
          {config.icon}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight="bold" color={config.color}>
            {config.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {config.description}
          </Typography>
        </Box>
        <CheckCircle sx={{ fontSize: 32, color: config.color }} />
      </Box>

      {/* Process-specific details */}
      {processType === 'reservation' && renderReservationDetails()}
      {processType === 'checkin' && renderCheckInDetails()}
      {processType === 'checkout' && renderCheckOutDetails()}

      {/* Footer */}
      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          Completed at {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} on {timestamp.toLocaleDateString()}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          Need help? Say "help" or contact our front desk at +1 (555) 123-4567
        </Typography>
      </Box>
    </Paper>
  );
};

export default ProcessCompletionMessage;