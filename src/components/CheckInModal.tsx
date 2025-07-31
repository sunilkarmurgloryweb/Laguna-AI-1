import React, { useState, useRef, useEffect } from 'react';
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
  Alert,
  Fade,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Chip,
  Avatar,
  Grid
} from '@mui/material';
import {
  Close,
  Person,
  Scanner,
  CheckCircle,
  Hotel,
  Key,
  Stop,
  CameraAlt,
  DocumentScanner,
  CreditCard,
  Badge
} from '@mui/icons-material';
import VoiceInput from './VoiceInput';
import { ProcessedVoiceResponse, VoiceProcessedData, PassportInfo, ReservationSearchResult } from '../types/reservation';
import { useAppSelector } from '../hooks/useAppSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { selectAllReservations, addCheckIn } from '../store/slices/mockDataSlice';
import DocumentScanner from './DocumentScanner';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestData?: VoiceProcessedData;
  onAIMessage?: (message: string, shouldSpeak?: boolean) => void;
  onProcessCompleted?: (confirmationData: any) => void;
}


interface RoomAssignment {
  roomNumber: string;
  floor: number;
  roomType: string;
  keyCards: number;
  amenities: string[];
  checkInTime: string;
  checkOutTime: string;
}

interface DocumentData {
  name: string;
  documentNumber: string;
  documentType: 'passport' | 'pan' | 'license' | 'green_card';
  nationality?: string;
  dateOfBirth?: string;
  expiryDate?: string;
  photo?: string;
}

