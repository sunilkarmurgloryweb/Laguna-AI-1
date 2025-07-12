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
  Grid,
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
  Avatar
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
import VoiceInput from './VoiceInput';
import { ProcessedVoiceResponse, VoiceProcessedData, PassportInfo, ReservationSearchResult } from '../types/reservation';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestData?: VoiceProcessedData;
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
  guestData = {}
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    searchQuery: guestData.confirmationNumber || guestData.name || '',
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

  const steps = ['Document Verification', 'Check-in Summary'];

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const searchReservation = (query: string): ReservationSearchResult | null => {
    // Simulate reservation lookup
    const mockReservations: ReservationSearchResult[] = [
      {
        id: 'RES001',
        guestName: 'Sunil Karmur',
        confirmationNumber: '8128273972',
        phone: '+91-9876543210',
        email: 'sunil.karmur@email.com',
        roomType: 'Ocean View King Suite',
        checkInDate: '2024-01-15',
        checkOutDate: '2024-01-18',
        status: 'Confirmed',
        totalAmount: 897,
        nights: 3,
        adults: 2,
        children: 1,
        specialRequests: 'Late check-in, Ocean view preferred'
      },
      {
        id: 'RES002',
        guestName: 'John Smith',
        confirmationNumber: '8128273973',
        phone: '+1-555-0123',
        email: 'john.smith@email.com',
        roomType: 'Deluxe Garden Room',
        checkInDate: '2024-01-15',
        checkOutDate: '2024-01-17',
        status: 'Confirmed',
        totalAmount: 398,
        nights: 2,
        adults: 2,
        children: 0,
        specialRequests: 'None'
      }
    ];

    const lowerQuery = query.toLowerCase();
    return mockReservations.find(res => 
      res.guestName.toLowerCase().includes(lowerQuery) ||
      res.confirmationNumber.includes(query) ||
      res.phone.includes(query)
    ) || null;
  };

  const handleGuestLookup = () => {
    const reservation = searchReservation(formData.searchQuery);
    setReservationData(reservation);

    if (reservation) {
      // Start camera for passport verification
      setTimeout(() => {
        startCamera();
      }, 500);
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
    if (!videoRef.current || !canvasRef.current) return;

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
          name: reservationData.guestName || 'SUNIL KARMUR',
          passportNumber: 'P123456789',
          nationality: 'IND',
          dateOfBirth: '1985-03-15',
          expiryDate: '2030-03-15',
          photo: canvas.toDataURL()
        };
        
        setPassportData(mockPassportData);
        setFormData(prev => ({ 
          ...prev, 
          passportScanned: true,
          scanningPassport: false
        }));
        
        // Verify passport
        setTimeout(() => {
          setFormData(prev => ({ ...prev, passportVerified: true }));
          stopCamera();
          
          // Assign room and move to summary
          setTimeout(() => {
            assignRoomAndProceed();
          }, 1500);
        }, 2000);
      }, 3000);
    }
  };

  const assignRoomAndProceed = () => {
    // Assign room based on reservation
    const assignment: RoomAssignment = {
      roomNumber: '501',
      floor: 5,
      roomType: reservationData.roomType || 'Ocean View King Suite',
      keyCards: 2,
      amenities: ['Ocean View', 'King Bed', 'Balcony', 'Mini Bar', 'WiFi', 'Room Service'],
      checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      checkOutTime: 'Flexible'
    };
    
    setRoomAssignment(assignment);
    setCurrentStep(1);
  };

  const completeCheckIn = () => {
    setFormData(prev => ({ ...prev, isProcessing: true }));
    
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

  const handleVoiceProcessed = (result: ProcessedVoiceResponse): void => {
    const voiceResult = result as ProcessedVoiceResponse;
    
    if (voiceResult.extractedData) {
      const updates: Partial<typeof formData> = {};
      const newVoiceFields = new Set(voiceFilledFields);
      
      if (voiceResult.extractedData.guestName) {
        updates.searchQuery = voiceResult.extractedData.guestName;
        newVoiceFields.add('searchQuery');
      }
      if (voiceResult.extractedData.confirmationNumber) {
        updates.searchQuery = voiceResult.extractedData.confirmationNumber;
        newVoiceFields.add('searchQuery');
      }
      if (voiceResult.extractedData.phone) {
        updates.searchQuery = voiceResult.extractedData.phone;
        newVoiceFields.add('searchQuery');
      }
      
      if (Object.keys(updates).length > 0) {
        setFormData(prev => ({ ...prev, ...updates }));
        setVoiceFilledFields(newVoiceFields);
        
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
                    reservationData={formData}
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
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Reservation Found!</strong> Guest: {reservationData.guestName}
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
                  <Grid item xs={6}>
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
                  <Grid item xs={6}>
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
                {passportData && formData.passportVerified && (
                  <Fade in={true}>
                    <Paper sx={{ p: 3, mt: 3, bgcolor: 'success.light' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <CheckCircle sx={{ color: 'success.main', fontSize: 32 }} />
                        <Typography variant="h6" color="success.main">
                          Identity Verified Successfully!
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
                    Enjoy your stay, {reservationData.guestName}!
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