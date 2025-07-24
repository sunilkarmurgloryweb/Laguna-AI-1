import React, { useState, useRef, useEffect } from 'react';
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
  CameraAlt
} from '@mui/icons-material';
import VoiceInput from '../VoiceInput';
import { ProcessedVoiceResponse, VoiceProcessedData, PassportInfo, ReservationSearchResult } from '../../types/reservation';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { selectAllReservations, addCheckIn } from '../../store/slices/mockDataSlice';

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


const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  onClose,
  guestData = {},
  onAIMessage,
  onProcessCompleted
}) => {
  console.log(guestData, "guestData");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const dispatch = useAppDispatch();
  const allReservations = useAppSelector(selectAllReservations);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<{
    searchQuery: string;
    cameraActive: boolean;
    scanningPassport: boolean;
    passportScanned: boolean;
    passportVerified: boolean;
    checkInComplete: boolean;
    isProcessing: boolean;
  }>({
    searchQuery: guestData.confirmationNumber || guestData.name || guestData.guestName || guestData.phone || '', // Initialize with any relevant guestData field
    cameraActive: false,
    scanningPassport: false,
    passportScanned: false,
    passportVerified: false,
    checkInComplete: false,
    isProcessing: false
  });

  const [reservationData, setReservationData] = useState<ReservationSearchResult | null>(null);
  const [passportData, setPassportData] = useState<PassportInfo | null>(null);
  const [roomAssignment, setRoomAssignment] = useState<RoomAssignment | null>(null);
  const [voiceFilledFields, setVoiceFilledFields] = useState<Set<string>>(new Set());

  // Convert formData to VoiceProcessedData format for voice input
  const getVoiceCompatibleData = (): VoiceProcessedData => ({
    searchQuery: formData.searchQuery,
    guestName: formData.searchQuery, // Assuming searchQuery can act as guestName for initial lookup
    confirmationNumber: formData.searchQuery, // Assuming searchQuery can act as confirmationNumber
    phone: formData.searchQuery // Assuming searchQuery can act as phone
  });

  const steps = ['Document Verification', 'Check-in Summary'];

  // Effect for handling camera stream cleanup
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // NEW useEffect for initial guestData processing
  useEffect(() => {
    if (isOpen && (guestData.confirmationNumber || guestData.name || guestData.phone|| guestData.guestName)) {
      const query = guestData.confirmationNumber || guestData.name || guestData.guestName || guestData.phone;
      if (query && formData.searchQuery !== query) { // Prevent re-setting if already set by voice or initial render
        setFormData(prev => ({ ...prev, searchQuery: query }));
        // Simulate immediate search if guestData is provided
        // We'll call handleGuestLookup in a timeout to ensure state updates
        setTimeout(() => {
          const reservation = searchReservation(query);
          setReservationData(reservation);
          if (reservation) {
            // Automatically start camera if reservation is found
            startCamera();
            onAIMessage?.(`Found reservation for ${query}. Please proceed with passport scan.`, true);
          } else {
            onAIMessage?.(`Could not find a reservation for ${query}. Please try again.`, true);
          }
        }, 300); // Small delay to allow state to settle
      }
    }
  }, [isOpen, guestData.confirmationNumber, guestData.name, guestData.phone, onAIMessage]); // Depend on isOpen and guestData fields

  const searchReservation = (query: string): ReservationSearchResult | null => {
    // Search in actual reservations from store
    const lowerQuery = query.toLowerCase();
    const found = allReservations.find(res =>
      res.guestName.toLowerCase().includes(lowerQuery) ||
      res.confirmationNumber.toLowerCase().includes(lowerQuery) ||
      res.phone.includes(query) ||
      res.email.toLowerCase().includes(lowerQuery)
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
        // Ensure status mapping is correct, `checked-in` is a good state for this modal to confirm
        status: found.status === 'confirmed' ? 'Confirmed' : found.status === 'checked-in' ? 'Checked In' : 'Completed',
        totalAmount: found.totalAmount,
        nights: found.nights,
        adults: found.adults,
        children: found.children,
        specialRequests: 'None' // You might want to pull this from your reservation data
      };
    }

    return null;
  };

  const handleGuestLookup = () => {
    const reservation = searchReservation(formData.searchQuery);
    setReservationData(reservation);

    if (reservation) {
      onAIMessage?.(`Found reservation for ${reservation.guestName}. Please proceed with passport scan.`, true);
      // Start camera for passport verification
      setTimeout(() => {
        startCamera();
      }, 500);
    } else {
      onAIMessage?.(`Could not find a reservation for "${formData.searchQuery}". Please double-check the details.`, true);
    }
  };

  const startCamera = async () => {
    try {
      setFormData(prev => ({ ...prev, cameraActive: true }));

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        }
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Camera access error:', error);
      alert('Unable to access camera. Please check permissions.');
      setFormData(prev => ({ ...prev, cameraActive: false })); // Reset cameraActive on error
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setFormData(prev => ({ ...prev, cameraActive: false, scanningPassport: false }));
  };

  const capturePassport = () => {
    if (!videoRef.current || !canvasRef.current || !reservationData) return; // Ensure reservationData exists

    setFormData(prev => ({ ...prev, scanningPassport: true }));

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      // Simulate passport scanning
      setTimeout(() => {
        const mockPassportData: PassportInfo = {
          name: reservationData.guestName || 'SUNIL KARMUR', // Use actual guest name from reservation
          passportNumber: 'P123456789', // Mock data
          nationality: 'IND', // Mock data
          dateOfBirth: '1985-03-15', // Mock data
          expiryDate: '2030-03-15', // Mock data
          photo: canvas.toDataURL()
        };

        setPassportData(mockPassportData);
        setFormData(prev => ({
          ...prev,
          passportScanned: true,
          scanningPassport: false
        }));
        onAIMessage?.("Passport scanned. Verifying identity...", true);

        // Verify passport
        setTimeout(() => {
          // In a real application, you'd compare passportData.name with reservationData.guestName
          // For now, we'll assume it's verified if data is present.
          const isVerified = mockPassportData.name.toLowerCase() === reservationData.guestName.toLowerCase();

          setFormData(prev => ({ ...prev, passportVerified: isVerified }));
          stopCamera();

          if (isVerified) {
            onAIMessage?.("Identity verified successfully! Preparing room assignment.", true);
            // Assign room and move to summary
            setTimeout(() => {
              assignRoomAndProceed();
            }, 1500);
          } else {
            onAIMessage?.("Identity verification failed. Please ensure the passport matches the reservation name or try again.", true);
            setPassportData(null); // Clear passport data if verification fails
            setFormData(prev => ({ ...prev, passportScanned: false })); // Allow re-scan
          }

        }, 2000);
      }, 3000);
    }
  };

  const assignRoomAndProceed = () => {
    if (!reservationData) return; // Ensure reservation data is available

    // Assign room based on reservation (you might have a more complex logic here)
    const assignment: RoomAssignment = {
      roomNumber: '501', // This should ideally be dynamically assigned based on room type and availability
      floor: 5, // Example
      roomType: reservationData.roomType || 'Ocean View King Suite',
      keyCards: reservationData.adults > 0 ? reservationData.adults : 2, // Default to 2 key cards or based on adults
      amenities: ['Ocean View', 'King Bed', 'Balcony', 'Mini Bar', 'WiFi', 'Room Service'], // Example
      checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      checkOutTime: 'Flexible'
    };

    setRoomAssignment(assignment);
    setCurrentStep(1);
    onAIMessage?.(`Room ${assignment.roomNumber} assigned. Please review the check-in summary.`, true);
  };

  const completeCheckIn = () => {
    setFormData(prev => ({ ...prev, isProcessing: true }));

    if (reservationData && roomAssignment) {
      // Add check-in to store
      dispatch(addCheckIn({
        reservationId: reservationData.id,
        roomNumber: roomAssignment.roomNumber,
        keyCards: roomAssignment.keyCards
      }));

      // Notify parent component about completion
      onProcessCompleted?.({
        guestName: reservationData.guestName,
        roomNumber: roomAssignment.roomNumber,
        roomType: reservationData.roomType,
        confirmationNumber: reservationData.confirmationNumber
      });
      onAIMessage?.(`Check-in complete for ${reservationData.guestName}. Welcome!`, true);
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
        onClose(); // Close modal after successful check-in
      }, 3000);
    }, 2000);
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
      const updates: Partial<typeof formData> = {}; // Use typeof formData for type safety
      const newVoiceFields = new Set(voiceFilledFields);

      // Prioritize confirmationNumber, then guestName, then phone for search query
      if (voiceResult.extractedData.confirmationNumber) {
        updates.searchQuery = voiceResult.extractedData.confirmationNumber;
        newVoiceFields.add('searchQuery');
      } else if (voiceResult.extractedData.guestName) {
        updates.searchQuery = voiceResult.extractedData.guestName;
        newVoiceFields.add('searchQuery');
      } else if (voiceResult.extractedData.phone) {
        updates.searchQuery = voiceResult.extractedData.phone;
        newVoiceFields.add('searchQuery');
      }

      if (Object.keys(updates).length > 0) {
        setFormData(prev => ({ ...prev, ...updates }));
        setVoiceFilledFields(newVoiceFields);

        // Automatically trigger search if a query is extracted
        setTimeout(() => {
          handleGuestLookup();
        }, 1000);
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
              <Scanner color="primary" />
              Document Verification
            </Typography>

            {!reservationData ? (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Enter guest name, confirmation number, or mobile number to find reservation.
                </Typography>

                <Box sx={{ mb: 3, textAlign: 'center' }}>
                  <VoiceInput
                    onVoiceProcessed={handleVoiceProcessed}
                    currentStep="check-in"
                    reservationData={getVoiceCompatibleData()}
                    size={isMobile ? "small" : "medium"}
                    showTranscript={true}
                  />
                </Box>

                <TextField
                  fullWidth
                  size={isMobile ? 'small' : 'medium'}
                  label="Guest Name / Confirmation Number / Mobile"
                  value={formData.searchQuery}
                  onChange={(e) => setFormData({...formData, searchQuery: e.target.value})}
                  placeholder="Sunil Karmur or 8128273972 or +91-9876543210"
                  sx={getFieldSx('searchQuery')}
                  helperText={isVoiceFilled('searchQuery') ? '✓ Filled by voice' : 'Example: Sunil Karmur or 8128273972'}
                />

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleGuestLookup}
                  disabled={!formData.searchQuery}
                  sx={{ mt: 3, py: { xs: 1.5, md: 2 } }}
                  size={isMobile ? 'medium' : 'large'}
                >
                  Find Reservation
                </Button>
              </Box>
            ) : (
              <Box>
                {/* Display found reservation details */}
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Reservation Found!</strong> Guest: {reservationData.guestName} (Confirmation: {reservationData.confirmationNumber})
                  </Typography>
                </Alert>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Please scan your passport for identity verification.
                </Typography>

                {/* Camera View */}
                <Paper sx={{
                  position: 'relative',
                  mb: 3,
                  borderRadius: 2,
                  overflow: 'hidden',
                  bgcolor: 'black',
                  aspectRatio: isMobile ? '4/3' : '16/9'
                }}>
                  <video
                    ref={videoRef}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    autoPlay
                    playsInline
                    muted
                  />

                  {/* Passport Frame Overlay */}
                  <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: { xs: '80%', md: '60%' },
                    height: { xs: '60%', md: '40%' },
                    border: '3px solid',
                    borderColor: formData.scanningPassport ? 'warning.main' : 'primary.main',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: formData.scanningPassport ? 'pulse 1s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { borderColor: 'warning.main' },
                      '50%': { borderColor: 'success.main' },
                      '100%': { borderColor: 'warning.main' }
                    }
                  }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'white',
                        textAlign: 'center',
                        bgcolor: 'rgba(0,0,0,0.7)',
                        p: 1,
                        borderRadius: 1
                      }}
                    >
                      {formData.scanningPassport ? 'Scanning...' : 'Position passport here'}
                    </Typography>
                  </Box>

                  {/* Scanning Progress */}
                  {formData.scanningPassport && (
                    <Box sx={{
                      position: 'absolute',
                      bottom: 16,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      bgcolor: 'rgba(0,0,0,0.8)',
                      color: 'white',
                      p: 2,
                      borderRadius: 2
                    }}>
                      <CircularProgress size={20} color="inherit" />
                      <Typography variant="body2">
                        Scanning passport...
                      </Typography>
                    </Box>
                  )}
                </Paper>

                {/* Camera Controls */}
                <Grid container spacing={2}>
                  <Grid item xs={6}> {/* Changed size prop to item prop */}
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={capturePassport}
                      disabled={!formData.cameraActive || formData.scanningPassport || formData.passportScanned}
                      startIcon={<Scanner />}
                      sx={{ py: { xs: 1.5, md: 2 } }}
                    >
                      {formData.scanningPassport ? 'Scanning...' : 'Scan Passport'}
                    </Button>
                  </Grid>
                  <Grid item xs={6}> {/* Changed size prop to item prop */}
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={formData.cameraActive ? stopCamera : startCamera}
                      startIcon={formData.cameraActive ? <Stop /> : <CameraAlt />}
                      sx={{ py: { xs: 1.5, md: 2 } }}
                    >
                      {formData.cameraActive ? 'Stop Camera' : 'Start Camera'}
                    </Button>
                  </Grid>
                </Grid>

                {/* Passport Verification Result */}
                {passportData && (
                  <Fade in={true}>
                    <Paper sx={{ p: 3, mt: 3, bgcolor: formData.passportVerified ? 'success.light' : 'error.light' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        {formData.passportVerified ? (
                          <CheckCircle sx={{ color: 'success.main', fontSize: 32 }} />
                        ) : (
                          <Close sx={{ color: 'error.main', fontSize: 32 }} />
                        )}
                        <Typography variant="h6" color={formData.passportVerified ? 'success.main' : 'error.main'}>
                          Identity {formData.passportVerified ? 'Verified Successfully!' : 'Verification Failed!'}
                        </Typography>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" fontWeight="bold">Name:</Typography>
                          <Typography variant="body2">{passportData.name}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" fontWeight="bold">Passport Number:</Typography>
                          <Typography variant="body2">{passportData.passportNumber}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" fontWeight="bold">Nationality:</Typography>
                          <Typography variant="body2">{passportData.nationality}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" fontWeight="bold">Expiry Date:</Typography>
                          <Typography variant="body2">{passportData.expiryDate}</Typography>
                        </Grid>
                      </Grid>
                      {!formData.passportVerified && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                          The scanned passport name does not match the reservation. Please verify details or try scanning again.
                        </Alert>
                      )}
                    </Paper>
                  </Fade>
                )}
              </Box>
            )}

            <canvas ref={canvasRef} style={{ display: 'none' }} />
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
                    Enjoy your stay, {reservationData?.guestName || 'Guest'}! {/* Safely access guestName */}
                  </Typography>
                </Box>
              </Fade>
            ) : (
              <Box>
                {/* Guest Information */}
                <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, bgcolor: 'grey.50' }}>
                  <Typography variant="h6" gutterBottom>Guest Information</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="bold">Guest Name:</Typography>
                      <Typography variant="body2">{reservationData?.guestName}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="bold">Confirmation:</Typography>
                      <Typography variant="body2">{reservationData?.confirmationNumber}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="bold">Check-in Date:</Typography>
                      <Typography variant="body2">{reservationData?.checkInDate}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="bold">Check-out Date:</Typography>
                      <Typography variant="body2">{reservationData?.checkOutDate}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" fontWeight="bold">Phone:</Typography>
                      <Typography variant="body2">{reservationData?.phone}</Typography>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Room Assignment */}
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
          {currentStep === 1 && roomAssignment && !formData.isProcessing && (
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