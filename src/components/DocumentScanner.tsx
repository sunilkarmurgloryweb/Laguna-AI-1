import React, { useState, useRef, useEffect } from 'react';
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
  Error as ErrorIcon
} from '@mui/icons-material';
import { Capacitor } from '@capacitor/core';
import { DocumentScanner as CapacitorDocumentScanner } from 'capacitor-document-scanner';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { createWorker } from 'tesseract.js';

interface DocumentData {
  name: string;
  documentNumber: string;
  documentType: 'passport' | 'pan' | 'license' | 'green_card';
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
  
  const [scanningState, setScanningState] = useState<{
    isScanning: boolean;
    stage: 'idle' | 'capturing' | 'processing' | 'identifying' | 'extracting' | 'complete';
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

  const [scannedImage, setScannedImage] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [error, setError] = useState<string>('');
  const workerRef = useRef<Tesseract.Worker | null>(null);

  // Initialize Tesseract worker
  useEffect(() => {
    const initWorker = async () => {
      try {
        const worker = await createWorker('eng');
        workerRef.current = worker;
        console.log('Tesseract worker initialized');
      } catch (error) {
        console.error('Failed to initialize Tesseract worker:', error);
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

  // Auto-start scanning when component becomes active
  useEffect(() => {
    if (isActive && !scanningState.isScanning) {
      setTimeout(() => {
        startDocumentScan();
      }, 500);
    }
  }, [isActive]);

  const startDocumentScan = async () => {
    if (scanningState.isScanning) return;

    setScanningState(prev => ({
      ...prev,
      isScanning: true,
      stage: 'capturing',
      progress: 10
    }));
    setError('');

    try {
      let imagePath: string;

      if (Capacitor.isNativePlatform()) {
        // Use native document scanner
        const { scannedImages } = await CapacitorDocumentScanner.scanDocument();
          maxNumDocuments: 1,
          letUserAdjustCrop: true,
          croppedImageQuality: 100
        });

        if (scannedImages && scannedImages.length > 0) {
          imagePath = Capacitor.convertFileSrc(scannedImages[0]);
        } else {
          throw new Error('No document was scanned');
        }
      } else {
        // Web fallback using Capacitor Camera
        const image = await Camera.getPhoto({
          quality: 100,
          allowEditing: true,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
          promptLabelHeader: 'Scan Document',
          promptLabelPhoto: 'Take Photo',
          promptLabelPicture: 'Select from Gallery'
        });

        if (image.dataUrl) {
          imagePath = image.dataUrl;
        } else {
          throw new Error('Failed to capture image');
        }
      }

      setScannedImage(imagePath);
      
      // Update progress
      setScanningState(prev => ({
        ...prev,
        stage: 'processing',
        progress: 30
      }));

      // Process the scanned image with OCR
      await processScannedImage(imagePath);

    } catch (error) {
      console.error('Document scanning error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to scan document';
      setError(errorMessage);
      onError(errorMessage);
      
      setScanningState(prev => ({
        ...prev,
        isScanning: false,
        stage: 'idle',
        progress: 0
      }));
    }
  };

  const processScannedImage = async (imagePath: string) => {
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

      // Perform OCR on the scanned image
      const { data: { text } } = await workerRef.current.recognize(imagePath);
      setExtractedText(text);

      // Update progress
      setScanningState(prev => ({
        ...prev,
        stage: 'extracting',
        progress: 70
      }));

      // Identify document type and extract data
      const documentData = await identifyAndExtractDocumentData(text, imagePath);

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
      }, 1000);

    } catch (error) {
      console.error('OCR processing error:', error);
      throw new Error('Failed to process document text');
    }
  };

  const identifyAndExtractDocumentData = async (text: string, imagePath: string): Promise<DocumentData> => {
    const cleanText = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Document type identification patterns
    const documentPatterns = {
      passport: [
        /passport/i,
        /republic of india/i,
        /भारत गणराज्य/i,
        /united states of america/i,
        /type.*p/i,
        /passport.*no/i
      ],
      pan: [
        /permanent account number/i,
        /income tax department/i,
        /govt.*of.*india/i,
        /pan.*card/i,
        /[A-Z]{5}[0-9]{4}[A-Z]{1}/
      ],
      license: [
        /driving.*license/i,
        /driver.*license/i,
        /dl.*no/i,
        /license.*no/i,
        /transport.*department/i,
        /motor.*vehicle/i
      ],
      green_card: [
        /permanent.*resident.*card/i,
        /united states of america/i,
        /uscis/i,
        /green.*card/i,
        /resident.*since/i
      ]
    };

    // Identify document type
    let documentType: DocumentData['documentType'] = 'passport'; // default
    let confidence = 0.5;

    for (const [type, patterns] of Object.entries(documentPatterns)) {
      const matchCount = patterns.filter(pattern => pattern.test(cleanText)).length;
      const typeConfidence = matchCount / patterns.length;
      
      if (typeConfidence > confidence) {
        confidence = typeConfidence;
        documentType = type as DocumentData['documentType'];
      }
    }

    // Extract data based on document type
    const extractedData = extractDocumentSpecificData(cleanText, documentType);
    
    // Calculate overall confidence
    const dataConfidence = calculateDataConfidence(extractedData, cleanText);
    const finalConfidence = Math.min(confidence + dataConfidence, 1.0);

    return {
      ...extractedData,
      documentType,
      photo: imagePath,
      confidence: finalConfidence,
      rawText: cleanText
    };
  };

  const extractDocumentSpecificData = (text: string, docType: DocumentData['documentType']) => {
    const data: Partial<DocumentData> = {};

    switch (docType) {
      case 'passport':
        // Extract passport-specific data
        data.name = extractName(text, 'passport');
        data.documentNumber = extractPassportNumber(text);
        data.nationality = extractNationality(text);
        data.dateOfBirth = extractDateOfBirth(text);
        data.expiryDate = extractExpiryDate(text);
        break;

      case 'pan':
        // Extract PAN card-specific data
        data.name = extractName(text, 'pan');
        data.documentNumber = extractPANNumber(text);
        data.dateOfBirth = extractDateOfBirth(text);
        break;

      case 'license':
        // Extract driving license-specific data
        data.name = extractName(text, 'license');
        data.documentNumber = extractLicenseNumber(text);
        data.dateOfBirth = extractDateOfBirth(text);
        data.address = extractAddress(text);
        data.expiryDate = extractExpiryDate(text);
        break;

      case 'green_card':
        // Extract green card-specific data
        data.name = extractName(text, 'green_card');
        data.documentNumber = extractGreenCardNumber(text);
        data.nationality = extractNationality(text);
        data.dateOfBirth = extractDateOfBirth(text);
        break;
    }

    return data as DocumentData;
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
      // PAN specific
      /([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
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

    return '';
  };

  const extractPassportNumber = (text: string): string => {
    const patterns = [
      /passport.*no[:\s]*([A-Z]\d{7,8})/i,
      /([A-Z]\d{7,8})/,
      /p[:\s]*([A-Z0-9]{8,9})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].toUpperCase();
      }
    }

    return '';
  };

  const extractPANNumber = (text: string): string => {
    const panPattern = /([A-Z]{5}[0-9]{4}[A-Z]{1})/;
    const match = text.match(panPattern);
    return match ? match[1] : '';
  };

  const extractLicenseNumber = (text: string): string => {
    const patterns = [
      /dl.*no[:\s]*([A-Z0-9]{10,16})/i,
      /license.*no[:\s]*([A-Z0-9]{10,16})/i,
      /([A-Z]{2}\d{2}\s?\d{11})/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].replace(/\s/g, '');
      }
    }

