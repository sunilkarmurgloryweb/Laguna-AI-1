import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  LinearProgress,
  IconButton,
  TextField,
  useTheme,
  useMediaQuery,
  Grid,
  CircularProgress,
  Avatar
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import {
  Close,
  CalendarToday,
  People,
  Hotel,
  CreditCard,
  CheckCircle
} from '@mui/icons-material';
import VoiceInput from './VoiceInput';
import { multilingualAI } from '../services/multilingualAIService';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { updateReservationData } from '../store/slices/reservationSlice';
import { ProcessedVoiceResponse, VoiceProcessedData } from '../types/reservation';
import { FormDataWithDayjs, ConvertDayjsToString } from '../types/reservation';

interface ReservationModalProps {
  isOpen?: boolean;
  onClose: () => void;
  initialData?: VoiceProcessedData;
  onAIMessage?: (message: string, shouldSpeak?: boolean) => void;
}

const ReservationModal: React.FC<ReservationModalProps> = ({ 
  isOpen = true, 
  onClose,
  initialData = {},
  onAIMessage
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useAppDispatch();

  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceFilledFields, setVoiceFilledFields] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState<FormDataWithDayjs>({
    checkIn: initialData.checkIn ? dayjs(initialData.checkIn as string) : null,
    checkOut: initialData.checkOut ? dayjs(initialData.checkOut as string) : null,
    adults: initialData.adults || 1,
    children: initialData.children || 0,
    roomType: initialData.roomType || '',
    guestName: initialData.guestName || '',
    phone: initialData.phone || '',
    email: initialData.email || '',
    paymentMethod: initialData.paymentMethod || ''
  });

  const steps = ['Dates & Guests', 'Room Selection', 'Guest Information', 'Payment', 'Confirmation'];

  const roomTypes = [
    { name: 'Ocean View King Suite', price: 299, description: 'Luxurious suite with panoramic ocean views' },
    { name: 'Deluxe Garden Room', price: 199, description: 'Comfortable room overlooking beautiful gardens' },
    { name: 'Family Oceanfront Suite', price: 399, description: 'Spacious suite perfect for families' },
    { name: 'Presidential Suite', price: 599, description: 'Ultimate luxury with premium amenities' },
    { name: 'Standard Double Room', price: 149, description: 'Comfortable standard accommodation' },
    { name: 'Luxury Spa Suite', price: 449, description: 'Relaxation suite with spa amenities' }
  ];

  const paymentMethods = [
    { id: 'credit-card', name: 'Credit Card' },
    { id: 'pay-at-hotel', name: 'Pay at Hotel' },
    { id: 'upi', name: 'UPI or Digital Wallet' }
  ];

  // Initialize form with initial data
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      const newVoiceFields = new Set<string>();
      const updates: Partial<FormDataWithDayjs> = {};

      if (initialData.checkIn) {
        updates.checkIn = dayjs(initialData.checkIn as string);
        newVoiceFields.add('checkIn');
      }
      if (initialData.checkOut) {
        updates.checkOut = dayjs(initialData.checkOut as string);
        newVoiceFields.add('checkOut');
      }
      if (initialData.adults) {
        updates.adults = initialData.adults;
        newVoiceFields.add('adults');
      }
      if (initialData.children !== undefined) {
        updates.children = initialData.children;
        newVoiceFields.add('children');
      }
      if (initialData.roomType) {
        updates.roomType = initialData.roomType;
        newVoiceFields.add('roomType');
      }
      if (initialData.guestName) {
        updates.guestName = initialData.guestName;
        newVoiceFields.add('guestName');
      }
      if (initialData.phone) {
        updates.phone = initialData.phone;
        newVoiceFields.add('phone');
      }
      if (initialData.email) {
        updates.email = initialData.email;
        newVoiceFields.add('email');
      }
      if (initialData.paymentMethod) {
        updates.paymentMethod = initialData.paymentMethod;
        newVoiceFields.add('paymentMethod');
      }

      setFormData(prev => ({ ...prev, ...updates }));
      setVoiceFilledFields(newVoiceFields);
    }
  }, [initialData]);

  // Convert formData to VoiceProcessedData format for voice input
  const getVoiceCompatibleData = (): VoiceProcessedData => ({
    checkIn: formData.checkIn?.format('YYYY-MM-DD'),
    checkOut: formData.checkOut?.format('YYYY-MM-DD'),
    adults: formData.adults,
    children: formData.children,
    roomType: formData.roomType,
    guestName: formData.guestName,
    phone: formData.phone,
    email: formData.email,
    paymentMethod: formData.paymentMethod
  });

  const handleVoiceProcessed = (result: ProcessedVoiceResponse): void => {
    const voiceResult = result as ProcessedVoiceResponse;
    
    // Send user input and AI response to chatbot
    if (onAIMessage) {
      // Add user message to chatbot
      onAIMessage(`User: "${voiceResult.originalInput || 'Voice input received'}"`, false);
      
      // Add AI response to chatbot
      if (voiceResult.text) {
        onAIMessage(`AI: ${voiceResult.text}`, false);
      }
    }
    
    if (voiceResult.extractedData) {
      const updates: Partial<FormDataWithDayjs> = {};
      const newVoiceFields = new Set(voiceFilledFields);
      
      if (voiceResult.extractedData.checkIn) {
        updates.checkIn = dayjs(voiceResult.extractedData.checkIn as string);
        newVoiceFields.add('checkIn');
      }
      if (voiceResult.extractedData.checkOut) {
        updates.checkOut = dayjs(voiceResult.extractedData.checkOut as string);
        newVoiceFields.add('checkOut');
      }
      if (voiceResult.extractedData.adults) {
        updates.adults = voiceResult.extractedData.adults;
        newVoiceFields.add('adults');
      }
      if (voiceResult.extractedData.children !== undefined) {
        updates.children = voiceResult.extractedData.children;
        newVoiceFields.add('children');
      }
      if (voiceResult.extractedData.roomType) {
        updates.roomType = voiceResult.extractedData.roomType;
        newVoiceFields.add('roomType');
      }
      if (voiceResult.extractedData.guestName) {
        updates.guestName = voiceResult.extractedData.guestName;
        newVoiceFields.add('guestName');
      }
      if (voiceResult.extractedData.phone) {
        updates.phone = voiceResult.extractedData.phone;
        newVoiceFields.add('phone');
      }
      if (voiceResult.extractedData.email) {
        updates.email = voiceResult.extractedData.email;
        newVoiceFields.add('email');
      }
      if (voiceResult.extractedData.paymentMethod) {
        updates.paymentMethod = voiceResult.extractedData.paymentMethod;
        newVoiceFields.add('paymentMethod');
      }
      
      if (Object.keys(updates).length > 0) {
        setFormData(prev => ({ ...prev, ...updates }));
        setVoiceFilledFields(newVoiceFields);
      }
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    
    // Convert Dayjs to string for Redux
    const reservationData: ConvertDayjsToString<FormDataWithDayjs> = {
      checkIn: formData.checkIn?.format('YYYY-MM-DD') || '',
      checkOut: formData.checkOut?.format('YYYY-MM-DD') || '',
      adults: formData.adults,
      children: formData.children,
      roomType: formData.roomType,
      guestName: formData.guestName,
      phone: formData.phone,
      email: formData.email,
      paymentMethod: formData.paymentMethod
    };

    dispatch(updateReservationData(reservationData));
    
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      onClose();
    }, 2000);
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0: // Dates & Guests
        return !!(formData.checkIn && formData.checkOut && formData.adults > 0);
      case 1: // Room Selection
        return !!formData.roomType;
      case 2: // Guest Information
        return !!(formData.guestName && formData.phone && formData.email);
      case 3: // Payment
        return !!formData.paymentMethod;
      default:
        return true;
    }
  };

  const isVoiceFilled = (field: string) => voiceFilledFields.has(field);

  const getFieldSx = (field: string) => ({
    '& .MuiOutlinedInput-root': {
      backgroundColor: isVoiceFilled(field) ? 'success.light' : 'background.paper',
      '& fieldset': {
        borderColor: isVoiceFilled(field) ? 'success.main' : undefined,
      },
    },
  });

  const getSelectedRoom = () => {
    return roomTypes.find(room => room.name === formData.roomType);
  };

  const calculateTotal = () => {
    const selectedRoom = getSelectedRoom();
    if (!selectedRoom || !formData.checkIn || !formData.checkOut) return 0;
    
    const nights = formData.checkOut.diff(formData.checkIn, 'day');
    return selectedRoom.price * nights;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Dates & Guests
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarToday color="primary" />
              Dates & Guests
            </Typography>
            
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <VoiceInput
                onVoiceProcessed={handleVoiceProcessed}
                currentStep="dates-guests"
                reservationData={getVoiceCompatibleData()}
                size={isMobile ? "small" : "medium"}
                showTranscript={true}
              />
            </Box>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Check-in Date"
                    value={formData.checkIn}
                    onChange={(newValue) => setFormData({...formData, checkIn: newValue})}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: isMobile ? 'small' : 'medium',
                        sx: getFieldSx('checkIn'),
                        helperText: isVoiceFilled('checkIn') ? '✓ Filled by voice' : undefined
                      }
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Check-out Date"
                    value={formData.checkOut}
                    onChange={(newValue) => setFormData({...formData, checkOut: newValue})}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: isMobile ? 'small' : 'medium',
                        sx: getFieldSx('checkOut'),
                        helperText: isVoiceFilled('checkOut') ? '✓ Filled by voice' : undefined
                      }
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Adults"
                    value={formData.adults}
                    onChange={(e) => setFormData({...formData, adults: parseInt(e.target.value) || 0})}
                    inputProps={{ min: 1, max: 10 }}
                    size={isMobile ? 'small' : 'medium'}
                    sx={getFieldSx('adults')}
                    helperText={isVoiceFilled('adults') ? '✓ Filled by voice' : 'Number of adults (1-10)'}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Children"
                    value={formData.children}
                    onChange={(e) => setFormData({...formData, children: parseInt(e.target.value) || 0})}
                    inputProps={{ min: 0, max: 8 }}
                    size={isMobile ? 'small' : 'medium'}
                    sx={getFieldSx('children')}
                    helperText={isVoiceFilled('children') ? '✓ Filled by voice' : 'Number of children (0-8)'}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>
          </Box>
        );

      case 1: // Room Selection
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Hotel color="primary" />
              Room Selection
            </Typography>
            
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <VoiceInput
                onVoiceProcessed={handleVoiceProcessed}
                currentStep="room-selection"
                reservationData={getVoiceCompatibleData()}
                size={isMobile ? "small" : "medium"}
                showTranscript={true}
              />
            </Box>

            <Grid container spacing={2}>
              {roomTypes.map((room) => (
                <Grid size={{ xs: 12, sm: 6 }} key={room.name}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: formData.roomType === room.name ? 2 : 1,
                      borderColor: formData.roomType === room.name ? 'primary.main' : 'divider',
                      bgcolor: formData.roomType === room.name ? 'primary.light' : 'background.paper',
                      '&:hover': {
                        borderColor: 'primary.main',
                        transform: 'translateY(-2px)',
                        boxShadow: 2
                      },
                      transition: 'all 0.2s'
                    }}
                    onClick={() => setFormData({...formData, roomType: room.name})}
                  >
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {room.name}
                      </Typography>
                      <Typography variant="h4" color="primary.main" fontWeight="bold" gutterBottom>
                        ${room.price}
                        <Typography component="span" variant="body2" color="text.secondary">
                          /night
                        </Typography>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {room.description}
                      </Typography>
                      {formData.roomType === room.name && (
                        <Chip
                          label="Selected"
                          color="primary"
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 2: // Guest Information
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <People color="primary" />
              Guest Information
            </Typography>
            
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <VoiceInput
                onVoiceProcessed={handleVoiceProcessed}
                currentStep="guest-info"
                reservationData={getVoiceCompatibleData()}
                size={isMobile ? "small" : "medium"}
                showTranscript={true}
              />
            </Box>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.guestName}
                  onChange={(e) => setFormData({...formData, guestName: e.target.value})}
                  size={isMobile ? 'small' : 'medium'}
                  sx={getFieldSx('guestName')}
                  helperText={isVoiceFilled('guestName') ? '✓ Filled by voice' : 'Enter your full name'}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  size={isMobile ? 'small' : 'medium'}
                  sx={getFieldSx('phone')}
                  helperText={isVoiceFilled('phone') ? '✓ Filled by voice' : 'Enter your phone number'}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="email"
                  label="Email Address"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  size={isMobile ? 'small' : 'medium'}
                  sx={getFieldSx('email')}
                  helperText={isVoiceFilled('email') ? '✓ Filled by voice' : 'Enter your email address'}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 3: // Payment
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CreditCard color="primary" />
              Payment Method
            </Typography>
            
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <VoiceInput
                onVoiceProcessed={handleVoiceProcessed}
                currentStep="payment"
                reservationData={getVoiceCompatibleData()}
                size={isMobile ? "small" : "medium"}
                showTranscript={true}
              />
            </Box>

            <Grid container spacing={2}>
              {paymentMethods.map((method) => (
                <Grid size={{ xs: 12, sm: 4 }} key={method.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: formData.paymentMethod === method.name ? 2 : 1,
                      borderColor: formData.paymentMethod === method.name ? 'primary.main' : 'divider',
                      bgcolor: formData.paymentMethod === method.name ? 'primary.light' : 'background.paper',
                      '&:hover': {
                        borderColor: 'primary.main',
                        transform: 'translateY(-2px)',
                        boxShadow: 2
                      },
                      transition: 'all 0.2s',
                      textAlign: 'center',
                      p: 2
                    }}
                    onClick={() => setFormData({...formData, paymentMethod: method.name})}
                  >
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold">
                        {method.name}
                      </Typography>
                      {formData.paymentMethod === method.name && (
                        <Chip
                          label="Selected"
                          color="primary"
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 4: // Confirmation
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle color="primary" />
              Booking Confirmation
            </Typography>

            <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Reservation Summary
              </Typography>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">Check-in:</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formData.checkIn?.format('MMM DD, YYYY')}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">Check-out:</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formData.checkOut?.format('MMM DD, YYYY')}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">Guests:</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formData.adults} adults, {formData.children} children
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">Nights:</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formData.checkOut?.diff(formData.checkIn, 'day')} nights
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" color="text.secondary">Room:</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formData.roomType}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" color="text.secondary">Guest:</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formData.guestName}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" color="text.secondary">Payment:</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formData.paymentMethod}
                  </Typography>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight="bold">
                    Total Amount:
                  </Typography>
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    ${calculateTotal()}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          m: isMobile ? 0 : 1,
          maxHeight: isMobile ? '100vh' : '95vh'
        }
      }}
    >
      <DialogTitle sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
            New Reservation
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
        <Box sx={{ mt: 2 }}>
          <Stepper 
            activeStep={currentStep} 
            alternativeLabel={!isMobile}
            orientation={isMobile ? 'vertical' : 'horizontal'}
            sx={{
              '& .MuiStepLabel-label': {
                fontSize: { xs: '0.75rem', md: '0.875rem' }
              }
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <LinearProgress 
            variant="determinate" 
            value={(currentStep + 1) / steps.length * 100} 
            sx={{ mt: 2 }}
          />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, md: 3 } }}>
        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ 
        p: { xs: 2, md: 3 }, 
        bgcolor: 'grey.50',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1, sm: 0 }
      }}>
        <Button
          onClick={handleBack}
          disabled={currentStep === 0}
          fullWidth={isMobile}
          size={isMobile ? 'large' : 'medium'}
        >
          Previous
        </Button>
        <Box sx={{ flex: 1 }} />
        {currentStep === steps.length - 1 ? (
          <Button
            variant="contained"
            color="success"
            onClick={handleSubmit}
            disabled={!isStepValid(currentStep) || isProcessing}
            fullWidth={isMobile}
            size={isMobile ? 'large' : 'medium'}
            startIcon={isProcessing ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            {isProcessing ? 'Processing...' : 'Confirm Booking'}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!isStepValid(currentStep)}
            fullWidth={isMobile}
            size={isMobile ? 'large' : 'medium'}
          >
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ReservationModal;