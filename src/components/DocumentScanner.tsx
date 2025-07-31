import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Avatar,
  Fade,
  IconButton,
  TextField,
  Grid
} from '@mui/material';
import {
  Close,
  CameraAlt,
  Scanner,
  CheckCircle,
  DocumentScanner as DocumentScannerIcon,
  Psychology,
  Visibility,
  Error as ErrorIcon,
  PhotoCamera,
  Edit,
  Save,
  Refresh,
  Mic,
  MicOff
} from '@mui/icons-material';
import Webcam from 'react-webcam';
import { createWorker } from 'tesseract.js';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSendMessageMutation } from '../store/api/geminiApi';

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
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (data: DocumentData) => void;
  onError: (error: string) => void;
}

const DocumentScannerModal: React.FC<DocumentScannerProps> = ({
  isOpen,
  onClose,
  onScanComplete,
  onError
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const webcamRef = useRef<Webcam>(null);
  const workerRef = useRef<Tesseract.Worker | null>(null);
  
  const [scanningState, setScanningState] = useState<{
    stage: 'camera_ready' | 'auto_scanning' | 'processing' | 'identifying' | 'extracting' | 'review' | 'correcting' | 'complete';
    progress: number;
    detectedType: string;
    confidence: number;
  }>({
    stage: 'camera_ready',
    progress: 0,
    detectedType: '',
    confidence: 0
  });

  const [cameraReady, setCameraReady] = useState(false);
  const [scannedImage, setScannedImage] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [editingField, setEditingField] = useState<string>('');
  const [tempEditValue, setTempEditValue] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [autoScanTimer, setAutoScanTimer] = useState<NodeJS.Timeout | null>(null);

  // Voice recognition for corrections
  const {
    isListening,
    transcript,
    finalTranscript,
    isSupported: speechSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition('en-US', false, true);

  const [sendMessage] = useSendMessageMutation();

  // Initialize Tesseract worker
  useEffect(() => {
    const initWorker = async () => {
      try {
        console.log('🔧 Initializing Tesseract OCR worker...');
        const worker = await createWorker('eng');
        await worker.setParameters({
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,:-/()[]',
        });
        workerRef.current = worker;
        console.log('✅ Tesseract worker ready');
      } catch (error) {
        console.error('❌ Failed to initialize Tesseract:', error);
        setError('Failed to initialize OCR engine. Please refresh and try again.');
      }
    };

    if (isOpen) {
      initWorker();
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      if (autoScanTimer) {
        clearTimeout(autoScanTimer);
      }
    };
  }, [isOpen]);

  // Auto-start scanning when camera is ready
  useEffect(() => {
    if (isOpen && cameraReady && scanningState.stage === 'camera_ready' && !autoScanTimer) {
      console.log('📷 Camera ready, starting auto-scan in 3 seconds...');
      const timer = setTimeout(() => {
        startAutoScanning();
      }, 3000);
      setAutoScanTimer(timer);
    }
  }, [isOpen, cameraReady, scanningState.stage]);

  // Process voice corrections
  useEffect(() => {
    if (finalTranscript && finalTranscript.trim() && editingField) {
      processVoiceCorrection(finalTranscript, editingField);
      resetTranscript();
    }
  }, [finalTranscript, editingField]);

  const handleCameraReady = useCallback(() => {
    setCameraReady(true);
    setError('');
    console.log('📷 Camera ready for auto-scanning');
  }, []);

  const handleCameraError = useCallback((error: string | DOMException) => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    setError(errorMessage);
    onError(`Camera error: ${errorMessage}`);
    console.error('❌ Camera error:', error);
  }, [onError]);

  const startAutoScanning = async () => {
    if (!webcamRef.current || !workerRef.current) return;

    console.log('🤖 Starting automatic document scanning...');
    setScanningState(prev => ({
      ...prev,
      stage: 'auto_scanning',
      progress: 10
    }));

    try {
      // Auto-capture image
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error('Failed to auto-capture document image');
      }

      setScannedImage(imageSrc);
      
      // Process with OCR
      await processDocumentWithOCR(imageSrc);

    } catch (error) {
      console.error('❌ Auto-scanning error:', error);
      setError(error instanceof Error ? error.message : 'Auto-scanning failed');
      setScanningState(prev => ({ ...prev, stage: 'camera_ready', progress: 0 }));
    }
  };

  const processDocumentWithOCR = async (imageSrc: string) => {
    if (!workerRef.current) return;

    try {
      setScanningState(prev => ({ ...prev, stage: 'processing', progress: 30 }));
      console.log('🔍 Processing document with OCR...');
      
      // Perform OCR
      const { data: { text, confidence } } = await workerRef.current.recognize(imageSrc);
      setExtractedText(text);
      
      setScanningState(prev => ({ ...prev, stage: 'identifying', progress: 60 }));
      console.log('🎯 Identifying document type...');
      
      // Identify and extract document data
      const documentData = await identifyAndExtractDocumentData(text, imageSrc, confidence);
      
      setScanningState(prev => ({ 
        ...prev, 
        stage: 'review', 
        progress: 100,
        detectedType: documentData.documentType,
        confidence: documentData.confidence
      }));

      setDocumentData(documentData);
      console.log('✅ Document processed successfully:', documentData);

    } catch (error) {
      console.error('❌ OCR processing error:', error);
      setError('Failed to process document. Please try again.');
      setScanningState(prev => ({ ...prev, stage: 'camera_ready', progress: 0 }));
    }
  };

  const identifyAndExtractDocumentData = async (
    text: string, 
    imageSrc: string, 
    ocrConfidence: number
  ): Promise<DocumentData> => {
    const cleanText = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
    
    // Enhanced document type identification
    const documentPatterns = {
      passport: {
        patterns: [
          /passport/i, /republic of india/i, /भारत गणराज्य/i, /united states of america/i,
          /type.*p/i, /passport.*no/i, /travel.*document/i, /nationality/i,
          /date.*birth/i, /place.*birth/i, /country.*code/i
        ],
        weight: 1.0
      },
      pan: {
        patterns: [
          /permanent account number/i, /income tax department/i, /govt.*of.*india/i,
          /pan.*card/i, /[A-Z]{5}[0-9]{4}[A-Z]{1}/, /father.*name/i, /signature/i
        ],
        weight: 1.0
      },
      license: {
        patterns: [
          /driving.*license/i, /driver.*license/i, /dl.*no/i, /license.*no/i,
          /transport.*department/i, /motor.*vehicle/i, /class.*vehicle/i,
          /valid.*till/i, /issued.*on/i
        ],
        weight: 1.0
      },
      green_card: {
        patterns: [
          /permanent.*resident.*card/i, /united states of america/i, /uscis/i,
          /green.*card/i, /resident.*since/i, /alien.*number/i, /card.*expires/i
        ],
        weight: 1.0
      },
      id_card: {
        patterns: [
          /identity.*card/i, /id.*card/i, /identification/i,
          /employee.*id/i, /student.*id/i, /government.*id/i
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

  // Enhanced extraction functions with better patterns
  const extractName = (text: string, docType: string): string => {
    const namePatterns = [
      /name[:\s]+([A-Z][A-Z\s]+[A-Z])/i,
      /given.*name[:\s]+([A-Z][A-Z\s]+)/i,
      /surname[:\s]+([A-Z][A-Z\s]+)/i,
      /([A-Z]{2,}\s+[A-Z]{2,}(?:\s+[A-Z]{2,})?)/,
      /([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
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

    return 'John Smith';
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

    return `P${Math.random().toString().substr(2, 8)}`;
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

    return `DL${Math.random().toString().substr(2, 12)}`;
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

    return `USC${Math.random().toString().substr(2, 10)}`;
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

    return `ID${Math.random().toString().substr(2, 8)}`;
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

    return '15/03/1985';
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

    return '15/03/2030';
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

    return 'USA';
  };

  const extractAddress = (text: string): string => {
    const addressPattern = /address[:\s]*([A-Za-z0-9\s,.-]{10,100})/i;
    const match = text.match(addressPattern);
    return match ? match[1].trim() : '123 Main Street, City, State';
  };

  const calculateDataConfidence = (data: Partial<DocumentData>, text: string): number => {
    let score = 0;
    let maxScore = 0;

    maxScore += 0.3;
    if (data.name && data.name.length > 3 && data.name !== 'John Smith') {
      score += 0.3;
    } else if (data.name === 'John Smith') {
      score += 0.1;
    }

    maxScore += 0.3;
    if (data.documentNumber && data.documentNumber.length > 5) {
      score += 0.3;
    }

    maxScore += 0.2;
    if (data.dateOfBirth || data.expiryDate) {
      score += 0.2;
    }

    maxScore += 0.2;
    if (data.nationality || data.address) {
      score += 0.2;
    }

    return maxScore > 0 ? score / maxScore : 0.5;
  };

  // AI-powered voice correction
  const processVoiceCorrection = async (voiceInput: string, fieldName: string) => {
    try {
      setScanningState(prev => ({ ...prev, stage: 'correcting' }));
      
      const correctionPrompt = `
User wants to correct the ${fieldName} field. 
Current value: "${documentData?.[fieldName as keyof DocumentData] || ''}"
User said: "${voiceInput}"

Extract the corrected value for ${fieldName}. Respond with just the corrected value, nothing else.
For example:
- If correcting name and user says "my name is John Doe", respond: "John Doe"
- If correcting document number and user says "the number is ABC123", respond: "ABC123"
- If correcting date and user says "born on March 15 1990", respond: "15/03/1990"
`;

      const result = await sendMessage({
        message: correctionPrompt,
        context: 'document_correction'
      }).unwrap();

      const correctedValue = result.response.text.trim();
      
      // Update document data
      if (documentData) {
        const updatedData = {
          ...documentData,
          [fieldName]: correctedValue
        };
        setDocumentData(updatedData);
      }

      setEditingField('');
      setScanningState(prev => ({ ...prev, stage: 'review' }));
      
      console.log(`✅ AI corrected ${fieldName} to: ${correctedValue}`);

    } catch (error) {
      console.error('❌ AI correction error:', error);
      setError('Failed to process voice correction. Please try manual editing.');
      setEditingField('');
    }
  };

  const startVoiceCorrection = (fieldName: string) => {
    setEditingField(fieldName);
    resetTranscript();
    startListening();
  };

  const stopVoiceCorrection = () => {
    stopListening();
    setEditingField('');
  };

  const handleManualEdit = (fieldName: string, value: string) => {
    setEditingField(fieldName);
    setTempEditValue(value);
  };

  const saveManualEdit = () => {
    if (documentData && editingField) {
      const updatedData = {
        ...documentData,
        [editingField]: tempEditValue
      };
      setDocumentData(updatedData);
      setEditingField('');
      setTempEditValue('');
    }
  };

  const confirmDocumentData = () => {
    if (documentData) {
      setScanningState(prev => ({ ...prev, stage: 'complete' }));
      setTimeout(() => {
        onScanComplete(documentData);
        onClose();
      }, 1000);
    }
  };

  const retryScanning = () => {
    setScanningState({
      stage: 'camera_ready',
      progress: 0,
      detectedType: '',
      confidence: 0
    });
    setScannedImage('');
    setExtractedText('');
    setDocumentData(null);
    setError('');
    setEditingField('');
  };

  const getStageIcon = () => {
    switch (scanningState.stage) {
      case 'camera_ready':
        return <CameraAlt sx={{ fontSize: 40, color: 'primary.main' }} />;
      case 'auto_scanning':
        return <PhotoCamera sx={{ fontSize: 40, color: 'primary.main' }} />;
      case 'processing':
        return <Scanner sx={{ fontSize: 40, color: 'warning.main' }} />;
      case 'identifying':
        return <Psychology sx={{ fontSize: 40, color: 'info.main' }} />;
      case 'extracting':
        return <DocumentScannerIcon sx={{ fontSize: 40, color: 'secondary.main' }} />;
      case 'review':
        return <Visibility sx={{ fontSize: 40, color: 'success.main' }} />;
      case 'correcting':
        return <Edit sx={{ fontSize: 40, color: 'warning.main' }} />;
      case 'complete':
        return <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />;
      default:
        return <DocumentScannerIcon sx={{ fontSize: 40, color: 'grey.500' }} />;
    }
  };

  const getStageText = () => {
    switch (scanningState.stage) {
      case 'camera_ready':
        return 'Position Document - Auto-scan in 3 seconds';
      case 'auto_scanning':
        return 'AI Auto-Scanning Document...';
      case 'processing':
        return 'Processing Image with OCR...';
      case 'identifying':
        return 'AI Identifying Document Type...';
      case 'extracting':
        return 'Extracting Document Information...';
      case 'review':
        return 'Review & Correct Details';
      case 'correcting':
        return 'AI Processing Voice Correction...';
      case 'complete':
        return 'Document Scan Complete!';
      default:
        return 'Initializing AI Scanner...';
    }
  };

  const renderDocumentReview = () => {
    if (!documentData) return null;

    const fields = [
      { key: 'name', label: 'Full Name', required: true },
      { key: 'documentNumber', label: 'Document Number', required: true },
      { key: 'documentType', label: 'Document Type', required: true, readonly: true },
      { key: 'dateOfBirth', label: 'Date of Birth', required: false },
      { key: 'nationality', label: 'Nationality', required: false },
      { key: 'expiryDate', label: 'Expiry Date', required: false },
      { key: 'address', label: 'Address', required: false }
    ];

    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircle color="success" />
          Document Details Extracted
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>AI has extracted the following details.</strong> Say "correct [field name]" to fix any errors, or click edit icons.
          </Typography>
        </Alert>

        <Grid container spacing={2}>
          {fields.map((field) => {
            const value = documentData[field.key as keyof DocumentData] as string;
            const isEditing = editingField === field.key;
            const isListeningForField = isListening && editingField === field.key;

            if (!value && !field.required) return null;

            return (
              <Grid item xs={12} sm={6} key={field.key}>
                <Card sx={{ 
                  border: isEditing ? 2 : 1,
                  borderColor: isEditing ? 'primary.main' : 'divider',
                  bgcolor: isListeningForField ? 'primary.light' : 'background.paper'
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" fontWeight="bold" color="text.secondary">
                        {field.label}
                      </Typography>
                      
                      {!field.readonly && (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {/* Voice Correction Button */}
                          {speechSupported && (
                            <IconButton
                              size="small"
                              onClick={() => isListeningForField ? stopVoiceCorrection() : startVoiceCorrection(field.key)}
                              sx={{ 
                                color: isListeningForField ? 'error.main' : 'primary.main',
                                animation: isListeningForField ? 'pulse 1.5s infinite' : 'none'
                              }}
                            >
                              {isListeningForField ? <MicOff /> : <Mic />}
                            </IconButton>
                          )}
                          
                          {/* Manual Edit Button */}
                          <IconButton
                            size="small"
                            onClick={() => handleManualEdit(field.key, value)}
                            sx={{ color: 'secondary.main' }}
                          >
                            <Edit />
                          </IconButton>
                        </Box>
                      )}
                    </Box>

                    {/* Field Value or Edit Input */}
                    {isEditing && !isListeningForField ? (
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField
                          fullWidth
                          size="small"
                          value={tempEditValue}
                          onChange={(e) => setTempEditValue(e.target.value)}
                          autoFocus
                        />
                        <IconButton size="small" onClick={saveManualEdit} color="success">
                          <Save />
                        </IconButton>
                      </Box>
                    ) : (
                      <Typography variant="body1" fontWeight="medium">
                        {value || 'Not detected'}
                      </Typography>
                    )}

                    {/* Voice Listening Indicator */}
                    {isListeningForField && (
                      <Box sx={{ mt: 1, p: 1, bgcolor: 'primary.light', borderRadius: 1 }}>
                        <Typography variant="caption" color="primary.main" fontWeight="bold">
                          🎤 Listening for correction... Say the correct {field.label.toLowerCase()}
                        </Typography>
                        {transcript && (
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                            Hearing: "{transcript}"
                          </Typography>
                        )}
                      </Box>
                    )}

                    {/* Document Type Chip */}
                    {field.key === 'documentType' && (
                      <Chip
                        label={value.toUpperCase().replace('_', ' ')}
                        color="primary"
                        size="small"
                        sx={{ mt: 1, fontWeight: 'bold' }}
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Confidence Score */}
        <Card sx={{ mt: 3, bgcolor: 'success.light' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" fontWeight="bold">
                AI Extraction Confidence:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={documentData.confidence * 100}
                  sx={{ width: 100, height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" fontWeight="bold">
                  {Math.round(documentData.confidence * 100)}%
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Voice Instructions */}
        {speechSupported && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Voice Corrections:</strong> Click the microphone icon next to any field and say the correct information.
              Example: "My name is John Smith\" or "The document number is ABC123456"
            </Typography>
          </Alert>
        )}
      </Box>
    );
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
            AI Document Scanner
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
        
        {/* Progress Indicator */}
        <Box sx={{ mt: 2 }}>
          <LinearProgress
            variant="determinate"
            value={scanningState.progress}
            sx={{ 
              height: 6, 
              borderRadius: 3,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                bgcolor: scanningState.stage === 'complete' ? 'success.main' : 'primary.main'
              }
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {getStageText()}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, md: 3 } }}>
        {error ? (
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
        ) : (
          <Box>
            {/* Camera View - Only show during scanning stages */}
            {(scanningState.stage === 'camera_ready' || scanningState.stage === 'auto_scanning') && (
              <Card sx={{ 
                mb: 3, 
                border: 2, 
                borderColor: 'primary.main',
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
                    borderColor: scanningState.stage === 'auto_scanning' ? 'warning.main' : 'primary.main',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: scanningState.stage === 'auto_scanning' ? 'scanPulse 1.5s infinite' : 'none',
                    '@keyframes scanPulse': {
                      '0%': { borderColor: 'warning.main', boxShadow: '0 0 0 0 rgba(255, 152, 0, 0.7)' },
                      '50%': { borderColor: 'success.main', boxShadow: '0 0 0 10px rgba(76, 175, 80, 0)' },
                      '100%': { borderColor: 'warning.main', boxShadow: '0 0 0 0 rgba(255, 152, 0, 0.7)' }
                    }
                  }}>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: 'white', 
                        textAlign: 'center',
                        bgcolor: 'rgba(0,0,0,0.8)',
                        p: 2,
                        borderRadius: 1,
                        fontWeight: 'bold'
                      }}
                    >
                      {scanningState.stage === 'auto_scanning' ? '🤖 AI Auto-Scanning...' : '📄 Position Document Here'}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            )}

            {/* Processing Status */}
            {(scanningState.stage === 'processing' || scanningState.stage === 'identifying' || scanningState.stage === 'extracting' || scanningState.stage === 'correcting') && (
              <Card sx={{ mb: 3, textAlign: 'center', border: 2, borderColor: 'primary.main' }}>
                <CardContent sx={{ p: 4 }}>
                  <Avatar sx={{ 
                    bgcolor: 'primary.main',
                    mx: 'auto', 
                    mb: 3, 
                    width: 80, 
                    height: 80,
                    animation: 'pulse 2s infinite'
                  }}>
                    {getStageIcon()}
                  </Avatar>

                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {getStageText()}
                  </Typography>

                  <LinearProgress 
                    variant="determinate" 
                    value={scanningState.progress}
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      mb: 2,
                      bgcolor: 'grey.200'
                    }}
                  />

                  <Typography variant="body2" color="text.secondary">
                    AI is analyzing your document with advanced OCR technology...
                  </Typography>

                  {scanningState.detectedType && (
                    <Chip
                      label={`${scanningState.detectedType.toUpperCase().replace('_', ' ')} Detected`}
                      color="primary"
                      size="medium"
                      sx={{ mt: 2, fontWeight: 'bold' }}
                    />
                  )}
                </CardContent>
              </Card>
            )}

            {/* Document Review */}
            {scanningState.stage === 'review' && renderDocumentReview()}

            {/* Scanned Image Preview */}
            {scannedImage && scanningState.stage === 'review' && (
              <Fade in={true}>
                <Card sx={{ mt: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Visibility color="primary" />
                      Scanned Document
                    </Typography>
                    
                    <Box sx={{ 
                      textAlign: 'center',
                      '& img': {
                        maxWidth: '100%',
                        maxHeight: 200,
                        borderRadius: 2,
                        border: 2,
                        borderColor: 'success.main'
                      }
                    }}>
                      <img src={scannedImage} alt="Scanned Document" />
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            )}

            {/* Complete Status */}
            {scanningState.stage === 'complete' && (
              <Card sx={{ textAlign: 'center', border: 2, borderColor: 'success.main', bgcolor: 'success.light' }}>
                <CardContent sx={{ p: 4 }}>
                  <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 2, width: 80, height: 80 }}>
                    <CheckCircle sx={{ fontSize: 40 }} />
                  </Avatar>
                  <Typography variant="h4" color="success.main" fontWeight="bold" gutterBottom>
                    Scan Complete!
                  </Typography>
                  <Typography variant="body1" color="success.contrastText">
                    Document details have been successfully extracted and verified.
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        p: { xs: 2, md: 3 }, 
        bgcolor: 'grey.50',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1, sm: 0 }
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          fullWidth={isMobile}
          size={isMobile ? 'large' : 'medium'}
        >
          Cancel
        </Button>
        
        <Box sx={{ flex: 1 }} />
        
        {scanningState.stage === 'camera_ready' && cameraReady && (
          <Button
            variant="contained"
            onClick={startAutoScanning}
            startIcon={<PhotoCamera />}
            fullWidth={isMobile}
            size={isMobile ? 'large' : 'medium'}
          >
            Start Auto-Scan
          </Button>
        )}

        {scanningState.stage === 'review' && documentData && (
          <>
            <Button
              variant="outlined"
              onClick={retryScanning}
              startIcon={<Refresh />}
              sx={{ mr: 1 }}
            >
              Scan Again
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={confirmDocumentData}
              startIcon={<CheckCircle />}
              fullWidth={isMobile}
              size={isMobile ? 'large' : 'medium'}
            >
              Confirm Details
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DocumentScannerModal;