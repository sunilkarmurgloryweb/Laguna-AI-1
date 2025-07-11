import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
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
  IconButton
} from '@mui/material';
import {
  Close,
  CalendarToday,
  People,
  Hotel,
  CreditCard,
  CheckCircle
} from '@mui/icons-material';
import VoiceInput from './VoiceInput';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { updateReservationData } from '../store/slices/reservationSlice';

interface ReservationModalProps {
  isOpen?: boolean;
  onClose: () => void;
  initialData?: {
    checkIn?: string;
    checkOut?: string;
    adults?: number;
    children?: number;
    roomType?: string;
    guestName?: string;
    phone?: string;
    email?: string;
    paymentMethod?: string;
  };
}

const ReservationModal: React.FC<ReservationModalProps> = ({ 
  isOpen = true, 
  onClose,
  initialData = {}
}) => {
  const dispatch = useAppDispatch();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    checkIn: initialData.checkIn || '',
    checkOut: initialData.checkOut || '',
    adults: initialData.adults || 1,
    children: initialData.children || 0,
    roomType: initialData.roomType || '',
    guestName: initialData.guestName || '',
    phone: initialData.phone || '',
    email: initialData.email || '',
    paymentMethod: initialData.paymentMethod || ''
  });
  const [voiceFilledFields, setVoiceFilledFields] = useState<Set<string>>(new Set());

  const steps = ['Dates & Guests', 'Room Selection', 'Guest Information', 'Payment Method'];

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...initialData
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
    console.log('Reservation submitted:', formData);
    alert('Reservation confirmed! You will receive a confirmation email shortly.');
    onClose();
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

  const isAutoFilled = (field: string) => {
    return initialData[field as keyof typeof initialData] !== undefined;
  };
  const handleVoiceProcessed = (result: any) => {
    if (result.extractedData) {
      const updates: any = {};
      const newVoiceFields = new Set(voiceFilledFields);
      
      // Map extracted data to form fields
      if (result.extractedData.checkIn) {
        updates.checkIn = result.extractedData.checkIn;
        newVoiceFields.add('checkIn');
      }
      if (result.extractedData.checkOut) {
        updates.checkOut = result.extractedData.checkOut;
        newVoiceFields.add('checkOut');
      }
      if (result.extractedData.adults) {
        updates.adults = result.extractedData.adults;
        newVoiceFields.add('adults');
      }
      if (result.extractedData.children !== undefined) {
        updates.children = result.extractedData.children;
        newVoiceFields.add('children');
      }
      if (result.extractedData.roomType) {
        updates.roomType = result.extractedData.roomType;
        newVoiceFields.add('roomType');
      }
      if (result.extractedData.guestName) {
        updates.guestName = result.extractedData.guestName;
        newVoiceFields.add('guestName');
      }
      if (result.extractedData.phone) {
        updates.phone = result.extractedData.phone;
        newVoiceFields.add('phone');
      }
      if (result.extractedData.email) {
        updates.email = result.extractedData.email;
        newVoiceFields.add('email');
      }
      if (result.extractedData.paymentMethod) {
        updates.paymentMethod = result.extractedData.paymentMethod;
        newVoiceFields.add('paymentMethod');
      }
      
      if (Object.keys(updates).length > 0) {
        setFormData(prev => ({ ...prev, ...updates }));
        setVoiceFilledFields(newVoiceFields);
        dispatch(updateReservationData(updates));
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
                reservationData={formData}
                size="medium"
                showTranscript={true}
              />
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Check-in Date"
                  type="date"
                  value={formData.checkIn}
                  onChange={(e) => setFormData({...formData, checkIn: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                  sx={getFieldSx('checkIn')}
                  helperText={isVoiceFilled('checkIn') ? '✓ Filled by voice' : ''}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Check-out Date"
                  type="date"
                  value={formData.checkOut}
                  onChange={(e) => setFormData({...formData, checkOut: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                  sx={getFieldSx('checkOut')}
                  helperText={isVoiceFilled('checkOut') ? '✓ Filled by voice' : ''}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
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
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
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
                reservationData={formData}
                size="medium"
                showTranscript={true}
              />
            </Box>
            
            <Grid container spacing={2}>
              {roomTypes.map((room) => (
                <Grid item xs={12} key={room.id}>
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
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" fontWeight="bold">
                          {room.name}
                        </Typography>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="h5" color="primary.main" fontWeight="bold">
                            ${room.price}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            per night
                          </Typography>
                        </Box>
                      </Box>
                      {formData.roomType === room.name && isVoiceFilled('roomType') && (
                        <Typography variant="caption" color="success.main">
                          ✓ Selected by voice
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {room.description}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {room.amenities.map((amenity, index) => (
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
                reservationData={formData}
                size="medium"
                showTranscript={true}
              />
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.guestName}
                  onChange={(e) => setFormData({...formData, guestName: e.target.value})}
                  placeholder="Enter your full name"
                  sx={getFieldSx('guestName')}
                  helperText={isVoiceFilled('guestName') ? '✓ Filled by voice' : ''}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="Enter phone number"
                  sx={getFieldSx('phone')}
                  helperText={isVoiceFilled('phone') ? '✓ Filled by voice' : ''}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
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
                reservationData={formData}
                size="medium"
                showTranscript={true}
              />
            </Box>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {paymentMethods.map((method) => (
                <Grid item xs={12} key={method.id}>
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
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
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
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Booking Summary
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2">Check-in:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight="medium">{formData.checkIn}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Check-out:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight="medium">{formData.checkOut}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Guests:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight="medium">
                    {formData.adults} adults, {formData.children} children
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Room:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight="medium">{formData.roomType}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Guest:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight="medium">{formData.guestName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight="bold">Payment:</Typography>
                </Grid>
                <Grid item xs={6}>
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
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" fontWeight="bold">
            Make Reservation
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
        <Box sx={{ mt: 2 }}>
          <Stepper activeStep={currentStep} alternativeLabel>
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

      <DialogContent>
        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Button
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          Previous
        </Button>
        <Box sx={{ flex: 1 }} />
        {currentStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!canProceedToNext()}
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
          >
            Confirm Reservation
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ReservationModal;