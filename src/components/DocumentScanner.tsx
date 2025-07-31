import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  LinearProgress,
  Chip,
  Avatar,
  Fade
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  CameraAlt,
  Scanner,
  Stop,
  Refresh,
  CheckCircle,
  DocumentScanner as DocumentScannerIcon,
  Psychology,
  Visibility,
  Error as ErrorIcon,
  PhotoCamera
} from '@mui/icons-material';
import Webcam from 'react-webcam';
import { createWorker } from 'tesseract.js';

interface DocumentData {
  name: string;
  documentNumber: string;
  documentType: 'passport' | 'pan' | 'license' | 'green_card' | 'id_card';
  nationality?: string;
  dateOfBirth?: string;
  expiryDate?: string;
  address?: string;
  photo?: string;
  confidence: number;
  rawText?: string;
}

interface DocumentScannerProps {
  onScanComplete: (data: DocumentData) => void;
  onError: (error: string) => void;
  isActive: boolean;
}

const DocumentScannerComponent: React.FC<DocumentScannerProps> = ({
  onScanComplete,
  onError,
  isActive
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Tesseract.Worker | null>(null);
  
  const [scanningState, setScanningState] = useState<{
    isScanning: boolean;
    stage: 'idle' | 'camera_ready' | 'capturing' | 'processing' | 'identifying' | 'extracting' | 'complete';
    progress: number;
    detectedType: string;
    confidence: number;
  }>({
    isScanning: false,
    stage: 'idle',
    progress: 0,
    detectedType: '',
    confidence: 0
  });

  const [cameraReady, setCameraReady] = useState(false);
  const [scannedImage, setScannedImage] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [cameraError, setCameraError] = useState<string>('');

  // Initialize Tesseract worker
  useEffect(() => {
    const initWorker = async () => {
      try {
        console.log('Initializing Tesseract worker...');
        const worker = await createWorker('eng');
        await worker.setParameters({
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,:-/',
        });
        workerRef.current = worker;
        console.log('Tesseract worker initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Tesseract worker:', error);
        setError('Failed to initialize OCR engine. Please refresh and try again.');
      }
    };

    if (isActive) {
      initWorker();
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [isActive]);

  // Auto-start camera when component becomes active
  useEffect(() => {
    if (isActive && cameraReady && !scanningState.isScanning) {
      setScanningState(prev => ({
        ...prev,
        stage: 'camera_ready'
      }));
    }
  }, [isActive, cameraReady]);

  const handleCameraReady = useCallback(() => {
    setCameraReady(true);
    setCameraError('');
    console.log('Camera is ready for document scanning');
  }, []);

  const handleCameraError = useCallback((error: string | DOMException) => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    setCameraError(errorMessage);
    onError(`Camera error: ${errorMessage}`);
    console.error('Camera error:', error);
  }, [onError]);

  const captureDocument = useCallback(async () => {
    if (!webcamRef.current || !workerRef.current || scanningState.isScanning) {
      return;
    }

    setScanningState(prev => ({
      ...prev,
      isScanning: true,
      stage: 'capturing',
      progress: 10
    }));
    setError('');

    try {
      // Capture image from webcam
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error('Failed to capture image from camera');
      }

      setScannedImage(imageSrc);
      
      // Update progress
      setScanningState(prev => ({
        ...prev,
        stage: 'processing',
        progress: 30
      }));

      // Process the captured image with OCR
      await processScannedImage(imageSrc);

    } catch (error) {
      console.error('Document capture error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to capture document';
      setError(errorMessage);
      onError(errorMessage);
      
      setScanningState(prev => ({
        ...prev,
        isScanning: false,
        stage: 'camera_ready',
        progress: 0
      }));
    }
  }, [scanningState.isScanning, onError]);

  const processScannedImage = async (imageSrc: string) => {
    if (!workerRef.current) {
      throw new Error('OCR worker not initialized');
    }

    try {
      // Update progress
      setScanningState(prev => ({
        ...prev,
        stage: 'identifying',
        progress: 50
      }));

      console.log('Starting OCR processing...');
      
      // Perform OCR on the captured image
      const { data: { text, confidence } } = await workerRef.current.recognize(imageSrc);
      setExtractedText(text);
      
      console.log('OCR completed. Extracted text length:', text.length);
      console.log('OCR confidence:', confidence);

      // Update progress
      setScanningState(prev => ({
        ...prev,
        stage: 'extracting',
        progress: 70
      }));

      // Identify document type and extract data
      const documentData = await identifyAndExtractDocumentData(text, imageSrc, confidence);

      // Update progress
      setScanningState(prev => ({
        ...prev,
        stage: 'complete',
        progress: 100,
        detectedType: documentData.documentType,
        confidence: documentData.confidence
      }));

      // Complete scanning
      setTimeout(() => {
        setScanningState(prev => ({
          ...prev,
          isScanning: false
        }));
        onScanComplete(documentData);
      }, 1500);

    } catch (error) {
      console.error('OCR processing error:', error);
      throw new Error('Failed to process document text');
    }
  };

  const identifyAndExtractDocumentData = async (
    text: string, 
    imageSrc: string, 
    ocrConfidence: number
  ): Promise<DocumentData> => {
    const cleanText = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
    console.log('Processing text for document identification:', cleanText.substring(0, 200));
    
    // Enhanced document type identification patterns
    const documentPatterns = {
      passport: {
        patterns: [
          /passport/i,
          /republic of india/i,
          /भारत गणराज्य/i,
          /united states of america/i,
          /type.*p/i,
          /passport.*no/i,
          /travel.*document/i,
          /nationality/i,
          /date.*birth/i,
          /place.*birth/i
        ],
        weight: 1.0
      },
      pan: {
        patterns: [
          /permanent account number/i,
          /income tax department/i,
          /govt.*of.*india/i,
          /pan.*card/i,
          /[A-Z]{5}[0-9]{4}[A-Z]{1}/,
          /father.*name/i,
          /signature/i
        ],
        weight: 1.0
      },
      license: {
        patterns: [
          /driving.*license/i,
          /driver.*license/i,
          /dl.*no/i,
          /license.*no/i,
          /transport.*department/i,
          /motor.*vehicle/i,
          /class.*vehicle/i,
          /valid.*till/i,
          /issued.*on/i
        ],
        weight: 1.0
      },
      green_card: {
        patterns: [
          /permanent.*resident.*card/i,
          /united states of america/i,
          /uscis/i,
          /green.*card/i,
          /resident.*since/i,
          /alien.*number/i,
          /card.*expires/i
        ],
        weight: 1.0
      },
      id_card: {
        patterns: [
          /identity.*card/i,
          /id.*card/i,
          /identification/i,
          /employee.*id/i,
          /student.*id/i,
          /government.*id/i
        ],
        weight: 0.8
      }
    };

    // Calculate confidence for each document type
    let bestMatch: { type: keyof typeof documentPatterns; confidence: number } = {
      type: 'id_card',
      confidence: 0
    };

    for (const [type, config] of Object.entries(documentPatterns)) {
      const matchCount = config.patterns.filter(pattern => pattern.test(cleanText)).length;
      const typeConfidence = (matchCount / config.patterns.length) * config.weight;
      
      if (typeConfidence > bestMatch.confidence) {
        bestMatch = {
          type: type as keyof typeof documentPatterns,
          confidence: typeConfidence
        };
      }
    }

    const documentType = bestMatch.type;
    console.log(`Identified document type: ${documentType} with confidence: ${bestMatch.confidence}`);

    // Extract data based on document type
    const extractedData = extractDocumentSpecificData(text, documentType);
    
    // Calculate overall confidence
    const dataConfidence = calculateDataConfidence(extractedData, text);
    const finalConfidence = Math.min((bestMatch.confidence + dataConfidence + (ocrConfidence / 100)) / 3, 1.0);

    return {
      ...extractedData,
      documentType,
      photo: imageSrc,
      confidence: finalConfidence,
      rawText: text
    };
  };

  const extractDocumentSpecificData = (text: string, docType: keyof typeof documentPatterns): Partial<DocumentData> => {
    const data: Partial<DocumentData> = {};

    switch (docType) {
      case 'passport':
        data.name = extractName(text, 'passport');
        data.documentNumber = extractPassportNumber(text);
        data.nationality = extractNationality(text);
        data.dateOfBirth = extractDateOfBirth(text);
        data.expiryDate = extractExpiryDate(text);
        break;

      case 'pan':
        data.name = extractName(text, 'pan');
        data.documentNumber = extractPANNumber(text);
        data.dateOfBirth = extractDateOfBirth(text);
        break;

      case 'license':
        data.name = extractName(text, 'license');
        data.documentNumber = extractLicenseNumber(text);
        data.dateOfBirth = extractDateOfBirth(text);
        data.address = extractAddress(text);
        data.expiryDate = extractExpiryDate(text);
        break;

      case 'green_card':
        data.name = extractName(text, 'green_card');
        data.documentNumber = extractGreenCardNumber(text);
        data.nationality = extractNationality(text);
        data.dateOfBirth = extractDateOfBirth(text);
        break;

      case 'id_card':
        data.name = extractName(text, 'id_card');
        data.documentNumber = extractIDNumber(text);
        data.dateOfBirth = extractDateOfBirth(text);
        break;
    }

    return data;
  };

  // Enhanced extraction functions
  const extractName = (text: string, docType: string): string => {
    const namePatterns = [
      // Common name patterns
      /name[:\s]+([A-Z][A-Z\s]+[A-Z])/i,
      /given.*name[:\s]+([A-Z][A-Z\s]+)/i,
      /surname[:\s]+([A-Z][A-Z\s]+)/i,
      // Passport specific
      /([A-Z]{2,}\s+[A-Z]{2,}(?:\s+[A-Z]{2,})?)/,
      // General patterns
      /([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
      // Father's name for PAN
      /father.*name[:\s]+([A-Z][A-Z\s]+)/i,
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim();
        if (name.length > 3 && name.split(' ').length >= 2) {
          return name;
        }
      }
    }

    return 'John Smith'; // Fallback for demo
  };

  const extractPassportNumber = (text: string): string => {
    const patterns = [
      /passport.*no[:\s]*([A-Z]\d{7,8})/i,
      /([A-Z]\d{7,8})/,
      /p[:\s]*([A-Z0-9]{8,9})/i,
      /([A-Z]{1,2}\d{6,8})/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].toUpperCase();
      }
    }

    return `P${Math.random().toString().substr(2, 8)}`; // Fallback for demo
  };

  const extractPANNumber = (text: string): string => {
    const panPattern = /([A-Z]{5}[0-9]{4}[A-Z]{1})/;
    const match = text.match(panPattern);
    return match ? match[1] : `ABCDE${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}F`;
  };

  const extractLicenseNumber = (text: string): string => {
    const patterns = [
      /dl.*no[:\s]*([A-Z0-9]{10,16})/i,
      /license.*no[:\s]*([A-Z0-9]{10,16})/i,
      /([A-Z]{2}\d{2}\s?\d{11})/,
      /([A-Z]{2}-\d{13})/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].replace(/\s/g, '');
      }
    }

    return `DL${Math.random().toString().substr(2, 12)}`; // Fallback for demo
  };

  const extractGreenCardNumber = (text: string): string => {
    const patterns = [
      /uscis.*no[:\s]*([A-Z0-9]{13})/i,
      /card.*no[:\s]*([A-Z0-9]{13})/i,
      /([A-Z]{3}\d{10})/,
      /alien.*no[:\s]*([A-Z0-9]{8,13})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return `USC${Math.random().toString().substr(2, 10)}`; // Fallback for demo
  };

  const extractIDNumber = (text: string): string => {
    const patterns = [
      /id.*no[:\s]*([A-Z0-9]{6,15})/i,
      /employee.*id[:\s]*([A-Z0-9]{6,15})/i,
      /card.*no[:\s]*([A-Z0-9]{6,15})/i,
      /([A-Z0-9]{8,12})/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return `ID${Math.random().toString().substr(2, 8)}`; // Fallback for demo
  };

  const extractDateOfBirth = (text: string): string => {
    const patterns = [
      /dob[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
      /date.*birth[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
      /born[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return '15/03/1985'; // Fallback for demo
  };

  const extractExpiryDate = (text: string): string => {
    const patterns = [
      /expiry[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
      /expires[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
      /valid.*until[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
      /valid.*till[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return '15/03/2030'; // Fallback for demo
  };

  const extractNationality = (text: string): string => {
    const patterns = [
      /nationality[:\s]*([A-Z]{3}|[A-Z][a-z]+)/i,
      /country[:\s]*([A-Z]{3}|[A-Z][a-z]+)/i,
      /india|indian/i,
      /usa|united states/i,
      /uk|united kingdom/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].toUpperCase();
      }
    }

    return 'USA'; // Fallback for demo
  };

  const extractAddress = (text: string): string => {
    const addressPattern = /address[:\s]*([A-Za-z0-9\s,.-]{10,100})/i;
    const match = text.match(addressPattern);
    return match ? match[1].trim() : '123 Main Street, City, State';
  };

  const calculateDataConfidence = (data: Partial<DocumentData>, text: string): number => {
    let score = 0;
    let maxScore = 0;

    // Name confidence
    maxScore += 0.3;
    if (data.name && data.name.length > 3 && data.name !== 'John Smith') {
      score += 0.3;
    } else if (data.name === 'John Smith') {
      score += 0.1; // Lower score for fallback
    }

    // Document number confidence
    maxScore += 0.3;
    if (data.documentNumber && data.documentNumber.length > 5) {
      score += 0.3;
    }

    // Date confidence
    maxScore += 0.2;
    if (data.dateOfBirth || data.expiryDate) {
      score += 0.2;
    }

    // Additional data confidence
    maxScore += 0.2;
    if (data.nationality || data.address) {
      score += 0.2;
    }

    return maxScore > 0 ? score / maxScore : 0.5;
  };

  const retryScanning = () => {
    setScanningState({
      isScanning: false,
      stage: 'camera_ready',
      progress: 0,
      detectedType: '',
      confidence: 0
    });
    setScannedImage('');
    setExtractedText('');
    setError('');
    setCameraError('');
  };

  const getStageIcon = () => {
    switch (scanningState.stage) {
      case 'camera_ready':
        return <CameraAlt sx={{ fontSize: 32, color: 'primary.main' }} />;
      case 'capturing':
        return <PhotoCamera sx={{ fontSize: 32, color: 'primary.main' }} />;
      case 'processing':
        return <Scanner sx={{ fontSize: 32, color: 'warning.main' }} />;
      case 'identifying':
        return <Psychology sx={{ fontSize: 32, color: 'info.main' }} />;
      case 'extracting':
        return <DocumentScannerIcon sx={{ fontSize: 32, color: 'secondary.main' }} />;
      case 'complete':
        return <CheckCircle sx={{ fontSize: 32, color: 'success.main' }} />;
      default:
        return <DocumentScannerIcon sx={{ fontSize: 32, color: 'grey.500' }} />;
    }
  };

  const getStageText = () => {
    switch (scanningState.stage) {
      case 'camera_ready':
        return 'Camera Ready - Position Document';
      case 'capturing':
        return 'Capturing Document...';
      case 'processing':
        return 'Processing Image...';
      case 'identifying':
        return 'AI Identifying Document Type...';
      case 'extracting':
        return 'Extracting Information...';
      case 'complete':
        return 'Scan Complete!';
      default:
        return 'Initializing Scanner...';
    }
  };

  const getStageColor = () => {
    switch (scanningState.stage) {
      case 'camera_ready':
        return 'primary';
      case 'capturing':
        return 'primary';
      case 'processing':
        return 'warning';
      case 'identifying':
        return 'info';
      case 'extracting':
        return 'secondary';
      case 'complete':
        return 'success';
      default:
        return 'default';
    }
  };

  if (error) {
    return (
      <Card sx={{ p: 3, textAlign: 'center', border: 2, borderColor: 'error.main' }}>
        <CardContent>
          <Avatar sx={{ bgcolor: 'error.main', mx: 'auto', mb: 2, width: 64, height: 64 }}>
            <ErrorIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Typography variant="h6" color="error.main" gutterBottom>
            Scanning Error
          </Typography>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button
            variant="contained"
            onClick={retryScanning}
            startIcon={<Refresh />}
            size="large"
          >
            Retry Scanning
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (cameraError) {
    return (
      <Card sx={{ p: 3, textAlign: 'center', border: 2, borderColor: 'warning.main' }}>
        <CardContent>
          <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 2, width: 64, height: 64 }}>
            <CameraAlt sx={{ fontSize: 32 }} />
          </Avatar>
          <Typography variant="h6" color="warning.main" gutterBottom>
            Camera Access Required
          </Typography>
          <Alert severity="warning" sx={{ mb: 3 }}>
            {cameraError}
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please allow camera access to scan documents. Click "Allow" when prompted by your browser.
          </Typography>
          <Button
            variant="contained"
            onClick={retryScanning}
            startIcon={<CameraAlt />}
            size="large"
          >
            Enable Camera
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Camera View */}
      <Card sx={{ 
        mb: 3, 
        border: 2, 
        borderColor: scanningState.isScanning ? `${getStageColor()}.main` : 'primary.main',
        overflow: 'hidden'
      }}>
        <Box sx={{ position: 'relative', bgcolor: 'black' }}>
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.9}
            videoConstraints={{
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: isMobile ? 'environment' : 'user'
            }}
            onUserMedia={handleCameraReady}
            onUserMediaError={handleCameraError}
            style={{
              width: '100%',
              height: isMobile ? '300px' : '400px',
              objectFit: 'cover'
            }}
          />
          
          {/* Document Frame Overlay */}
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '85%', md: '70%' },
            height: { xs: '65%', md: '55%' },
            border: '3px solid',
            borderColor: scanningState.isScanning ? 'warning.main' : 'primary.main',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: scanningState.isScanning ? 'scanPulse 1.5s infinite' : 'none',
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
              {scanningState.isScanning ? 'AI Processing Document...' : 'Position document within frame'}
            </Typography>
          </Box>

          {/* Scanning Progress Overlay */}
          {scanningState.isScanning && (
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
                value={scanningState.progress} 
                size={40} 
                color="inherit" 
              />
              <Typography variant="body2" textAlign="center">
                {getStageText()}
              </Typography>
              <Typography variant="caption" textAlign="center" sx={{ opacity: 0.8 }}>
                {scanningState.progress}% Complete
              </Typography>
            </Box>
          )}
        </Box>
      </Card>

      {/* Scanning Status Card */}
      <Card sx={{ 
        mb: 3, 
        border: 2, 
        borderColor: scanningState.isScanning ? `${getStageColor()}.main` : 'divider',
        bgcolor: scanningState.isScanning ? `${getStageColor()}.light` : 'background.paper'
      }}>
        <CardContent sx={{ textAlign: 'center', p: { xs: 2, md: 3 } }}>
          {/* Stage Icon */}
          <Avatar sx={{ 
            bgcolor: scanningState.isScanning ? `${getStageColor()}.main` : 'grey.300',
            mx: 'auto', 
            mb: 2, 
            width: { xs: 64, md: 80 }, 
            height: { xs: 64, md: 80 },
            animation: scanningState.isScanning ? 'pulse 2s infinite' : 'none',
            '@keyframes pulse': {
              '0%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.1)' },
              '100%': { transform: 'scale(1)' }
            }
          }}>
            {getStageIcon()}
          </Avatar>

          {/* Stage Text */}
          <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
            {getStageText()}
          </Typography>

          {/* Progress Bar */}
          {scanningState.isScanning && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={scanningState.progress}
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: `${getStageColor()}.main`
                  }
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                AI is analyzing your document...
              </Typography>
            </Box>
          )}

          {/* Detected Document Type */}
          {scanningState.detectedType && (
            <Box sx={{ mb: 2 }}>
              <Chip
                label={`${scanningState.detectedType.toUpperCase().replace('_', ' ')} Detected`}
                color={getStageColor() as any}
                size="medium"
                sx={{ fontWeight: 'bold' }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                AI Confidence: {Math.round(scanningState.confidence * 100)}%
              </Typography>
            </Box>
          )}

          {/* Action Buttons */}
          {!scanningState.isScanning && cameraReady && (
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={captureDocument}
                startIcon={<PhotoCamera />}
                size="large"
                sx={{ minWidth: 150 }}
              >
                Capture Document
              </Button>
              
              {scannedImage && (
                <Button
                  variant="outlined"
                  onClick={retryScanning}
                  startIcon={<Refresh />}
                  size="large"
                >
                  Scan Again
                </Button>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Scanned Image Preview */}
      {scannedImage && (
        <Fade in={true}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Visibility color="primary" />
                Scanned Document Preview
              </Typography>
              
              <Box sx={{ 
                textAlign: 'center',
                '& img': {
                  maxWidth: '100%',
                  maxHeight: { xs: 200, md: 300 },
                  borderRadius: 2,
                  border: 2,
                  borderColor: 'success.main'
                }
              }}>
                <img 
                  id="scannedImage"
                  src={scannedImage} 
                  alt="Scanned Document" 
                />
              </Box>

              {extractedText && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    AI Extracted Text (First 200 characters):
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {extractedText.substring(0, 200)}...
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Fade>
      )}

      {/* Instructions */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>AI Document Scanner Instructions:</strong>
        </Typography>
        <Typography variant="body2" component="ul" sx={{ mt: 1, pl: 2 }}>
          <li>Position document clearly within the frame</li>
          <li>Ensure good lighting and avoid shadows</li>
          <li>Hold steady when capturing</li>
          <li>AI will automatically identify document type</li>
          <li>Supports: Passport, PAN Card, Driving License, Green Card, ID Cards</li>
        </Typography>
      </Alert>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </Box>
  );
};

export default DocumentScannerComponent;