import React, { useState } from 'react';
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
  Paper,
  LinearProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControlLabel,
  Radio,
  RadioGroup,
  Divider
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Close,
  Receipt,
  CreditCard,
  CheckCircle
} from '@mui/icons-material';
import VoiceInput from './VoiceInput';
import { ProcessedVoiceResponse, VoiceProcessedData } from '../types/reservation';

interface CheckOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestData?: VoiceProcessedData;
  onAIMessage?: (message: string, shouldSpeak?: boolean) => void;
}

const CheckOutModal: React.FC<CheckOutModalProps> = ({ 
  isOpen, 
  onClose,
  guestData = {
    name: 'John Smith',
    room: 'Ocean View King Suite - 205',
    checkIn: 'January 15, 2024',
    checkOut: 'January 17, 2024'
  },
  onAIMessage,
  onProcessCompleted
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [voiceFilledFields, setVoiceFilledFields] = useState<Set<string>>(new Set());

  // Convert data to VoiceProcessedData format for voice input
  const getVoiceCompatibleData = (): VoiceProcessedData => ({
    paymentMethod: paymentMethod,
    guestName: guestData.name,
    room: guestData.room
  });

  const steps = ['Guest Folio', 'Payment Method', 'Checkout Confirmation'];

  const charges = [
    { description: 'Room Charge - Ocean View King Suite', date: '2024-01-15', amount: 299.00 },
    { description: 'Room Charge - Ocean View King Suite', date: '2024-01-16', amount: 299.00 },
    { description: 'Spa Service - Massage Therapy', date: '2024-01-16', amount: 150.00 },
    { description: 'Restaurant - Dinner at Oceanview Grill', date: '2024-01-16', amount: 85.50 }
  ];

  const totalAmount = charges.reduce((sum, charge) => sum + charge.amount, 0);
  const taxes = totalAmount * 0.12;
  const fees = 25.00;
  const finalTotal = totalAmount + taxes + fees;

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

  const handleSettleBalance = () => {
    alert('Checkout completed successfully!');
    onClose();
  };

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
      const newVoiceFields = new Set(voiceFilledFields);
      
      if (voiceResult.extractedData.paymentMethod) {
        const method = voiceResult.extractedData.paymentMethod.toLowerCase();
        if (method.includes('card') || method.includes('credit')) {
          setPaymentMethod('card');
        } else if (method.includes('cash') || method.includes('hotel')) {
          setPaymentMethod('cash');
        }
        newVoiceFields.add('paymentMethod');
        setVoiceFilledFields(newVoiceFields);
      }
    }
  };

  const isVoiceFilled = (field: string) => voiceFilledFields.has(field);
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Receipt color="primary" />
              Guest Folio
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Review your charges and settle any outstanding balance.
            </Typography>

            {/* Guest Information */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" fontWeight="bold">Guest Information</Typography>
                  <Typography variant="body2">Guest Name:</Typography>
                  <Typography variant="body1" fontWeight="medium">{guestData.name}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" fontWeight="bold">Room</Typography>
                  <Typography variant="body1" fontWeight="medium">{guestData.room}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" fontWeight="bold">Check In</Typography>
                  <Typography variant="body1" fontWeight="medium">{guestData.checkIn}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" fontWeight="bold">Check Out</Typography>
                  <Typography variant="body1" fontWeight="medium">{guestData.checkOut}</Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Charge Details */}
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              Charge Details
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {charges.map((charge, index) => (
                    <TableRow key={index}>
                      <TableCell>{charge.description}</TableCell>
                      <TableCell>{charge.date}</TableCell>
                      <TableCell align="right">${charge.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Total Breakdown */}
            <Paper sx={{ p: 2, bgcolor: 'primary.light' }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                Total Outstanding:
              </Typography>
              <Grid container spacing={1}>
                <Grid size={{ xs: 8 }}>
                  <Typography variant="body2">Subtotal</Typography>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Typography variant="body2" align="right">${totalAmount.toFixed(2)}</Typography>
                </Grid>
                <Grid size={{ xs: 8 }}>
                  <Typography variant="body2">Taxes</Typography>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Typography variant="body2" align="right">${taxes.toFixed(2)}</Typography>
                </Grid>
                <Grid size={{ xs: 8 }}>
                  <Typography variant="body2">Fees</Typography>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Typography variant="body2" align="right">${fees.toFixed(2)}</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid size={{ xs: 8 }}>
                  <Typography variant="h6" fontWeight="bold">Total Outstanding:</Typography>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Typography variant="h6" fontWeight="bold" color="primary.main" align="right">
                    ${finalTotal.toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CreditCard color="primary" />
              Payment Method
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select your preferred payment method to settle the outstanding balance.
            </Typography>

            {/* Voice Input */}
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <VoiceInput
                onVoiceProcessed={handleVoiceProcessed}
                currentStep="payment"
                reservationData={getVoiceCompatibleData()}
                size="medium"
                showTranscript={true}
              />
            </Box>
            <RadioGroup
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <Paper sx={{ 
                p: 2, 
                mb: 2,
                backgroundColor: paymentMethod === 'card' && isVoiceFilled('paymentMethod') ? 'success.light' : 'background.paper',
                border: paymentMethod === 'card' && isVoiceFilled('paymentMethod') ? 1 : 0,
                borderColor: 'success.main'
              }}>
                <FormControlLabel
                  value="card"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        Credit/Debit Card on File
                        {paymentMethod === 'card' && isVoiceFilled('paymentMethod') && (
                          <Typography component="span" variant="caption" color="success.main" sx={{ ml: 1 }}>
                            ✓ Selected by voice
                          </Typography>
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        **** **** **** 1234
                      </Typography>
                    </Box>
                  }
                />
              </Paper>

              <Paper sx={{ 
                p: 2,
                backgroundColor: paymentMethod === 'cash' && isVoiceFilled('paymentMethod') ? 'success.light' : 'background.paper',
                border: paymentMethod === 'cash' && isVoiceFilled('paymentMethod') ? 1 : 0,
                borderColor: 'success.main'
              }}>
                <FormControlLabel
                  value="cash"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        Cash Payment
                        {paymentMethod === 'cash' && isVoiceFilled('paymentMethod') && (
                          <Typography component="span" variant="caption" color="success.main" sx={{ ml: 1 }}>
                            ✓ Selected by voice
                          </Typography>
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pay at front desk
                      </Typography>
                    </Box>
                  }
                />
              </Paper>
            </RadioGroup>

            <Paper sx={{ p: 2, mt: 3, bgcolor: 'warning.light' }}>
              <Typography variant="body2" color="warning.contrastText">
                <strong>Note:</strong> Payment will be processed immediately upon confirmation.
              </Typography>
            </Paper>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <CheckCircle color="success" />
              Checkout Confirmation
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Ready to Check Out
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Please review your final charges and confirm checkout.
              </Typography>
            </Box>

            <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
              <Grid container spacing={1}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body1" fontWeight="medium">Total Amount:</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="h5" fontWeight="bold" color="success.main" align="right">
                    ${finalTotal.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">Payment Method:</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" align="right">
                    {paymentMethod === 'card' ? 'Credit Card (**** 1234)' : 'Cash Payment'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            <Paper sx={{ p: 2, bgcolor: 'primary.light' }}>
              <Typography variant="body2" color="primary.contrastText">
                <strong>Thank you for staying with us!</strong> We hope you enjoyed your experience at Lagunacreek Resort & Spa.
              </Typography>
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
            Guest Check-Out
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
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            color="error"
            onClick={handleSettleBalance}
          >
            Settle Balance
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CheckOutModal;