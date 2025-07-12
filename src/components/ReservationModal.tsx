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
}

const ReservationModal: React.FC<ReservationModalProps> = ({ 
  isOpen = true, 
  onClose,
  initialData = {}
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  
  const dispatch = useAppDispatch();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [formData, setFormData] = useState<FormDataWithDayjs>({
    checkIn: initialData.checkIn ? dayjs(initialData.checkIn) : null,
    checkOut: initialData.checkOut ? dayjs(initialData.checkOut) : null,
    adults: initialData.adults || 1,
    children: initialData.children || 0,
    roomType: initialData.roomType || '',
    guestName: initialData.guestName || '',
    phone: initialData.phone || '',
    email: initialData.email || '',
    paymentMethod: initialData.paymentMethod || ''
  });
  const [voiceFilledFields, setVoiceFilledFields] = useState<Set<string>>(new Set());

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

  const steps = ['Dates & Guests', 'Room Selection', 'Guest Information', 'Payment Method'];

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...initialData,
      checkIn: initialData.checkIn ? dayjs(initialData.checkIn) : prev.checkIn,
      checkOut: initialData.checkOut ? dayjs(initialData.checkOut) : prev.checkOut,
    }));
    
    const nextStep = determineNextStep(initialData);
    setCurrentStep(nextStep);
  }, [initialData]);

  const determineNextStep = (data: any): number => {
    if (!data.checkIn || !data.checkOut || !data.adults) {
      return 0;
    }
    if (!data.roomType) {
      return 1;
    }
    if (!data.guestName || !data.phone || !data.email) {
      return 2;
    }
    if (!data.paymentMethod) {
      return 3;
    }
    return 3;
  };

  const roomTypes = [
    {
      id: 'ocean-view-king',
      name: 'Ocean View King Suite',
      price: 299,
      description: 'Luxurious suite with panoramic ocean views',
      amenities: ['Ocean View', 'King Bed', 'Balcony', 'Mini Bar', 'WiFi']
    },
    {
      id: 'deluxe-garden',
      name: 'Deluxe Garden Room',
      price: 199,
      description: 'Comfortable room overlooking beautiful gardens',
      amenities: ['Garden View', 'Queen Bed', 'Work Desk', 'Coffee Maker', 'WiFi']
    },
    {
      id: 'family-oceanfront',
      name: 'Family Oceanfront Suite',
      price: 399,
      description: 'Spacious suite perfect for families',
      amenities: ['Ocean View', '2 Queen Beds', 'Living Area', 'Kitchenette', 'WiFi']
    }
  ];

  const paymentMethods = [
    { id: 'credit-card', name: 'Credit Card', description: 'Pay with Visa, MasterCard, or Amex' },
    { id: 'pay-at-hotel', name: 'Pay at Hotel', description: 'Pay when you arrive at the hotel' },
    { id: 'upi', name: 'UPI / Digital Wallet', description: 'Pay with UPI, PayPal, or other digital wallets' }
  ];

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

  const handleSubmit = () => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsCompleted(true);
      
      // Get success message in current language
      const successMessage = multilingualAI.getResponse('bookingConfirmed', {
        confirmationId: `LG${Math.random().toString(36).substr(2, 8).toUpperCase()}`
      });
      
      // Speak the success message
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(successMessage);
        utterance.lang = multilingualAI.getSpeechRecognitionLanguage();
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        speechSynthesis.speak(utterance);
      }
      
      // Auto-close after 5 seconds
      setTimeout(() => {
        onClose();
      }, 5000);
    }, 2000);
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 0:
        return formData.checkIn && formData.checkOut && formData.adults > 0;
      case 1:
        return formData.roomType;
      case 2:
        return formData.guestName && formData.phone && formData.email;
      case 3:
        return formData.paymentMethod;
      default:
        return false;
    }
  };

  const handleVoiceProcessed = (result: ProcessedVoiceResponse): void => {
    const voiceResult = result as ProcessedVoiceResponse;
    
    if (voiceResult.extractedData) {
      const updates: Partial<FormDataWithDayjs> = {};
      const newVoiceFields = new Set(voiceFilledFields);
      
      // Map extracted data to form fields
      if (voiceResult.extractedData.checkIn) {
        updates.checkIn = dayjs(voiceResult.extractedData.checkIn);
        newVoiceFields.add('checkIn');
      }
      if (voiceResult.extractedData.checkOut) {
        updates.checkOut = dayjs(voiceResult.extractedData.checkOut);
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
        
        // Convert dayjs objects to strings for Redux
        const reduxUpdates: VoiceProcessedData = {
          ...updates,
          checkIn: updates.checkIn ? updates.checkIn.format('YYYY-MM-DD') : undefined,
          checkOut: updates.checkOut ? updates.checkOut.format('YYYY-MM-DD') : undefined,
        };
        dispatch(updateReservationData(reduxUpdates));
        
        // Auto-advance to next step if current step is complete
        setTimeout(() => {
          if (canProceedToNext() && voiceResult.intent !== 'help_request') {
            handleNext();
          }
        }, 1500);
      }
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarToday color="primary" />
              Dates & Guests
            </Typography>
            
            {/* Voice Input */}
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <VoiceInput
                onVoiceProcessed={handleVoiceProcessed}
                currentStep="dates-guests"
                reservationData={getVoiceCompatibleData()}
                size={isMobile ? "small" : "medium"}
                showTranscript={true}
              />
            </Box>
            
            <Grid container spacing={{ xs: 2, md: 3 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Check-in Date"
                    value={formData.checkIn}
                    onChange={(newValue) => setFormData({...formData, checkIn: newValue})}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: isMobile ? 'small' : 'medium',
                        sx: getFieldSx('checkIn'),
                        helperText: isVoiceFilled('checkIn') ? '✓ Filled by voice' : '',
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Check-out Date"
                    value={formData.checkOut}
                    onChange={(newValue) => setFormData({...formData, checkOut: newValue})}
                    minDate={formData.checkIn ? formData.checkIn.add(1, 'day') : undefined}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: isMobile ? 'small' : 'medium',
                        sx: getFieldSx('checkOut'),
                        helperText: isVoiceFilled('checkOut') ? '✓ Filled by voice' : '',
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                  <InputLabel>Adults</InputLabel>
                  <Select
                    value={formData.adults}
                    label="Adults"
                    onChange={(e) => setFormData({...formData, adults: Number(e.target.value)})}
                    sx={getFieldSx('adults')}
                  >
                    {[1,2,3,4,5,6].map(num => (
                      <MenuItem key={num} value={num}>{num} Adult{num > 1 ? 's' : ''}</MenuItem>
                    ))}
                  </Select>
                  {isVoiceFilled('adults') && (
                    <Typography variant="caption" color="success.main">
                      ✓ Filled by voice
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                  <InputLabel>Children</InputLabel>
                  <Select
                    value={formData.children}
                    label="Children"
                    onChange={(e) => setFormData({...formData, children: Number(e.target.value)})}
                    sx={getFieldSx('children')}
                  >
                    {[0,1,2,3,4].map(num => (
                      <MenuItem key={num} value={num}>{num} {num === 1 ? 'Child' : 'Children'}</MenuItem>
                    ))}
                  </Select>
                  {isVoiceFilled('children') && (
                    <Typography variant="caption" color="success.main">
                      ✓ Filled by voice
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Hotel color="primary" />
              Select Room
            </Typography>
            
            {/* Voice Input */}
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <VoiceInput
                onVoiceProcessed={handleVoiceProcessed}
                currentStep="room-selection"
                reservationData={getVoiceCompatibleData()}
                size={isMobile ? "small" : "medium"}
                showTranscript={true}
              />
            </Box>
            
            <Grid container spacing={{ xs: 2, md: 2 }}>
              {roomTypes.map((room) => (
                <Grid size={{ xs: 12 }} key={room.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: formData.roomType === room.name ? 2 : 1,
                      borderColor: formData.roomType === room.name 
                        ? (isVoiceFilled('roomType') ? 'success.main' : 'primary.main') 
                        : 'divider',
                      bgcolor: formData.roomType === room.name 
                        ? (isVoiceFilled('roomType') ? 'success.light' : 'primary.light') 
                        : 'background.paper',
                      '&:hover': { borderColor: 'primary.main' }
                    }}
                    onClick={() => setFormData({...formData, roomType: room.name})}
                  >
                    <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start', 
                        mb: 1,
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: { xs: 1, sm: 0 }
                      }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                            {room.name}
                          </Typography>
                          {formData.roomType === room.name && isVoiceFilled('roomType') && (
                            <Typography variant="caption" color="success.main">
                              ✓ Selected by voice
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                          <Typography variant="h5" color="primary.main" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                            ${room.price}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            per night
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {room.description}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {room.amenities.slice(0, isMobile ? 3 : 5).map((amenity, index) => (
                          <Chip
                            key={index}
                            label={amenity}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <People color="primary" />
              Guest Information
            </Typography>
            
            {/* Voice Input */}
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <VoiceInput
                onVoiceProcessed={handleVoiceProcessed}
                currentStep="guest-info"
                reservationData={getVoiceCompatibleData()}
                size={isMobile ? "small" : "medium"}
                showTranscript={true}
              />
            </Box>
            
            <Grid container spacing={{ xs: 2, md: 3 }}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size={isMobile ? 'small' : 'medium'}
                  label="Full Name"
                  value={formData.guestName}
                  onChange={(e) => setFormData({...formData, guestName: e.target.value})}
                  placeholder="Enter your full name"
                  sx={getFieldSx('guestName')}
                  helperText={isVoiceFilled('guestName') ? '✓ Filled by voice' : ''}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size={isMobile ? 'small' : 'medium'}
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="Enter phone number"
                  sx={getFieldSx('phone')}
                  helperText={isVoiceFilled('phone') ? '✓ Filled by voice' : ''}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size={isMobile ? 'small' : 'medium'}
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Enter email address"
                  sx={getFieldSx('email')}
                  helperText={isVoiceFilled('email') ? '✓ Filled by voice' : ''}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CreditCard color="primary" />
              Payment Method
            </Typography>
            
            {/* Voice Input */}
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <VoiceInput
                onVoiceProcessed={handleVoiceProcessed}
                currentStep="payment"
                reservationData={getVoiceCompatibleData()}
                size={isMobile ? "small" : "medium"}
                showTranscript={true}
              />
            </Box>
            
            <Grid container spacing={{ xs: 2, md: 2 }} sx={{ mb: 3 }}>
              {paymentMethods.map((method) => (
                <Grid size={{ xs: 12 }} key={method.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: formData.paymentMethod === method.name ? 2 : 1,
                      borderColor: formData.paymentMethod === method.name 
                        ? (isVoiceFilled('paymentMethod') ? 'success.main' : 'primary.main') 
                        : 'divider',
                      bgcolor: formData.paymentMethod === method.name 
                        ? (isVoiceFilled('paymentMethod') ? 'success.light' : 'primary.light') 
                        : 'background.paper',
                      '&:hover': { borderColor: 'primary.main' }
                    }}
                    onClick={() => setFormData({...formData, paymentMethod: method.name})}
                  >
                    <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                      <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                        {method.name}
                        {formData.paymentMethod === method.name && isVoiceFilled('paymentMethod') && (
                          <Chip 
                            label="✓ Voice Selected" 
                            size="small" 
                            color="success" 
                            sx={{ ml: 1 }} 
                          />
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {method.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Booking Summary */}
            <Paper sx={{ p: { xs: 2, md: 3 }, bgcolor: 'grey.50' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Booking Summary
              </Typography>
              <Grid container spacing={1}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2">Check-in:</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {formData.checkIn ? formData.checkIn.format('MMM DD, YYYY') : ''}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2">Check-out:</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {formData.checkOut ? formData.checkOut.format('MMM DD, YYYY') : ''}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2">Guests:</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {formData.adults} adults, {formData.children} children
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2">Room:</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" fontWeight="medium">{formData.roomType}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2">Guest:</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" fontWeight="medium">{formData.guestName}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" fontWeight="bold">Payment:</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" fontWeight="bold">{formData.paymentMethod}</Typography>
                </Grid>
              </Grid>
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
      maxWidth="md" 
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          m: isMobile ? 0 : 1,
          maxHeight: isMobile ? '100vh' : '90vh'
        }
      }}
    >
      <DialogTitle sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
            Make Reservation
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
                <StepLabel>{isMobile ? label.split(' ')[0] : label}</StepLabel>
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
        {isCompleted ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Avatar sx={{ 
              bgcolor: 'success.main', 
              width: { xs: 80, md: 100 }, 
              height: { xs: 80, md: 100 }, 
              mx: 'auto', 
              mb: 3 
            }}>
              <CheckCircle sx={{ fontSize: { xs: 40, md: 50 } }} />
            </Avatar>
            
            <Typography variant="h4" color="success.main" gutterBottom sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
              🎉 Reservation Confirmed!
            </Typography>
            
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
              Thank you for choosing Lagunacreek!
            </Typography>
            
            <Paper sx={{ p: 3, mt: 3, bgcolor: 'success.light', maxWidth: 400, mx: 'auto' }}>
              <Typography variant="body1" color="success.contrastText" gutterBottom>
                ✅ Reservation confirmed successfully
              </Typography>
              <Typography variant="body1" color="success.contrastText" gutterBottom>
                📧 Confirmation email will be sent shortly
              </Typography>
              <Typography variant="body1" color="success.contrastText">
                📱 SMS confirmation will follow
              </Typography>
            </Paper>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
              Confirmation ID: LG{Math.random().toString(36).substr(2, 8).toUpperCase()}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              This window will close automatically in a few seconds...
            </Typography>
          </Box>
        ) : (
          renderStepContent()
        )}
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
        {currentStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!canProceedToNext()}
            fullWidth={isMobile}
            size={isMobile ? 'large' : 'medium'}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            color="success"
            onClick={handleSubmit}
            disabled={!canProceedToNext()}
            startIcon={<CheckCircle />}
            fullWidth={isMobile}
            size={isMobile ? 'large' : 'medium'}
          >
            Confirm Reservation
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ReservationModal;