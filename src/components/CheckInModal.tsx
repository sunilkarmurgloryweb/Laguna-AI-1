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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  CalendarToday,
  CreditCard,
  CameraAlt,
  Upload,
  CheckCircle,
  Verified,
  Hotel,
  Key,
  Scanner,
  Refresh,
  Stop
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
    phone?: string;
  };
}

interface PassportData {
  name: string;
  passportNumber: string;
  nationality: string;
  dateOfBirth: string;
  expiryDate: string;
  photo?: string;
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
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    searchQuery: guestData.confirmationNumber || guestData.name || '',
    name: guestData.name || '',
    confirmationNumber: guestData.confirmationNumber || '',
    checkInDate: guestData.checkInDate || '',
    roomType: guestData.roomType || '',
    phone: guestData.phone || '',
    passportScanned: false,
    passportVerified: false,
    roomAssigned: false,
    isProcessing: false,
    checkInComplete: false,
    cameraActive: false,
    scanningPassport: false
  });
  
  const [passportData, setPassportData] = useState<PassportData | null>(null);
  const [roomAssignment, setRoomAssignment] = useState<RoomAssignment | null>(null);
  const [voiceFilledFields, setVoiceFilledFields] = useState<Set<string>>(new Set());

  const steps = ['Guest Lookup', 'Passport Scan', 'Room Assignment', 'Check-in Complete'];

  // Available rooms by type
  const availableRooms = {
    'Ocean View King Suite': [
      { number: '501', floor: 5, keyCards: 2 },
      { number: '502', floor: 5, keyCards: 2 },
      { number: '601', floor: 6, keyCards: 2 }
    ],
    'Deluxe Garden Room': [
      { number: '201', floor: 2, keyCards: 2 },
      { number: '202', floor: 2, keyCards: 2 },
      { number: '301', floor: 3, keyCards: 2 }
    ],
    'Family Oceanfront Suite': [
      { number: '701', floor: 7, keyCards: 3 },
      { number: '702', floor: 7, keyCards: 3 }
    ],
    'Presidential Suite': [
      { number: '801', floor: 8, keyCards: 4 }
    ],
    'Standard Double Room': [
      { number: '101', floor: 1, keyCards: 2 },
      { number: '102', floor: 1, keyCards: 2 },
      { number: '103', floor: 1, keyCards: 2 }
    ],
    'Luxury Spa Suite': [
      { number: '401', floor: 4, keyCards: 2 },
      { number: '402', floor: 4, keyCards: 2 }
    ]
  };

  const roomAmenities = {
    'Ocean View King Suite': ['Ocean View', 'King Bed', 'Balcony', 'Mini Bar', 'WiFi', 'Room Service'],
    'Deluxe Garden Room': ['Garden View', 'Queen Bed', 'Work Desk', 'Coffee Maker', 'WiFi'],
    'Family Oceanfront Suite': ['Ocean View', '2 Queen Beds', 'Living Area', 'Kitchenette', 'WiFi', 'Balcony'],
    'Presidential Suite': ['Panoramic View', 'King Bed', 'Private Terrace', 'Butler Service', 'WiFi', 'Jacuzzi'],
    'Standard Double Room': ['City View', 'Double Bed', 'Work Desk', 'WiFi'],
    'Luxury Spa Suite': ['Ocean View', 'Private Spa', 'Balcony', 'Kitchenette', 'WiFi', 'Massage Chair']
  };

  useEffect(() => {
    // Auto-start camera if we have guest data
    if (formData.searchQuery && currentStep === 0) {
      handleGuestFound();
    }
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup camera stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleGuestFound = () => {
    // Simulate guest lookup
    setFormData(prev => ({ 
      ...prev, 
      name: 'John Smith',
      confirmationNumber: '8128273972',
      checkInDate: new Date().toISOString().split('T')[0],
      roomType: 'Ocean View King Suite',
      phone: '+1-555-0123'
    }));
    
    // Move to passport scan step and start camera
    setCurrentStep(1);
    setTimeout(() => {
      startCamera();
    }, 500);
  };

  const startCamera = async () => {
    try {
      setFormData(prev => ({ ...prev, cameraActive: true }));
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Use back camera on mobile
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
      
      // Simulate passport scanning and OCR
      setTimeout(() => {
        const mockPassportData: PassportData = {
          name: 'JOHN SMITH',
          passportNumber: 'P123456789',
          nationality: 'USA',
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
        
        // Verify passport data
        setTimeout(() => {
          setFormData(prev => ({ ...prev, passportVerified: true }));
          stopCamera();
          
          // Auto-proceed to room assignment
          setTimeout(() => {
            assignRoom();
          }, 1500);
        }, 2000);
      }, 3000);
    }
  };

  const assignRoom = () => {
    const roomType = formData.roomType as keyof typeof availableRooms;
    const availableRoomsForType = availableRooms[roomType];
    
    if (availableRoomsForType && availableRoomsForType.length > 0) {
      const selectedRoom = availableRoomsForType[0]; // Assign first available room
      
      const assignment: RoomAssignment = {
        roomNumber: selectedRoom.number,
        floor: selectedRoom.floor,
        roomType: formData.roomType,
        keyCards: selectedRoom.keyCards,
        amenities: roomAmenities[roomType] || [],
        checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        checkOutTime: 'Flexible'
      };
      
      setRoomAssignment(assignment);
      setFormData(prev => ({ ...prev, roomAssigned: true }));
      setCurrentStep(2);
      
      // Auto-complete check-in
      setTimeout(() => {
        completeCheckIn();
      }, 3000);
    }
  };

  const completeCheckIn = () => {
    setFormData(prev => ({ ...prev, isProcessing: true }));
    
    setTimeout(() => {
      setFormData(prev => ({ 
        ...prev, 
        isProcessing: false, 
        checkInComplete: true 
      }));
      setCurrentStep(3);
      
      // Auto-close after showing success
      setTimeout(() => {
        onClose();
      }, 5000);
    }, 2000);
  };

  const handleVoiceProcessed = (result: any) => {
    const voiceResult = result as ProcessedVoiceResponse;
    
    if (voiceResult.extractedData) {
      const updates: any = {};
      const newVoiceFields = new Set(voiceFilledFields);
      
      if (voiceResult.extractedData.guestName) {
        updates.searchQuery = voiceResult.extractedData.guestName;
        newVoiceFields.add('searchQuery');
      }
      if (voiceResult.extractedData.confirmationNumber) {
        updates.searchQuery = voiceResult.extractedData.confirmationNumber;
        newVoiceFields.add('searchQuery');
      }
      
      if (Object.keys(updates).length > 0) {
        setFormData(prev => ({ ...prev, ...updates }));
        setVoiceFilledFields(newVoiceFields);
        
        // Auto-trigger guest lookup
        setTimeout(() => {
          handleGuestFound();
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
              <Person color="primary" />
              Guest Lookup
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter confirmation number or guest name to begin check-in process.
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
            
            <TextField
              fullWidth
              size={isMobile ? 'small' : 'medium'}
              label="Confirmation Number or Guest Name"
              value={formData.searchQuery}
              onChange={(e) => setFormData({...formData, searchQuery: e.target.value})}
              placeholder="Enter 8128273972 or John Smith"
              sx={getFieldSx('searchQuery')}
              helperText={isVoiceFilled('searchQuery') ? '✓ Filled by voice' : 'Example: 8128273972 or John Smith'}
            />
            
            <Button
              fullWidth
              variant="contained"
              onClick={handleGuestFound}
              disabled={!formData.searchQuery}
              sx={{ mt: 3, py: { xs: 1.5, md: 2 } }}
              size={isMobile ? 'medium' : 'large'}
            >
              Find Guest & Start Check-in
            </Button>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Scanner color="primary" />
              Passport Verification
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Please position your passport in front of the camera for scanning.
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
            
            {/* Passport Data Display */}
            {passportData && formData.passportVerified && (
              <Fade in={true}>
                <Paper sx={{ p: 3, mt: 3, bgcolor: 'success.light' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <CheckCircle sx={{ color: 'success.main', fontSize: 32 }} />
                    <Typography variant="h6" color="success.main">
                      Passport Verified Successfully!
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
            
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Hotel color="primary" />
              Room Assignment
            </Typography>
            
            {roomAssignment ? (
              <Fade in={true}>
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
              </Fade>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="h6">Assigning Room...</Typography>
                <Typography variant="body2" color="text.secondary">
                  Finding the perfect room for your stay
                </Typography>
              </Box>
            )}
            
            {/* Guest Summary */}
            <Paper sx={{ p: { xs: 2, md: 3 }, bgcolor: 'grey.50' }}>
              <Typography variant="h6" gutterBottom>Guest Information</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight="bold">Guest Name:</Typography>
                  <Typography variant="body2">{formData.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight="bold">Confirmation:</Typography>
                  <Typography variant="body2">{formData.confirmationNumber}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight="bold">Check-in Date:</Typography>
                  <Typography variant="body2">{formData.checkInDate}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight="bold">Phone:</Typography>
                  <Typography variant="body2">{formData.phone}</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            {formData.isProcessing ? (
              <Box>
                <CircularProgress size={80} sx={{ mb: 3 }} />
                <Typography variant="h5" gutterBottom sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                  Completing Check-in...
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Preparing your room and key cards
                </Typography>
              </Box>
            ) : (
              <Fade in={true}>
                <Box>
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
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        Your key cards are ready at the front desk
                      </Typography>
                    </Paper>
                  )}
                  
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 3 }}>
                    Enjoy your stay, {formData.name}!
                  </Typography>
                </Box>
              </Fade>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 0:
        return formData.searchQuery.length > 0;
      case 1:
        return formData.passportVerified;
      case 2:
        return formData.roomAssigned;
      default:
        return false;
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

      {currentStep < 3 && (
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
          <Button
            variant="contained"
            onClick={() => {
              if (currentStep === 0) handleGuestFound();
              else if (currentStep === 1 && formData.passportVerified) setCurrentStep(2);
              else if (currentStep === 2 && formData.roomAssigned) completeCheckIn();
            }}
            disabled={!canProceedToNext()}
            fullWidth={isMobile}
            size={isMobile ? 'large' : 'medium'}
          >
            {currentStep === 0 ? 'Start Check-in' : 
             currentStep === 1 ? 'Continue' : 
             currentStep === 2 ? 'Complete Check-in' : 'Next'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default CheckInModal;