    return '';
  };

  const extractGreenCardNumber = (text: string): string => {
    const patterns = [
      /uscis.*no[:\s]*([A-Z0-9]{13})/i,
      /card.*no[:\s]*([A-Z0-9]{13})/i,
      /([A-Z]{3}\d{10})/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return '';
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

    return '';
  };

  const extractExpiryDate = (text: string): string => {
    const patterns = [
      /expiry[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
      /expires[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
      /valid.*until[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return '';
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

    return '';
  };

  const extractAddress = (text: string): string => {
    const addressPattern = /address[:\s]*([A-Za-z0-9\s,.-]{10,100})/i;
    const match = text.match(addressPattern);
    return match ? match[1].trim() : '';
  };

  const calculateDataConfidence = (data: Partial<DocumentData>, text: string): number => {
    let score = 0;
    let maxScore = 0;

    // Name confidence
    maxScore += 0.3;
    if (data.name && data.name.length > 3) {
      score += 0.3;
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

    return maxScore > 0 ? score / maxScore : 0;
  };

  const retryScanning = () => {
    setScanningState({
      isScanning: false,
      stage: 'idle',
      progress: 0,
      detectedType: '',
      confidence: 0
    });
    setScannedImage('');
    setExtractedText('');
    setError('');
    
    setTimeout(() => {
      startDocumentScan();
    }, 500);
  };

  const getStageIcon = () => {
    switch (scanningState.stage) {
      case 'capturing':
        return <CameraAlt sx={{ fontSize: 32, color: 'primary.main' }} />;
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
      case 'capturing':
        return 'Capturing Document...';
      case 'processing':
        return 'Processing Image...';
      case 'identifying':
        return 'Identifying Document Type...';
      case 'extracting':
        return 'Extracting Information...';
      case 'complete':
        return 'Scan Complete!';
      default:
        return 'Ready to Scan';
    }
  };

  const getStageColor = () => {
    switch (scanningState.stage) {
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

  return (
    <Box>
      {/* Scanning Progress Card */}
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
            {scanningState.isScanning ? (
              <CircularProgress 
                size={40} 
                sx={{ color: 'white' }}
                variant="determinate"
                value={scanningState.progress}
              />
            ) : (
              getStageIcon()
            )}
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
                {scanningState.progress}% Complete
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
                Confidence: {Math.round(scanningState.confidence * 100)}%
              </Typography>
            </Box>
          )}

          {/* Action Buttons */}
          {!scanningState.isScanning && (
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={startDocumentScan}
                startIcon={<DocumentScannerIcon />}
                size="large"
                sx={{ minWidth: 150 }}
              >
                {scannedImage ? 'Scan Again' : 'Start Scanning'}
              </Button>
              
              {scannedImage && (
                <Button
                  variant="outlined"
                  onClick={() => setScannedImage('')}
                  startIcon={<Refresh />}
                  size="large"
                >
                  Clear
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
                    Extracted Text (First 200 characters):
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
          <strong>Scanning Tips:</strong>
        </Typography>
        <Typography variant="body2" component="ul" sx={{ mt: 1, pl: 2 }}>
          <li>Ensure good lighting and clear visibility</li>
          <li>Hold document flat and steady</li>
          <li>Avoid glare and shadows</li>
          <li>Make sure all text is clearly readable</li>
          <li>The AI will automatically identify your document type</li>
        </Typography>
      </Alert>
    </Box>
  );
};

export default DocumentScannerComponent;