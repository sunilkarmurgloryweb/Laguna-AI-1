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
  MenuItem
} from '@mui/material';
import {
  Close,
  Person,
  CalendarToday,
  CreditCard,
  CameraAlt,
  Upload
} from '@mui/icons-material';

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
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: guestData.name || '',
    confirmationNumber: guestData.confirmationNumber || '',
    checkInDate: guestData.checkInDate || '',
    roomType: guestData.roomType || '',
    documentUploaded: false,
    signatureCompleted: false
  });

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
    console.log('Check-in completed:', formData);
    onClose();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person color="primary" />
              Guest Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter full name"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Confirmation Number"
                  value={formData.confirmationNumber}
                  onChange={(e) => setFormData({...formData, confirmationNumber: e.target.value})}
                  placeholder="LG123456"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Check-in Date"
                  type="date"
                  value={formData.checkInDate}
                  onChange={(e) => setFormData({...formData, checkInDate: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Room Type</InputLabel>
                  <Select
                    value={formData.roomType}
                    label="Room Type"
                    onChange={(e) => setFormData({...formData, roomType: e.target.value})}
                  >
                    <MenuItem value="Ocean View King Suite">Ocean View King Suite</MenuItem>
                    <MenuItem value="Deluxe Garden Room">Deluxe Garden Room</MenuItem>
                    <MenuItem value="Family Oceanfront Suite">Family Oceanfront Suite</MenuItem>
                    <MenuItem value="Presidential Suite">Presidential Suite</MenuItem>
                    <MenuItem value="Standard Double Room">Standard Double Room</MenuItem>
                    <MenuItem value="Luxury Spa Suite">Luxury Spa Suite</MenuItem>
                  </Select>
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
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<CameraAlt />}
                  onClick={() => setFormData({...formData, documentUploaded: true})}
                  sx={{ py: 2 }}
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
                  sx={{ py: 2 }}
                >
                  Upload Document
                </Button>
              </Grid>
            </Grid>
            {formData.documentUploaded && (
              <Paper sx={{ p: 2, mt: 3, bgcolor: 'success.light', color: 'success.contrastText' }}>
                <Typography variant="body2">
                  ✓ Document uploaded successfully
                </Typography>
              </Paper>
            )}
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarToday color="primary" />
              Check-in Summary
            </Typography>
            <Paper sx={{ p: 3, bgcolor: 'grey.50', mb: 3 }}>
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
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" fontWeight="bold">
            Guest Check-In
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
            disabled={
              (currentStep === 0 && (!formData.name || !formData.confirmationNumber)) ||
              (currentStep === 1 && !formData.documentUploaded)
            }
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            color="success"
            onClick={handleComplete}
            disabled={!formData.signatureCompleted}
          >
            Complete Check-in
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CheckInModal;