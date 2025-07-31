import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Chip,
  Avatar
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  CameraAlt,
  Scanner,
  Stop,
  Refresh,
  CheckCircle,
  DocumentScanner as DocumentIcon,
  CreditCard,
  Badge,
  ContactPage
} from '@mui/icons-material';

interface DocumentData {
  name: string;
  documentNumber: string;
  documentType: 'passport' | 'pan' | 'license' | 'green_card';
  nationality?: string;
  dateOfBirth?: string;
  expiryDate?: string;
  photo?: string;
}

interface DocumentScannerProps {
  onScanComplete: (data: DocumentData) => void;
  onError: (error: string) => void;
  isActive: boolean;
}

const DocumentScanner: React.FC<DocumentScannerProps> = ({
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
  const [detectedDocType, setDetectedDocType] = useState<DocumentData['documentType'] | null>(null);

  const documentTypes = {
    'passport': { 
      name: 'Passport', 
      icon: <ContactPage />, 
      color: 'primary',
      description: 'International travel document'
    },
    'pan': { 
      name: 'PAN Card', 
      icon: <CreditCard />, 
      color: 'secondary',
      description: 'Permanent Account Number'
    },
    'license': { 
      name: 'Driving License', 
      icon: <Badge />, 
      color: 'success',
      description: 'Government issued ID'
    },
    'green_card': { 
      name: 'Green Card', 
      icon: <ContactPage />, 
      color: 'info',
      description: 'US Permanent Resident Card'
    }
  };

  // Auto-start camera when component becomes active
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
    setDetectedDocType(null);
  };

  // Auto-detect document type based on scanned content
  const detectDocumentType = (extractedText: string[]): DocumentData['documentType'] => {
    const text = extractedText.join(' ').toLowerCase();
    
    // Passport detection
    if (text.includes('passport') || text.includes('united states of america') || 
        text.includes('republic of india') || text.includes('type p')) {
      return 'passport';
    }
    
    // PAN Card detection
    if (text.includes('permanent account number') || text.includes('income tax department') ||
        /[a-z]{5}\d{4}[a-z]/i.test(text)) {
      return 'pan';
    }
    
    // Driving License detection
    if (text.includes('driving license') || text.includes('driver license') ||
        text.includes('department of motor vehicles') || text.includes('dl no')) {
      return 'license';
    }
    
    // Green Card detection
    if (text.includes('permanent resident card') || text.includes('united states of america') ||
        text.includes('uscis') || text.includes('green card')) {
      return 'green_card';
    }
    
    // Default to passport if uncertain
    return 'passport';
  };

  const scanDocument = async () => {
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
          return prev + 12;
        });
      }, 250);

      // Capture image from video
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        // Simulate OCR processing delay
        await new Promise(resolve => setTimeout(resolve, 2500));

        // Simulate OCR text extraction
        const extractedText = await extractTextFromImage(canvas.toDataURL());
        
        // Auto-detect document type
        const detectedType = detectDocumentType(extractedText);
        setDetectedDocType(detectedType);

        // Generate mock document data based on detected type
        const mockDocumentData = generateMockDocumentData(detectedType);
        mockDocumentData.photo = canvas.toDataURL('image/jpeg', 0.8);

        // Validate extracted data
        if (validateDocumentData(mockDocumentData)) {
          onScanComplete(mockDocumentData);
          stopCamera();
        } else {
          throw new Error('Invalid document data extracted');
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

  // Simulate OCR text extraction
  const extractTextFromImage = async (imageData: string): Promise<string[]> => {
    // In a real implementation, this would use OCR libraries like Tesseract.js
    // For now, return mock extracted text based on random document type
    const mockTexts = {
      passport: [
        'PASSPORT',
        'UNITED STATES OF AMERICA',
        'SMITH, JOHN MICHAEL',
        'P123456789',
        'USA',
        '15 MAR 1985',
        '15 MAR 2030',
        'M',
        'NEW YORK, USA'
      ],
      pan: [
        'PERMANENT ACCOUNT NUMBER',
        'INCOME TAX DEPARTMENT',
        'GOVT. OF INDIA',
        'JOHN SMITH',
        'ABCDE1234F',
        '15/03/1985'
      ],
      license: [
        'DRIVING LICENSE',
        'DEPARTMENT OF MOTOR VEHICLES',
        'JOHN SMITH',
        'DL123456789',
        '15 MAR 1985',
        '15 MAR 2028',
        'CLASS C'
      ],
      green_card: [
        'PERMANENT RESIDENT CARD',
        'UNITED STATES OF AMERICA',
        'USCIS',
        'JOHN SMITH',
        'GC123456789',
        '15 MAR 1985',
        '15 MAR 2035'
      ]
    };

    // Randomly select a document type for simulation
    const types = Object.keys(mockTexts) as (keyof typeof mockTexts)[];
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    return mockTexts[randomType];
  };

  const generateMockDocumentData = (docType: DocumentData['documentType']): DocumentData => {
    const names = ['JOHN SMITH', 'SARAH JOHNSON', 'MICHAEL BROWN', 'EMILY DAVIS', 'DAVID WILSON'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    
    switch (docType) {
      case 'passport':
        return {
          name: randomName,
          documentNumber: 'P' + Math.random().toString().substr(2, 8),
          documentType: 'passport',
          nationality: 'USA',
          dateOfBirth: '1985-03-15',
          expiryDate: '2030-03-15'
        };
      case 'pan':
        return {
          name: randomName,
          documentNumber: 'ABCDE' + Math.random().toString().substr(2, 4) + 'F',
          documentType: 'pan',
          dateOfBirth: '1985-03-15'
        };
      case 'license':
        return {
          name: randomName,
          documentNumber: 'DL' + Math.random().toString().substr(2, 8),
          documentType: 'license',
          dateOfBirth: '1985-03-15',
          expiryDate: '2028-03-15'
        };
      case 'green_card':
        return {
          name: randomName,
          documentNumber: 'GC' + Math.random().toString().substr(2, 8),
          documentType: 'green_card',
          nationality: 'USA',
          expiryDate: '2035-03-15'
        };
      default:
        return {
          name: randomName,
          documentNumber: 'DOC' + Math.random().toString().substr(2, 6),
          documentType: 'passport'
        };
    }
  };

  const validateDocumentData = (data: DocumentData): boolean => {
    return !!(
      data.name &&
      data.documentNumber &&
      data.documentType &&
      data.name.length > 2 &&
      data.documentNumber.length > 3
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
      {/* Document Type Detection Display */}
      {detectedDocType && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'success.light' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle color="success" />
            <Typography variant="h6" color="success.main">
              Detected: {documentTypes[detectedDocType].name}
            </Typography>
          </Box>
          <Typography variant="body2" color="success.contrastText">
            {documentTypes[detectedDocType].description}
          </Typography>
        </Paper>
      )}

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
        
        {/* Document Frame Overlay */}
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
            {isScanning ? 'Scanning and identifying document...' : 'Position document within frame'}
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
              {scanProgress < 50 ? 'Capturing image...' : 
               scanProgress < 80 ? 'Identifying document type...' : 
               'Extracting information...'}
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
            onClick={scanDocument}
            disabled={!stream || isScanning}
            startIcon={isScanning ? <CircularProgress size={20} /> : <Scanner />}
            sx={{ py: { xs: 1.5, md: 2 } }}
            size={isMobile ? 'medium' : 'large'}
          >
            {isScanning ? 'Scanning...' : 'Scan Document'}
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
          <strong>AI will automatically identify your document type:</strong>
        </Typography>
        <Typography variant="body2" component="ul" sx={{ mt: 1, pl: 2 }}>
          <li>Passport - International travel document</li>
          <li>PAN Card - Permanent Account Number</li>
          <li>Driving License - Government issued ID</li>
          <li>Green Card - US Permanent Resident Card</li>
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          <strong>Tips:</strong> Ensure good lighting, hold document flat and steady, avoid glare.
        </Typography>
      </Alert>
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </Box>
  );
};

export default DocumentScanner;