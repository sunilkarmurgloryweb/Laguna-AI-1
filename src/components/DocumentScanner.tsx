import React, { useState, useEffect, useRef } from 'react';
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
  Avatar,
  LinearProgress,
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
  CreditCard,
  Badge,
  ContactPage,
  Warning,
  PhotoCamera,
  Visibility
} from '@mui/icons-material';
import { Capacitor } from '@capacitor/core';
import { DocumentScanner } from 'capacitor-document-scanner';

interface DocumentData {
  name: string;
  documentNumber: string;
  documentType: 'passport' | 'pan' | 'license' | 'green_card' | 'unknown';
  nationality?: string;
  dateOfBirth?: string;
  expiryDate?: string;
  issueDate?: string;
  address?: string;
  photo?: string;
  rawText?: string[];
  confidence: number;
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
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStage, setScanStage] = useState<'idle' | 'capturing' | 'processing' | 'extracting' | 'complete'>('idle');
  const [detectedDocType, setDetectedDocType] = useState<DocumentData['documentType'] | null>(null);
  const [isCapacitorAvailable, setIsCapacitorAvailable] = useState(false);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const scannedImageRef = useRef<HTMLImageElement>(null);

  // Check if Capacitor is available
  useEffect(() => {
    const checkCapacitor = () => {
      try {
        setIsCapacitorAvailable(true); // Always allow for web testing
      } catch (error) {
        console.log('Capacitor not available, using web fallback');
        setIsCapacitorAvailable(false);
      }
    };
    
    checkCapacitor();
  }, []);

  // Request camera permissions
  const requestCameraPermissions = async (): Promise<boolean> => {
    try {
      if (Capacitor.isNativePlatform()) {
        // For native platforms, permissions are handled by the plugin
        return true;
      } else {
        // For web, request camera permission
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        // Stop the stream immediately as we just needed permission
        stream.getTracks().forEach(track => track.stop());
        return true;
      }
    } catch (error) {
      console.error('Camera permission error:', error);
      setCameraError('Camera permission denied. Please allow camera access to scan documents.');
      return false;
    }
  };

  // Auto-start scanning when component becomes active
  useEffect(() => {
    if (isActive && isCapacitorAvailable && !cameraError) {
      // Small delay to allow UI to settle
      setTimeout(() => {
        initializeScanner();
      }, 500);
    }
  }, [isActive, isCapacitorAvailable, cameraError]);

  const initializeScanner = async () => {
    setCameraError('');
    const hasPermission = await requestCameraPermissions();
    if (hasPermission) {
      startDocumentScan();
    }
  };

  const scanDocument = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        // Use native document scanner
        const { scannedImages } = await DocumentScanner.scanDocument({
          letUserAdjustCrop: true,
          maxNumDocuments: 1,
          croppedImageQuality: 100
        });

        if (scannedImages.length > 0) {
          const imageSrc = Capacitor.convertFileSrc(scannedImages[0]);
          setScannedImage(imageSrc);
          
          if (scannedImageRef.current) {
            scannedImageRef.current.src = imageSrc;
          }
          
          return imageSrc;
        }
      } else {
        // Web fallback - use camera to capture image
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        
        // Create video element to capture frame
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();
        
        // Wait for video to be ready
        await new Promise(resolve => {
          video.onloadedmetadata = resolve;
        });
        
        // Create canvas to capture frame
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const imageData = canvas.toDataURL('image/jpeg', 0.9);
          
          // Stop video stream
          stream.getTracks().forEach(track => track.stop());
          
          setScannedImage(imageData);
          if (scannedImageRef.current) {
            scannedImageRef.current.src = imageData;
          }
          
          return imageData;
        }
      }
      
      throw new Error('No document image captured');
    } catch (error) {
      console.error('Document scanning error:', error);
      if (error instanceof Error && error.message.includes('Permission')) {
        setCameraError('Camera permission denied. Please allow camera access and try again.');
      } else if (error instanceof Error && error.message.includes('NotFound')) {
        setCameraError('No camera found. Please ensure your device has a camera.');
      } else {
        setCameraError('Failed to access camera. Please check your device settings.');
      }
      throw error;
    }
  };

  const startDocumentScan = async () => {
    if (isScanning) return;

    setCameraError('');
    setIsScanning(true);
    setScanStage('capturing');
    setScanProgress(0);
    setDetectedDocType(null);

    try {
      // Stage 1: Capturing document
      setScanStage('capturing');
      await updateProgress(0, 25, 'Opening camera and capturing document...');
      
      const scannedImageSrc = await scanDocument();
      
      // Stage 2: Identifying document type
      setScanStage('processing');
      await updateProgress(25, 50, 'Identifying document type...');
      
      const extractedText = await simulateOCRFromImage(scannedImageSrc);
      const documentType = detectDocumentType(extractedText);
      setDetectedDocType(documentType);
      
      // Stage 3: Processing image
      setScanStage('processing');
      await updateProgress(50, 75, 'Processing document data...');
          <Alert severity="warning" sx={{ mt: 2 }}>
      // Stage 4: Extracting data
              <strong>Camera Access Required</strong>
      await updateProgress(75, 95, 'Extracting document information...');
      
              Please allow camera access to scan documents. 
              Make sure your browser has camera permissions enabled.
      
      setScanStage('complete');
              variant="contained" 
      
      // Validate and return data
              onClick={initializeScanner}
        setTimeout(() => {
              Try Again
        }, 500);
      } else {
        throw new Error('Could not extract valid document information');
      }

      // Show camera error if any
      if (cameraError) {
        return (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Camera Error</strong>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {cameraError}
            </Typography>
            <Button 
              variant="contained" 
              size="small" 
              sx={{ mt: 2 }}
              onClick={initializeScanner}
              startIcon={<Refresh />}
            >
              Retry Camera Access
            </Button>
          </Alert>
        );
      }

    } catch (error) {
      console.error('Document scanning error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Document scanning failed';
      onError(`Scan error: ${errorMessage}`);
      resetScanner();
    }
  };

  const updateProgress = (start: number, end: number, message: string): Promise<void> => {
    return new Promise((resolve) => {
      const duration = 1000; // 1 second
      const steps = 20;
      const increment = (end - start) / steps;
      let current = start;
      
      const interval = setInterval(() => {
        current += increment;
        setScanProgress(Math.min(current, end));
        
        if (current >= end) {
          clearInterval(interval);
          resolve();
        }
      }, duration / steps);
    });
  };

  const processScannedDocument = async (
    imageData: string, 
    extractedText: string[], 
    documentType: DocumentData['documentType']
  ): Promise<DocumentData> => {
    const extractedData = extractDocumentInfo(extractedText, documentType);
    
    return {
      ...extractedData,
      documentType,
      photo: imageData,
      rawText: extractedText,
      confidence: calculateConfidence(extractedText, documentType)
    };
  };

  const simulateOCRFromImage = async (imageData: string): Promise<string[]> => {
    // In production, integrate with OCR services:
    // - Tesseract.js for client-side OCR
    // - Google Vision API
    // - AWS Textract
    // - Azure Computer Vision
    
    // For now, simulate OCR processing of the actual scanned image
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // TODO: Replace with actual OCR processing of imageData
    // For demonstration, return realistic patterns that would be extracted
    const sampleOCRResults = [
      'REPUBLIC OF INDIA',
      'PASSPORT',
      'JOHN MICHAEL SMITH',
      'P1234567',
      '15/03/1985',
      '15/03/2030',
      'INDIAN',
      'MALE',
      'NEW DELHI'
    ];
    
    return sampleOCRResults;
  };

  const detectDocumentType = (extractedText: string[]): DocumentData['documentType'] => {
    const text = extractedText.join(' ').toLowerCase();
    
    // Enhanced detection patterns based on actual document content
    if (text.includes('passport') || text.includes('republic of india') || 
        text.includes('united states of america') || text.includes('type p') ||
        /p\d{7,8}/.test(text) || text.includes('travel document')) {
      return 'passport';
    }
    
    if (text.includes('permanent account number') || text.includes('income tax department') ||
        text.includes('govt of india') || text.includes('pan') ||
        /[a-z]{5}\d{4}[a-z]/i.test(text)) {
      return 'pan';
    }
    
    if (text.includes('driving licence') || text.includes('driving license') || 
        text.includes('transport department') || text.includes('motor vehicles') ||
        text.includes('dl') || /dl[-\s]?\d+/i.test(text)) {
      return 'license';
    }
    
    if (text.includes('permanent resident card') || text.includes('uscis') ||
        text.includes('green card') || text.includes('united states') ||
        /gc\d+/i.test(text)) {
      return 'green_card';
    }
    
    return 'unknown';
  };

  const extractDocumentInfo = (extractedText: string[], docType: DocumentData['documentType']): Partial<DocumentData> => {
    const text = extractedText.join(' ');
    const data: Partial<DocumentData> = {};
    
    // Extract name (look for capitalized words that could be names)
    const namePatterns = [
      /([A-Z][A-Z\s]{8,40})/g, // All caps names (common in official documents)
      /(?:name|naam|nom|nombre|nome|名前|이름|姓名)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g // Title case names
    ];
    
    for (const pattern of namePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const cleanName = match.trim();
          // Filter out common non-name text
          if (cleanName.length > 3 && 
              !cleanName.includes('GOVERNMENT') && 
              !cleanName.includes('PASSPORT') &&
              !cleanName.includes('LICENCE') &&
              !cleanName.includes('DEPARTMENT') &&
              !cleanName.includes('REPUBLIC')) {
            data.name = cleanName;
            break;
          }
        }
        if (data.name) break;
      }
    }
    
    // Extract document number based on type
    switch (docType) {
      case 'passport':
        const passportMatch = text.match(/P\d{7,8}|\b[A-Z]\d{7,8}\b/);
        if (passportMatch) data.documentNumber = passportMatch[0];
        
        // Extract nationality
        const nationalityMatch = text.match(/\b(IND|USA|GBR|CAN|AUS|DEU|FRA|JPN|KOR|CHN|INDIAN|AMERICAN|BRITISH)\b/);
        if (nationalityMatch) data.nationality = nationalityMatch[0];
        break;
        
      case 'pan':
        const panMatch = text.match(/\b[A-Z]{5}\d{4}[A-Z]\b/);
        if (panMatch) data.documentNumber = panMatch[0];
        break;
        
      case 'license':
        const licenseMatch = text.match(/\bDL[-\s]?\d{10,15}\b|\b[A-Z]{2}[-\s]?\d{8,15}\b/);
        if (licenseMatch) data.documentNumber = licenseMatch[0];
        break;
        
      case 'green_card':
        const greenCardMatch = text.match(/\bGC\d{8,12}\b|\b\d{9,13}\b/);
        if (greenCardMatch) data.documentNumber = greenCardMatch[0];
        break;
    }
    
    // Extract dates (multiple formats)
    const datePatterns = [
      /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\b/g,
      /\b(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b/g,
      /\b(\d{1,2}\s+[A-Z]{3}\s+\d{4})\b/g
    ];
    
    const dates: string[] = [];
    for (const pattern of datePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        dates.push(...matches);
      }
    }
    
    if (dates.length > 0) {
      data.dateOfBirth = dates[0];
      if (dates.length > 1) {
        data.expiryDate = dates[1];
      }
      if (dates.length > 2) {
        data.issueDate = dates[2];
      }
    }
    
    // Extract address (look for patterns with numbers and locations)
    const addressMatch = text.match(/\d+[A-Z\s,]+\d{6}|\b[A-Z\s]+\d{6}\b/);
    if (addressMatch) {
      data.address = addressMatch[0].trim();
    }
    
    return data;
  };

  const calculateConfidence = (extractedText: string[], docType: DocumentData['documentType']): number => {
    let confidence = 0.3; // Base confidence
    
    const text = extractedText.join(' ').toLowerCase();
    
    // Increase confidence based on document type detection accuracy
    const typeKeywords = {
      'passport': ['passport', 'republic', 'travel', 'government'],
      'pan': ['permanent account', 'income tax', 'govt', 'pan'],
      'license': ['driving', 'licence', 'transport', 'motor'],
      'green_card': ['permanent resident', 'uscis', 'green card', 'united states']
    };
    
    const keywords = typeKeywords[docType] || [];
    const foundKeywords = keywords.filter(keyword => text.includes(keyword));
    confidence += (foundKeywords.length / keywords.length) * 0.4;
    
    // Increase confidence based on structured data found
    if (text.match(/\d{4}[\/\-]\d{2}[\/\-]\d{2}/)) confidence += 0.15; // Date found
    if (text.match(/[A-Z]{2,}\s+[A-Z]{2,}/)) confidence += 0.15; // Name pattern found
    if (text.match(/[A-Z0-9]{6,}/)) confidence += 0.1; // Document number pattern
    
    return Math.min(confidence, 0.95); // Cap at 95%
  };

  const validateDocumentData = (data: DocumentData): boolean => {
    return !!(
      data.name && 
      data.name.length > 2 &&
      data.documentNumber && 
      data.documentNumber.length > 3 &&
      data.documentType !== 'unknown' &&
      data.confidence > 0.4
    );
  };

  const resetScanner = () => {
    setIsScanning(false);
    setScanProgress(0);
    setScanStage('idle');
    setDetectedDocType(null);
    setScannedImage(null);
  };

  const retryScanning = () => {
    resetScanner();
    setTimeout(() => {
      startDocumentScan();
    }, 500);
  };

  const getStageMessage = () => {
    switch (scanStage) {
      case 'capturing': return 'Opening camera and capturing document...';
      case 'processing': return 'Processing scanned image...';
      case 'extracting': return 'Extracting document information...';
      case 'complete': return 'Document scan complete!';
      default: return 'Ready to scan document';
    }
  };

  const getDocumentTypeInfo = (type: DocumentData['documentType']) => {
    const info = {
      'passport': { 
        name: 'Passport', 
        icon: <ContactPage />, 
        color: 'primary' as const,
        description: 'International travel document'
      },
      'pan': { 
        name: 'PAN Card', 
        icon: <CreditCard />, 
        color: 'secondary' as const,
        description: 'Permanent Account Number'
      },
      'license': { 
        name: 'Driving License', 
        icon: <Badge />, 
        color: 'success' as const,
        description: 'Government issued ID'
      },
      'green_card': { 
        name: 'Green Card', 
        icon: <ContactPage />, 
        color: 'info' as const,
        description: 'US Permanent Resident Card'
      },
      'unknown': { 
        name: 'Unknown Document', 
        icon: <DocumentScannerIcon />, 
        color: 'warning' as const,
        description: 'Document type not identified'
      }
    };
    
    return info[type] || info.unknown;
  };

  if (!isCapacitorAvailable) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Document Scanner Not Available</strong>
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          The document scanner requires Capacitor environment. 
          Please use the mobile app or manually enter guest information.
        </Typography>
        <Button 
          variant="outlined" 
          size="small" 
          sx={{ mt: 2 }}
          onClick={() => onError('Document scanner not available on this platform')}
        >
          Continue Without Scanning
        </Button>
      </Alert>
    );
  }

  return (
    <Box>
      {/* Document Type Detection Display */}
      {detectedDocType && detectedDocType !== 'unknown' && (
        <Fade in={true}>
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'success.light', border: 1, borderColor: 'success.main' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>
                {getDocumentTypeInfo(detectedDocType).icon}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" color="success.main" fontWeight="bold">
                  ✓ {getDocumentTypeInfo(detectedDocType).name} Detected
                </Typography>
                <Typography variant="body2" color="success.contrastText">
                  {getDocumentTypeInfo(detectedDocType).description}
                </Typography>
              </Box>
              <Chip 
                label={`${Math.round(scanProgress)}% Complete`} 
                color="success" 
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
          </Paper>
        </Fade>
      )}

      {/* Main Scanning Interface */}
      <Card sx={{ 
        mb: 3,
        border: isScanning ? 2 : 1,
        borderColor: isScanning ? 'primary.main' : 'divider',
        bgcolor: isScanning ? 'primary.light' : 'background.paper',
        transition: 'all 0.3s ease',
        minHeight: 300
      }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          {/* Scanning Status Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ 
                bgcolor: isScanning ? 'primary.main' : 'grey.300',
                width: 56, 
                height: 56,
                animation: isScanning ? 'pulse 2s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)', opacity: 1 },
                  '50%': { transform: 'scale(1.05)', opacity: 0.8 },
                  '100%': { transform: 'scale(1)', opacity: 1 }
                }
              }}>
                {isScanning ? <Scanner sx={{ fontSize: 28 }} /> : <PhotoCamera sx={{ fontSize: 28 }} />}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {isScanning ? 'Scanning Document...' : 'AI Document Scanner Ready'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getStageMessage()}
                </Typography>
              </Box>
            </Box>
            
            {isScanning && (
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress 
                  variant="determinate" 
                  value={scanProgress} 
                  size={56}
                  thickness={4}
                  sx={{ color: 'primary.main' }}
                />
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontWeight: 'bold' }}>
                  {scanProgress.toFixed(0)}%
                </Typography>
              </Box>
            )}
          </Box>

          {/* Progress Bar */}
          {isScanning && (
            <Box sx={{ mb: 3 }}>
              <LinearProgress 
                variant="determinate" 
                value={scanProgress}
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
                  }
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                {getStageMessage()}
              </Typography>
            </Box>
          )}

          {/* Scanned Image Preview */}
          {scannedImage && (
            <Fade in={true}>
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                  📄 Scanned Document Preview:
                </Typography>
                <Paper sx={{ 
                  p: 2, 
                  display: 'inline-block',
                  border: 2,
                  borderColor: 'success.main',
                  borderRadius: 2,
                  bgcolor: 'success.light'
                }}>
                  <img 
                    ref={scannedImageRef}
                    src={scannedImage} 
                    alt="Scanned document" 
                    style={{ 
                      maxWidth: '250px', 
                      maxHeight: '180px',
                      borderRadius: '8px',
                      boxShadow: theme.shadows[2]
                    }} 
                  />
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'success.main', fontWeight: 'bold' }}>
                    ✓ Document Captured Successfully
                  </Typography>
                </Paper>
              </Box>
            </Fade>
          )}

          {/* Camera Instructions */}
          {!isScanning && !scannedImage && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Avatar sx={{ 
                bgcolor: 'primary.light', 
                width: 80, 
                height: 80, 
                mx: 'auto', 
                mb: 2 
              }}>
                <PhotoCamera sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h6" gutterBottom>
                Position Your Document
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                The AI will automatically identify your document type and extract information
              </Typography>
            </Box>
          )}

          {/* Action Buttons */}
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="contained"
                onClick={startDocumentScan}
                disabled={isScanning}
                startIcon={isScanning ? <CircularProgress size={20} /> : <Scanner />}
                sx={{ 
                  py: { xs: 1.5, md: 2 },
                  fontSize: { xs: '0.875rem', md: '1rem' }
                }}
                size={isMobile ? 'medium' : 'large'}
              >
                {isScanning ? 'Scanning...' : 'Start Document Scan'}
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                onClick={isScanning ? resetScanner : retryScanning}
                startIcon={isScanning ? <Stop /> : <Refresh />}
                sx={{ 
                  py: { xs: 1.5, md: 2 },
                  fontSize: { xs: '0.875rem', md: '1rem' }
                }}
                size={isMobile ? 'medium' : 'large'}
              >
                {isScanning ? 'Cancel' : 'Retry Scan'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Alert 
        severity="info" 
        sx={{ 
          '& .MuiAlert-message': { width: '100%' }
        }}
      >
        <Typography variant="body2" fontWeight="bold" gutterBottom>
          📱 AI Document Scanner Instructions:
        </Typography>
        <Box component="ul" sx={{ mt: 1, pl: 2, mb: 1 }}>
          <Typography component="li" variant="body2">
            <strong>Automatic Detection:</strong> AI will identify your document type automatically
          </Typography>
          <Typography component="li" variant="body2">
            <strong>Supported Documents:</strong> Passport, PAN Card, Driving License, Green Card
          </Typography>
          <Typography component="li" variant="body2">
            <strong>Best Results:</strong> Good lighting, flat surface, clear text visibility
          </Typography>
          <Typography component="li" variant="body2">
            <strong>Privacy:</strong> Document data is processed securely and locally
          </Typography>
        </Box>
        
        <Box sx={{ 
          mt: 2, 
          p: 1.5, 
          bgcolor: 'info.light', 
          borderRadius: 1,
          border: 1,
          borderColor: 'info.main'
        }}>
          <Typography variant="caption" fontWeight="bold" color="info.main">
            💡 Pro Tip: Hold your device steady and ensure all document text is clearly visible for best AI recognition
          </Typography>
        </Box>
      </Alert>

      {/* Hidden image element for Capacitor */}
      <img 
        ref={scannedImageRef}
        id="scannedImage" 
        style={{ display: 'none' }} 
        alt="Scanned document"
      />
    </Box>
  );
};

export default DocumentScannerComponent;