const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  onClose,
  guestData = {},
  onAIMessage,
  onProcessCompleted
}) => {

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const dispatch = useAppDispatch();
  const allReservations = useAppSelector(selectAllReservations);


  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<{
    documentScanned: boolean;
    documentVerified: boolean;
    checkInComplete: boolean;
    isProcessing: boolean;
    showDocumentScanner: boolean;
    reservationFound: boolean;
  }>({
    documentScanned: false,
    documentVerified: false,
    checkInComplete: false,
    isProcessing: false,
    showDocumentScanner: true,
    reservationFound: false
  });

  const [reservationData, setReservationData] = useState<ReservationSearchResult | null>(null);
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [roomAssignment, setRoomAssignment] = useState<RoomAssignment | null>(null);
  const [voiceFilledFields, setVoiceFilledFields] = useState<Set<string>>(new Set());


  const steps = ['Document Scan', 'Check-in Summary'];

  // Auto-start document scanner when modal opens
  useEffect(() => {
    if (isOpen) {
      // Automatically show document scanner and speak instruction
      setFormData(prev => ({ ...prev, showDocumentScanner: true }));
      
      // Delay the AI message to allow modal to fully open
      setTimeout(() => {
        onAIMessage?.("Please scan your document. I support Passport, PAN Card, Driving License, and Green Card.", true);
      }, 500);
    }
  }, [isOpen, onAIMessage]);

  // Handle document scan completion
  const handleDocumentScanned = (scannedData: DocumentData) => {
    setDocumentData(scannedData);
    setFormData(prev => ({ 
      ...prev, 
      documentScanned: true,
      showDocumentScanner: false 
    }));

    onAIMessage?.("Document scanned successfully. Searching for your reservation...", true);

    // Search for reservation using scanned document data
    setTimeout(() => {
      const reservation = searchReservationByDocument(scannedData);
      
      if (reservation) {
        setReservationData(reservation);
        setFormData(prev => ({ 
          ...prev, 
          documentVerified: true,
          reservationFound: true 
        }));
        
        onAIMessage?.(`Welcome, ${reservation.guestName}. Reservation found! Preparing your room.`, true);
        
        // Auto-assign room and proceed
        setTimeout(() => {
          assignRoomAndProceed(reservation);
        }, 1500);
      } else {
        setFormData(prev => ({ ...prev, reservationFound: false }));
        onAIMessage?.(`No reservation found for ${scannedData.name}. Would you like to make a new reservation?`, true);
      }
    }, 2000);
  };

  // Search reservation by document data
  const searchReservationByDocument = (docData: DocumentData): ReservationSearchResult | null => {
    const found = allReservations.find(res =>
      res.guestName.toLowerCase().includes(docData.name.toLowerCase()) ||
      res.guestName.toLowerCase().replace(/\s+/g, '').includes(docData.name.toLowerCase().replace(/\s+/g, ''))
    );

    if (found) {
      return {
        id: found.id,
        guestName: found.guestName,
        confirmationNumber: found.confirmationNumber,
        phone: found.phone,
        email: found.email,
        roomType: found.roomType,
        checkInDate: found.checkIn,
        checkOutDate: found.checkOut,
        status: found.status === 'confirmed' ? 'Confirmed' : found.status === 'checked-in' ? 'Checked In' : 'Completed',
        totalAmount: found.totalAmount,
        nights: found.nights,
        adults: found.adults,
        children: found.children,
        specialRequests: 'None'
      };
    }

    return null;
  };

  const assignRoomAndProceed = (reservation: ReservationSearchResult) => {
    if (!reservation) return;

    const assignment: RoomAssignment = {
      roomNumber: generateRoomNumber(reservation.roomType),
      floor: Math.floor(Math.random() * 8) + 1,
      roomType: reservation.roomType,
      keyCards: Math.max(reservation.adults, 2),
      amenities: getRoomAmenities(reservation.roomType),
      checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      checkOutTime: 'Flexible'
    };

    setRoomAssignment(assignment);
    setCurrentStep(1);
    onAIMessage?.(`Room ${assignment.roomNumber} assigned. Please review the check-in summary.`, true);
  };

  const generateRoomNumber = (roomType: string): string => {
    const roomNumbers: Record<string, string[]> = {
      'Ocean View King Suite': ['501', '502', '503', '601', '602'],
      'Deluxe Garden Room': ['201', '202', '203', '301', '302'],
      'Family Oceanfront Suite': ['701', '702', '801'],
      'Presidential Suite': ['901'],
      'Standard Double Room': ['101', '102', '103', '104'],
      'Luxury Spa Suite': ['401', '402']
    };
    
    const availableRooms = roomNumbers[roomType] || ['101'];
    return availableRooms[Math.floor(Math.random() * availableRooms.length)];
  };

  const getRoomAmenities = (roomType: string): string[] => {
    const amenities: Record<string, string[]> = {
      'Ocean View King Suite': ['Ocean View', 'King Bed', 'Balcony', 'Mini Bar', 'WiFi', 'Room Service'],
      'Deluxe Garden Room': ['Garden View', 'Queen Bed', 'Work Desk', 'Coffee Maker', 'WiFi'],
      'Family Oceanfront Suite': ['Ocean View', '2 Queen Beds', 'Living Area', 'Kitchenette', 'WiFi', 'Balcony'],
      'Presidential Suite': ['Panoramic View', 'King Bed', 'Private Terrace', 'Butler Service', 'WiFi', 'Jacuzzi'],
      'Standard Double Room': ['City View', 'Double Bed', 'Work Desk', 'WiFi'],
      'Luxury Spa Suite': ['Ocean View', 'Private Spa', 'Balcony', 'Kitchenette', 'WiFi', 'Massage Chair']
    };
    
    return amenities[roomType] || ['WiFi', 'Room Service'];
  };

  const handleNewReservation = () => {
    onAIMessage?.("Starting new reservation process...", true);
    onClose();
    // This would trigger opening the reservation modal
    // You can emit an event or call a parent function here
  };

  const completeCheckIn = () => {
    setFormData(prev => ({ ...prev, isProcessing: true }));

    if (reservationData && roomAssignment) {
      dispatch(addCheckIn({
        reservationId: reservationData.id,
        roomNumber: roomAssignment.roomNumber,
        keyCards: roomAssignment.keyCards
      }));

      onProcessCompleted?.({
        guestName: reservationData.guestName,
        roomNumber: roomAssignment.roomNumber,
        roomType: reservationData.roomType,
        confirmationNumber: reservationData.confirmationNumber
      });
      
      onAIMessage?.(`Welcome, ${reservationData.guestName}. Checked in.`, true);
    } else {
      onAIMessage?.("Check-in could not be completed due to missing reservation or room assignment details.", true);
    }

    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        isProcessing: false,
        checkInComplete: true
      }));

      setTimeout(() => {
        onClose();
      }, 3000);
    }, 2000);
  };

  // Convert formData to VoiceProcessedData format for voice input
  const getVoiceCompatibleData = (): VoiceProcessedData => ({
    guestName: documentData?.name || '',
    documentNumber: documentData?.documentNumber || ''
  });

  const handleVoiceProcessed = (result: ProcessedVoiceResponse): void => {
    const voiceResult = result as ProcessedVoiceResponse;

    if (onAIMessage) {
      onAIMessage(`User: "${voiceResult.originalInput || 'Voice input received'}"`, false);
      if (voiceResult.text) {
        onAIMessage(`AI: ${voiceResult.text}`, false);
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
              <DocumentScanner color="primary" />
              Document Scan
            </Typography>

            {formData.showDocumentScanner && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Please scan your document for identity verification. Supported documents: Passport, PAN Card, Driving License, Green Card.
                </Typography>

                <DocumentScanner
                  onScanComplete={handleDocumentScanned}
                  onError={(error) => onAIMessage?.(error, true)}
                  isActive={formData.showDocumentScanner}
                />
              </Box>
            )}

            {formData.documentScanned && documentData && (
              <Box>
                <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircle />}>
                  <Typography variant="body2">
                    <strong>Document Scanned Successfully!</strong> 
                    {documentData.documentType.toUpperCase()}: {documentData.name}
                  </Typography>
                </Alert>

                {/* Document Details */}
                <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
                  <Typography variant="h6" gutterBottom>Scanned Document</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" fontWeight="bold">Document Type:</Typography>
                      <Typography variant="body2">{documentData.documentType.toUpperCase()}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" fontWeight="bold">Document Number:</Typography>
                      <Typography variant="body2">{documentData.documentNumber}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" fontWeight="bold">Name:</Typography>
                      <Typography variant="body2">{documentData.name}</Typography>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Reservation Status */}
                {formData.reservationFound && reservationData ? (
                  <Alert severity="success" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                      <strong>Reservation Found!</strong> Welcome, {reservationData.guestName}
                    </Typography>
                  </Alert>
                ) : (
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                      <strong>No reservation found.</strong> Would you like to make a new reservation?
                    </Typography>
                    <Button 
                      variant="contained" 
                      size="small" 
                      sx={{ mt: 2 }}
                      onClick={handleNewReservation}
                    >
                      Make New Reservation
                    </Button>
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Hotel color="primary" />
              Check-in Summary
            </Typography>

            {formData.isProcessing ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="h6">Completing Check-in...</Typography>
                <Typography variant="body2" color="text.secondary">
                  Preparing your room and key cards
                </Typography>
              </Box>
            ) : formData.checkInComplete ? (
              <Fade in={true}>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar sx={{
                    bgcolor: 'success.main',
                    width: { xs: 80, md: 100 },
                    height: { xs: 80, md: 100 },
                    mx: 'auto',
                    mb: 3
                  }}>
                    <Key sx={{ fontSize: { xs: 40, md: 50 } }} />
                  </Avatar>

                  <Typography variant="h4" color="success.main" gutterBottom sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
                    Welcome to Lagunacreek!
                  </Typography>

                  <Typography variant="h5" gutterBottom sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                    Check-in Complete
                  </Typography>

                  {roomAssignment && (
                    <Paper sx={{ p: 3, mt: 3, bgcolor: 'primary.light', maxWidth: 400, mx: 'auto' }}>
                      <Typography variant="h3" fontWeight="bold" color="primary.main" gutterBottom>
                        Room {roomAssignment.roomNumber}
                      </Typography>
                      <Typography variant="body1" color="primary.contrastText">
                        Floor {roomAssignment.floor} • {roomAssignment.keyCards} Key Cards
                      </Typography>
                    </Paper>
                  )}

                  <Typography variant="body1" color="text.secondary" sx={{ mt: 3 }}>
                    Enjoy your stay, {reservationData?.guestName || 'Guest'}!
                  </Typography>
                </Box>
              </Fade>
            ) : (
              <Box>
                {reservationData && (
                  <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, bgcolor: 'grey.50' }}>
                    <Typography variant="h6" gutterBottom>Guest Information</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" fontWeight="bold">Guest Name:</Typography>
                        <Typography variant="body2">{reservationData.guestName}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" fontWeight="bold">Confirmation:</Typography>
                        <Typography variant="body2">{reservationData.confirmationNumber}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" fontWeight="bold">Check-in Date:</Typography>
                        <Typography variant="body2">{reservationData.checkInDate}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" fontWeight="bold">Check-out Date:</Typography>
                        <Typography variant="body2">{reservationData.checkOutDate}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" fontWeight="bold">Phone:</Typography>
                        <Typography variant="body2">{reservationData.phone}</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                )}

                {roomAssignment && (
                  <Card sx={{ mb: 3, border: 2, borderColor: 'success.main' }}>
                    <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h4" fontWeight="bold" color="primary.main">
                          Room {roomAssignment.roomNumber}
                        </Typography>
                        <Chip
                          label={`Floor ${roomAssignment.floor}`}
                          color="primary"
                          size={isMobile ? 'small' : 'medium'}
                        />
                      </Box>

                      <Typography variant="h6" gutterBottom>
                        {roomAssignment.roomType}
                      </Typography>

                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <Typography variant="body2" fontWeight="bold">Check-in Time:</Typography>
                          <Typography variant="body2">{roomAssignment.checkInTime}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" fontWeight="bold">Key Cards:</Typography>
                          <Typography variant="body2">{roomAssignment.keyCards} cards</Typography>
                        </Grid>
                      </Grid>

                      <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                        Room Amenities:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {roomAssignment.amenities.map((amenity, index) => (
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
                )}
              </Box>
            )}
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

      {!formData.checkInComplete && (
        <DialogActions sx={{
          p: { xs: 2, md: 3 },
          bgcolor: 'grey.50',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 0 }
        }}>
          <Button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            fullWidth={isMobile}
            size={isMobile ? 'large' : 'medium'}
          >
            Previous
          </Button>
          <Box sx={{ flex: 1 }} />
          {currentStep === 1 && roomAssignment && !formData.isProcessing && formData.reservationFound && (
            <Button
              variant="contained"
              color="success"
              onClick={completeCheckIn}
              fullWidth={isMobile}
              size={isMobile ? 'large' : 'medium'}
              startIcon={<CheckCircle />}
            >
              Complete Check-in
            </Button>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default CheckInModal;