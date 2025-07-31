import React, { useState, useEffect } from 'react';
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
  DocumentScanner as DocumentIcon,
  CreditCard,
  Badge,
  ContactPage,
  Warning,
  PhotoCamera,
  Visibility
} from '@mui/icons-material';
import { DocumentScanner } from '@capacitor-community/document-scanner';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

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

  // Check if Capacitor is available
  useEffect(() => {
    const checkCapacitor = async () => {
      try {
        // Check if we're in a Capacitor environment
        const { Capacitor } = await import('@capacitor/core');
        setIsCapacitorAvailable(Capacitor.isNativePlatform());
      } catch (error) {
        console.log('Capacitor not available, using web fallback');
        setIsCapacitorAvailable(false);
      }
    };
    
    checkCapacitor();
  }, []);

  // Auto-start scanning when component becomes active
  useEffect(() => {
    if (isActive && isCapacitorAvailable) {
      // Small delay to allow UI to settle
      setTimeout(() => {
        startDocumentScan();
      }, 500);
    }
  }, [isActive, isCapacitorAvailable]);

  const startDocumentScan = async () => {
    if (isScanning) return;

    setIsScanning(true);
    setScanStage('capturing');
    setScanProgress(0);
    setDetectedDocType(null);

    try {
      let scannedImageData: string;

      if (isCapacitorAvailable) {
        // Use Capacitor Document Scanner
        const result = await DocumentScanner.scanDocument({
          letUserAdjustCrop: true,
          maxNumDocuments: 1,
          croppedImageQuality: 100
        });

        if (result.scannedImages && result.scannedImages.length > 0) {
          scannedImageData = result.scannedImages[0];
        } else {
          throw new Error('No document image captured');
        }
      } else {
        // Fallback to Capacitor Camera for web
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: true,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
          promptLabelHeader: 'Scan Document',
          promptLabelPhoto: 'Take Photo',
          promptLabelPicture: 'Select from Gallery'
        });

        scannedImageData = image.dataUrl || '';
      }

      setScannedImage(scannedImageData);
      
      // Progress simulation for processing stages
      setScanStage('processing');
      await updateProgress(20, 40, 'Analyzing document...');
      
      setScanStage('extracting');
      await updateProgress(40, 80, 'Extracting information...');
      
      // Process the scanned document
      const documentData = await processScannedDocument(scannedImageData);
      
      setScanStage('complete');
      await updateProgress(80, 100, 'Processing complete!');
      
      // Validate and return data
      if (validateDocumentData(documentData)) {
        setTimeout(() => {
          onScanComplete(documentData);
        }, 500);
      } else {
        throw new Error('Could not extract valid document information');
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

  const processScannedDocument = async (imageData: string): Promise<DocumentData> => {
    // Simulate OCR processing - in production, you would use actual OCR
    // This could integrate with services like Google Vision API, AWS Textract, etc.
    
    // For now, we'll simulate realistic document processing
    const extractedText = await simulateOCR(imageData);
    const documentType = detectDocumentType(extractedText);
    const extractedData = extractDocumentInfo(extractedText, documentType);
    
    setDetectedDocType(documentType);
    
    return {
      ...extractedData,
      documentType,
      photo: imageData,
      rawText: extractedText,
      confidence: calculateConfidence(extractedText, documentType)
    };
  };

  const simulateOCR = async (imageData: string): Promise<string[]> => {
    // In a real implementation, this would call an OCR service
    // For simulation, we'll return realistic extracted text based on document patterns
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate realistic OCR results
    const mockOCRResults = [
      // Passport-like text
      'PASSPORT',
      'REPUBLIC OF INDIA',
      'JOHN MICHAEL SMITH',
      'P1234567',
      'IND',
      '15/03/1985',
      '15/03/2030',
      'M',
      'NEW DELHI',
      'INDIAN',
      
      // PAN Card-like text
      'PERMANENT ACCOUNT NUMBER',
      'INCOME TAX DEPARTMENT',
      'GOVT OF INDIA',
      'ABCDE1234F',
      'JOHN SMITH',
      '15/03/1985',
      
      // License-like text
      'DRIVING LICENCE',
      'TRANSPORT DEPARTMENT',
      'DL-1320110012345',
      'JOHN SMITH',
      '15-03-1985',
      '15-03-2025',
      'LMV',
      
      // Address and other details
      '123 MAIN STREET',
      'NEW DELHI 110001',
      'INDIA'
    ];
    
    return mockOCRResults;
  };

  const detectDocumentType = (extractedText: string[]): DocumentData['documentType'] => {
    const text = extractedText.join(' ').toLowerCase();
    
    // Enhanced detection patterns
    if (text.includes('passport') || text.includes('republic of india') || 
        text.includes('united states of america') || text.includes('type p') ||
        /p\d{7,8}/.test(text)) {
      return 'passport';
    }
    
    if (text.includes('permanent account number') || text.includes('income tax department') ||
        text.includes('govt of india') || /[a-z]{5}\d{4}[a-z]/i.test(text)) {
      return 'pan';
    }
    
    if (text.includes('driving licence') || text.includes('driving license') || 
        text.includes('transport department') || text.includes('motor vehicles') ||
        /dl[-\s]?\d+/i.test(text)) {
      return 'license';
    }
    
    if (text.includes('permanent resident card') || text.includes('uscis') ||
        text.includes('green card') || /gc\d+/i.test(text)) {
      return 'green_card';
    }
    
    return 'unknown';
  };

  const extractDocumentInfo = (extractedText: string[], docType: DocumentData['documentType']): Partial<DocumentData> => {
    const text = extractedText.join(' ');
    const data: Partial<DocumentData> = {};
    
    // Extract name (look for capitalized words that could be names)
    const namePatterns = [
      /([A-Z][A-Z\s]{10,50})/g, // All caps names
      /(?:name|naam|nom|nombre|nome|名前|이름|姓名)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].trim().length > 3) {
        data.name = match[1].trim();
        break;
      }
    }
    
    // Extract document number based on type
    switch (docType) {
      case 'passport':
        const passportMatch = text.match(/P\d{7,8}|\d{8}/);
        if (passportMatch) data.documentNumber = passportMatch[0];
        
        // Extract nationality
        const nationalityMatch = text.match(/(?:IND|USA|GBR|CAN|AUS|DEU|FRA|JPN|KOR|CHN)/);
        if (nationalityMatch) data.nationality = nationalityMatch[0];
        break;
        
      case 'pan':
        const panMatch = text.match(/[A-Z]{5}\d{4}[A-Z]/);
        if (panMatch) data.documentNumber = panMatch[0];
        break;
        
      case 'license':
        const licenseMatch = text.match(/DL[-\s]?\d{10,15}|\d{10,15}/);
        if (licenseMatch) data.documentNumber = licenseMatch[0];
        break;
        
      case 'green_card':
        const greenCardMatch = text.match(/GC\d{8,12}|\d{9,13}/);
        if (greenCardMatch) data.documentNumber = greenCardMatch[0];
        break;
    }
    
    // Extract dates
    const datePatterns = [
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/g,
      /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/g
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
    }
    
    // Extract address (look for patterns with numbers and street names)
    const addressMatch = text.match(/\d+\s+[A-Z][A-Z\s,]+\d{6}/);
    if (addressMatch) {
      data.address = addressMatch[0];
    }
    
    return data;
  };

  const calculateConfidence = (extractedText: string[], docType: DocumentData['documentType']): number => {
    let confidence = 0.5; // Base confidence
    
    const text = extractedText.join(' ').toLowerCase();
    
    // Increase confidence based on document type detection accuracy
    const typeKeywords = {
      'passport': ['passport', 'republic', 'travel'],
      'pan': ['permanent account', 'income tax', 'govt'],
      'license': ['driving', 'licence', 'transport'],
      'green_card': ['permanent resident', 'uscis', 'green card']
    };
    
    const keywords = typeKeywords[docType] || [];
    const foundKeywords = keywords.filter(keyword => text.includes(keyword));
    confidence += (foundKeywords.length / keywords.length) * 0.3;
    
    // Increase confidence if we found structured data
    if (text.match(/\d{4}[\/\-]\d{2}[\/\-]\d{2}/)) confidence += 0.1; // Date found
    if (text.match(/[A-Z]{2,}\s+[A-Z]{2,}/)) confidence += 0.1; // Name pattern found
    
    return Math.min(confidence, 0.95); // Cap at 95%
  };

  const validateDocumentData = (data: DocumentData): boolean => {
    return !!(
      data.name && 
      data.name.length > 2 &&
      data.documentNumber && 
      data.documentNumber.length > 3 &&
      data.documentType !== 'unknown' &&
      data.confidence > 0.3
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
      case 'capturing': return 'Capturing document image...';
      case 'processing': return 'Processing and analyzing...';
      case 'extracting': return 'Extracting document information...';
      case 'complete': return 'Scan complete!';
      default: return 'Ready to scan';
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
        icon: <DocumentIcon />, 
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
          The document scanner requires a mobile device with camera capabilities. 
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

      {/* Scanning Interface */}
      <Card sx={{ 
        mb: 3,
        border: isScanning ? 2 : 1,
        borderColor: isScanning ? 'primary.main' : 'divider',
        bgcolor: isScanning ? 'primary.light' : 'background.paper',
        transition: 'all 0.3s ease'
      }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          {/* Scanning Status Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ 
                bgcolor: isScanning ? 'primary.main' : 'grey.300',
                width: 48, 
                height: 48,
                animation: isScanning ? 'pulse 2s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)', opacity: 1 },
                  '50%': { transform: 'scale(1.05)', opacity: 0.8 },
                  '100%': { transform: 'scale(1)', opacity: 1 }
                }
              }}>
                {isScanning ? <Scanner /> : <PhotoCamera />}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {isScanning ? 'Scanning Document...' : 'Ready to Scan'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getStageMessage()}
                </Typography>
              </Box>
            </Box>
            
            {isScanning && (
              <CircularProgress 
                variant="determinate" 
                value={scanProgress} 
                size={48}
                thickness={4}
                sx={{ color: 'primary.main' }}
              />
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
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {scanProgress.toFixed(0)}% - {getStageMessage()}
              </Typography>
            </Box>
          )}

          {/* Scanned Image Preview */}
          {scannedImage && (
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Typography variant="subtitle2" gutterBottom>
                Scanned Document Preview:
              </Typography>
              <Paper sx={{ 
                p: 1, 
                display: 'inline-block',
                border: 1,
                borderColor: 'success.main'
              }}>
                <img 
                  src={scannedImage} 
                  alt="Scanned document" 
                  style={{ 
                    maxWidth: '200px', 
                    maxHeight: '150px',
                    borderRadius: '4px'
                  }} 
                />
              </Paper>
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
            <strong>Automatic Detection:</strong> AI will identify your document type
          </Typography>
          <Typography component="li" variant="body2">
            <strong>Supported Documents:</strong> Passport, PAN Card, Driving License, Green Card
          </Typography>
          <Typography component="li" variant="body2">
            <strong>Best Results:</strong> Good lighting, flat surface, clear text
          </Typography>
          <Typography component="li" variant="body2">
            <strong>Privacy:</strong> Document data is processed locally and securely
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
            💡 Pro Tip: Hold your device steady and ensure all text is clearly visible for best results
          </Typography>
        </Box>
      </Alert>
    </Box>
  );
};

export default DocumentScannerComponent;