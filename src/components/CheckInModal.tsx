import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Paper,
  LinearProgress,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Fade,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close,
  Person,
  CalendarToday,
  CreditCard,
  CameraAlt,
  Upload,
  CheckCircle,
  Verified
} from '@mui/icons-material';
import VoiceInput from './VoiceInput';
import type { ProcessedVoiceResponse } from '../store/api/geminiApi';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestData?: {
    name?: string;
    confirmationNumber?: string;
    checkInDate?: string;
    roomType?: string;
  };
}

const CheckInModal: React.FC<CheckInModalProps> = ({ 
  isOpen, 
  onClose,
  guestData = {}
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: guestData.name || '',
    confirmationNumber: guestData.confirmationNumber || '',
    checkInDate: guestData.checkInDate || '',
    roomType: guestData.roomType || '',
    documentUploaded: false,
    documentVerified: false,
    signatureCompleted: false,
    isProcessing: false,
    checkInComplete: false
  });
  const [voiceFilledFields, setVoiceFilledFields] = useState<Set<string>>(new Set());

  const steps = ['Guest Information', 'Document Verification', 'Check-in Summary'];

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

  const handleComplete = () => {
    setFormData(prev => ({ ...prev, isProcessing: true }));
    
    // Simulate check-in process
    setTimeout(() => {
      setFormData(prev => ({ 
        ...prev, 
        isProcessing: false, 
        checkInComplete: true 
      }));
      
      // Auto-close after showing success
      setTimeout(() => {
        onClose();
      }, 3000);
    }, 2000);
  };

  const handleCameraCapture = () => {
    setFormData(prev => ({ ...prev, documentUploaded: true }));
    
    // Simulate document verification
    setTimeout(() => {
      setFormData(prev => ({ ...prev, documentVerified: true }));
    }, 2000);
  };

  const handleVoiceProcessed = (result: any) => {
    const voiceResult = result as ProcessedVoiceResponse;
    
    if (voiceResult.extractedData) {
      const updates: any = {};
      const newVoiceFields = new Set(voiceFilledFields);
      
      if (voiceResult.extractedData.guestName) {
        updates.name = voiceResult.extractedData.guestName;
        newVoiceFields.add('name');
      }
      if (voiceResult.extractedData.checkIn) {
        updates.checkInDate = voiceResult.extractedData.checkIn;
        newVoiceFields.add('checkInDate');
      }
      if (voiceResult.extractedData.roomType) {
        updates.roomType = voiceResult.extractedData.roomType;
        newVoiceFields.add('roomType');
      }
      
      // Extract confirmation number from entities
      if (voiceResult.extractedData.confirmationNumber) {
        updates.confirmationNumber = voiceResult.extractedData.confirmationNumber;
        newVoiceFields.add('confirmationNumber');
      }
      
      if (Object.keys(updates).length > 0) {
        setFormData(prev => ({ ...prev, ...updates }));
        setVoiceFilledFields(newVoiceFields);
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
              <Person color="primary" />
              Guest Information
            </Typography>
            
            {/* Voice Input */}
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <VoiceInput
                onVoiceProcessed={handleVoiceProcessed}
                currentStep="check-in"
                reservationData={formData}
                size={isMobile ? "small" : "medium"}
                showTranscript={true}
              />
            </Box>
            
            <Grid container spacing={{ xs: 2, md: 3 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size={isMobile ? 'small' : 'medium'}
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter full name"
                  sx={getFieldSx('name')}
                  helperText={isVoiceFilled('name') ? '✓ Filled by voice' : ''}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size={isMobile ? 'small' : 'medium'}
                  label="Confirmation Number"
                  value={formData.confirmationNumber}
                  onChange={(e) => setFormData({...formData, confirmationNumber: e.target.value})}
                  placeholder="LG123456"
                  sx={getFieldSx('confirmationNumber')}
                  helperText={isVoiceFilled('confirmationNumber') ? '✓ Filled by voice' : ''}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size={isMobile ? 'small' : 'medium'}
                  label="Check-in Date"
                  type="date"
                  value={formData.checkInDate}
                  onChange={(e) => setFormData({...formData, checkInDate: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                  sx={getFieldSx('checkInDate')}
                  helperText={isVoiceFilled('checkInDate') ? '✓ Filled by voice' : ''}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                  <InputLabel>Room Type</InputLabel>
                  <Select
                    value={formData.roomType}
                    label="Room Type"
                    onChange={(e) => setFormData({...formData, roomType: e.target.value})}
                    sx={getFieldSx('roomType')}
                  >
                    <MenuItem value="Ocean View King Suite">Ocean View King Suite</MenuItem>
                    <MenuItem value="Deluxe Garden Room">Deluxe Garden Room</MenuItem>
                    <MenuItem value="Family Oceanfront Suite">Family Oceanfront Suite</MenuItem>
                    <MenuItem value="Presidential Suite">Presidential Suite</MenuItem>
                    <MenuItem value="Standard Double Room">Standard Double Room</MenuItem>
                    <MenuItem value="Luxury Spa Suite">Luxury Spa Suite</MenuItem>
                  </Select>
                  {isVoiceFilled('roomType') && (
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
              <CreditCard color="primary" />
              Document Verification
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Please capture or upload a photo of your identification document for verification.
            </Typography>
            
            {!formData.documentUploaded && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<CameraAlt />}
                    onClick={handleCameraCapture}
                    sx={{ py: { xs: 1.5, md: 2 } }}
                    size={isMobile ? 'medium' : 'large'}
                  >
                    Start Camera
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Upload />}
                    onClick={() => setFormData({...formData, documentUploaded: true})}
                    sx={{ py: { xs: 1.5, md: 2 } }}
                    size={isMobile ? 'medium' : 'large'}
                  >
                    Upload Document
                  </Button>
                </Grid>
              </Grid>
            )}
            
            {formData.documentUploaded && !formData.documentVerified && (
              <Paper sx={{ p: 3, mt: 3, bgcolor: 'info.light', textAlign: 'center' }}>
                <CircularProgress sx={{ mb: 2 }} />
                <Typography variant="body2" color="info.contrastText">
                  Verifying document...
                </Typography>
              </Paper>
            )}
            
            {formData.documentVerified && (
              <Fade in={true}>
                <Paper sx={{ p: 3, mt: 3, bgcolor: 'success.light', textAlign: 'center' }}>
                  <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                  <Typography variant="h6" color="success.main" gutterBottom>
                    Document Verified Successfully!
                  </Typography>
                  <Typography variant="body2" color="success.contrastText">
                    ✓ Identity confirmed
                    <br />
                    ✓ Document authentic
                    <br />
                    ✓ Details match reservation
                  </Typography>
                </Paper>
              </Fade>
            )}
          </Box>
        );

      case 2:
        if (formData.checkInComplete) {
          return (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Fade in={true}>
                <Box>
                  <Verified sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                  <Typography variant="h4" color="success.main" gutterBottom sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
                    Welcome to Lagunacreek!
                  </Typography>
                  <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                    Check-in Complete
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Enjoy your stay, {formData.name}!
                  </Typography>
                </Box>
              </Fade>
            </Box>
          );
        }
        
        if (formData.isProcessing) {
          return (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="h6" gutterBottom>
                Processing Check-in...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please wait while we complete your check-in
              </Typography>
            </Box>
          );
        }
        
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarToday color="primary" />
              Check-in Summary
            </Typography>
            <Paper sx={{ p: { xs: 2, md: 3 }, bgcolor: 'grey.50', mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight="bold">Guest Name:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">{formData.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight="bold">Confirmation:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">{formData.confirmationNumber}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight="bold">Check-in Date:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">{formData.checkInDate}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight="bold">Room Type:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">{formData.roomType}</Typography>
                </Grid>
              </Grid>
            </Paper>
            
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2">
                ✓ Document verified successfully
              </Typography>
            </Alert>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <input
                type="checkbox"
                checked={formData.signatureCompleted}
                onChange={(e) => setFormData({...formData, signatureCompleted: e.target.checked})}
              />
              <Typography variant="body2">
                I confirm that all information is correct and agree to the terms and conditions
              </Typography>
            </Box>
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
            Guest Check-In
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
        {currentStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={
              (currentStep === 0 && (!formData.name || !formData.confirmationNumber)) ||
              (currentStep === 1 && !formData.documentVerified)
            }
            fullWidth={isMobile}
            size={isMobile ? 'large' : 'medium'}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            color="success"
            onClick={handleComplete}
            disabled={!formData.signatureCompleted && !formData.checkInComplete}
            fullWidth={isMobile}
            size={isMobile ? 'large' : 'medium'}
          >
            {formData.isProcessing ? 'Processing...' : 'Complete Check-in'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CheckInModal;