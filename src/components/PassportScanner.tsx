import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Grid,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  CameraAlt,
  Scanner,
  Stop,
  Refresh,
  CheckCircle
} from '@mui/icons-material';

interface PassportData {
  name: string;
  passportNumber: string;
  nationality: string;
  dateOfBirth: string;
  expiryDate: string;
  photo?: string;
}

interface PassportScannerProps {
  onScanComplete: (data: PassportData) => void;
  onError: (error: string) => void;
  isActive: boolean;
}

const PassportScanner: React.FC<PassportScannerProps> = ({
  onScanComplete,
  onError,
  isActive
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [cameraError, setCameraError] = useState<string>('');

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive]);

  const startCamera = async () => {
    try {
      setCameraError('');
      
      const constraints = {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: isMobile ? 'environment' : 'user',
          focusMode: 'continuous',
          exposureMode: 'continuous'
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Camera access denied';
      setCameraError(errorMessage);
      onError(`Camera error: ${errorMessage}`);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
    setScanProgress(0);
  };

  const scanPassport = async () => {
    if (!videoRef.current || !canvasRef.current || isScanning) return;

    setIsScanning(true);
    setScanProgress(0);

    try {
      // Simulate scanning progress
      const progressInterval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 300);

      // Capture image from video
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        // Simulate OCR processing delay
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Mock passport data extraction
        const mockPassportData: PassportData = {
          name: 'JOHN SMITH',
          passportNumber: 'P123456789',
          nationality: 'USA',
          dateOfBirth: '1985-03-15',
          expiryDate: '2030-03-15',
          photo: canvas.toDataURL('image/jpeg', 0.8)
        };

        // Validate extracted data
        if (validatePassportData(mockPassportData)) {
          onScanComplete(mockPassportData);
        } else {
          throw new Error('Invalid passport data extracted');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Scanning failed';
      onError(`Scan error: ${errorMessage}`);
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  const validatePassportData = (data: PassportData): boolean => {
    return !!(
      data.name &&
      data.passportNumber &&
      data.nationality &&
      data.dateOfBirth &&
      data.expiryDate &&
      new Date(data.expiryDate) > new Date()
    );
  };

  const retryCamera = () => {
    stopCamera();
    setTimeout(() => {
      startCamera();
    }, 1000);
  };

  if (cameraError) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {cameraError}
        </Alert>
        <Button
          variant="contained"
          onClick={retryCamera}
          startIcon={<Refresh />}
        >
          Retry Camera Access
        </Button>
      </Paper>
    );
  }

  return (
    <Box>
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
          width: { xs: '85%', md: '70%' },
          height: { xs: '65%', md: '45%' },
          border: '3px solid',
          borderColor: isScanning ? 'warning.main' : 'primary.main',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: isScanning ? 'scanPulse 1s infinite' : 'none',
          '@keyframes scanPulse': {
            '0%': { borderColor: 'warning.main', boxShadow: '0 0 0 0 rgba(255, 152, 0, 0.7)' },
            '50%': { borderColor: 'success.main', boxShadow: '0 0 0 10px rgba(76, 175, 80, 0)' },
            '100%': { borderColor: 'warning.main', boxShadow: '0 0 0 0 rgba(255, 152, 0, 0.7)' }
          }
        }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'white', 
              textAlign: 'center',
              bgcolor: 'rgba(0,0,0,0.8)',
              p: { xs: 1, md: 1.5 },
              borderRadius: 1,
              fontSize: { xs: '0.75rem', md: '0.875rem' }
            }}
          >
            {isScanning ? 'Scanning passport...' : 'Position passport within frame'}
          </Typography>
        </Box>
        
        {/* Scanning Progress */}
        {isScanning && (
          <Box sx={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            bgcolor: 'rgba(0,0,0,0.9)',
            color: 'white',
            p: 2,
            borderRadius: 2,
            minWidth: 200
          }}>
            <CircularProgress 
              variant="determinate" 
              value={scanProgress} 
              size={40} 
              color="inherit" 
            />
            <Typography variant="body2" textAlign="center">
              Scanning... {scanProgress}%
            </Typography>
            <Typography variant="caption" textAlign="center" sx={{ opacity: 0.8 }}>
              Hold steady for best results
            </Typography>
          </Box>
        )}

        {/* Scan Lines Animation */}
        {isScanning && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(90deg, transparent 0%, rgba(76, 175, 80, 0.3) 50%, transparent 100%)',
            animation: 'scanLine 2s infinite',
            '@keyframes scanLine': {
              '0%': { transform: 'translateX(-100%)' },
              '100%': { transform: 'translateX(100%)' }
            }
          }} />
        )}
      </Paper>
      
      {/* Camera Controls */}
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Button
            fullWidth
            variant="contained"
            onClick={scanPassport}
            disabled={!stream || isScanning}
            startIcon={isScanning ? <CircularProgress size={20} /> : <Scanner />}
            sx={{ py: { xs: 1.5, md: 2 } }}
            size={isMobile ? 'medium' : 'large'}
          >
            {isScanning ? 'Scanning...' : 'Scan Passport'}
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button
            fullWidth
            variant="outlined"
            onClick={stream ? stopCamera : startCamera}
            startIcon={stream ? <Stop /> : <CameraAlt />}
            sx={{ py: { xs: 1.5, md: 2 } }}
            size={isMobile ? 'medium' : 'large'}
          >
            {stream ? 'Stop Camera' : 'Start Camera'}
          </Button>
        </Grid>
      </Grid>

      {/* Instructions */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Tips for best results:</strong>
        </Typography>
        <Typography variant="body2" component="ul" sx={{ mt: 1, pl: 2 }}>
          <li>Ensure good lighting</li>
          <li>Hold passport flat and steady</li>
          <li>Avoid glare and shadows</li>
          <li>Make sure all text is clearly visible</li>
        </Typography>
      </Alert>
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </Box>
  );
};

export default PassportScanner;