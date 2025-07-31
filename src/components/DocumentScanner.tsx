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
  MicOff,
  VolumeUp
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
  completeness: number; // 0-1 scale for how complete the extraction is
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
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [scanningState, setScanningState] = useState<{
    stage: 'initializing' | 'camera_ready' | 'continuous_scanning' | 'processing' | 'analyzing' | 'extracting' | 'review' | 'correcting' | 'complete';
    progress: number;
    detectedType: string;
    confidence: number;
    scanAttempts: number;
    maxAttempts: number;
  }>({
    stage: 'initializing',
    progress: 0,
    detectedType: '',
    confidence: 0,
    scanAttempts: 0,
    maxAttempts: 10
  });

  const [cameraReady, setCameraReady] = useState(false);
  const [scannedImages, setScannedImages] = useState<string[]>([]);
  const [allExtractedTexts, setAllExtractedTexts] = useState<string[]>([]);
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [editingField, setEditingField] = useState<string>('');
  const [tempEditValue, setTempEditValue] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [aiInstructions, setAiInstructions] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string>('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);

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

  // Initialize Tesseract worker with better settings
  useEffect(() => {
    const initWorker = async () => {
      try {
        console.log('🔧 Initializing Enhanced Tesseract OCR worker...');
        setScanningState(prev => ({ ...prev, stage: 'initializing', progress: 10 }));
        
        const worker = await createWorker('eng');
        
        // Enhanced OCR settings for better document recognition
        await worker.setParameters({
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,:-/()[]<>',
          tessedit_pageseg_mode: '6', // Uniform block of text
          tessedit_ocr_engine_mode: '1', // Neural nets LSTM engine
          preserve_interword_spaces: '1',
          user_defined_dpi: '300'
        });
        
        workerRef.current = worker;
        setScanningState(prev => ({ ...prev, stage: 'camera_ready', progress: 20 }));
        console.log('✅ Enhanced Tesseract worker ready');
        
        // Speak initialization complete
        speakInstruction("AI document scanner ready. Position your document clearly in the frame.");
        
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
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [isOpen]);

  // Auto-start continuous scanning when camera is ready
  useEffect(() => {
    if (isOpen && cameraReady && scanningState.stage === 'camera_ready') {
      // Just show ready state, wait for user to capture
      setScanningState(prev => ({ ...prev, stage: 'camera_ready' }));
      speakInstruction("Position your document clearly in the frame and click capture when ready.");
    }
  }, [isOpen, cameraReady, scanningState.stage]);

  // Process voice corrections
  useEffect(() => {
    if (finalTranscript && finalTranscript.trim() && editingField) {
      processVoiceCorrection(finalTranscript, editingField);
      resetTranscript();
    }
  }, [finalTranscript, editingField]);

  // AI voice instruction function
  const speakInstruction = useCallback(async (text: string) => {
    if (!text || isSpeaking) return;
    
    setIsSpeaking(true);
    setAiInstructions(text);
    
    try {
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel(); // Stop any current speech
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.8;
        utterance.pitch = 1;
        utterance.volume = 0.9;
        
        utterance.onend = () => {
          setIsSpeaking(false);
        };
        
        utterance.onerror = () => {
          setIsSpeaking(false);
        };
        
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
    }
  }, [isSpeaking]);

  const handleCameraReady = useCallback(() => {
    setCameraReady(true);
    setError('');
    console.log('📷 Camera ready for continuous scanning');
  }, []);

  const handleCameraError = useCallback((error: string | DOMException) => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    setError(errorMessage);
    onError(`Camera error: ${errorMessage}`);
    console.error('❌ Camera error:', error);
  }, [onError]);

  const captureDocument = async () => {
    if (!webcamRef.current) return;
    
    try {
      setScanningState(prev => ({ ...prev, stage: 'capturing' }));
      speakInstruction("Capturing document image...");
      
      // Capture the image
      const imageSrc = webcamRef.current.getScreenshot({
        width: 1920,
        height: 1080,
        screenshotFormat: 'image/jpeg',
        screenshotQuality: 0.95
      });
      
      if (imageSrc) {
        setCapturedImage(imageSrc);
        setScanningState(prev => ({ ...prev, stage: 'processing' }));
        speakInstruction("Document captured successfully. Now extracting details from the image...");
        
        // Process the captured image
        await processDocumentImage(imageSrc);
      }
    } catch (error) {
      console.error('Document capture error:', error);
      setScanningState(prev => ({ ...prev, stage: 'error' }));
      speakInstruction("Failed to capture document. Please try again.");
    }
  };
  
  const processDocumentImage = async (imageData: string) => {
    if (!imageData) return;
    
    setIsProcessingImage(true);
    speakInstruction("Processing document image with AI. This may take a moment...");
    
    try {
      // Process with OCR
      const ocrResult = await performOCR(imageData);
      const documentType = identifyDocumentType(ocrResult);
      const extractedData = extractDocumentData(ocrResult, documentType);
      
      // Calculate completeness
      const completeness = calculateCompleteness(extractedData, documentType);
      
      if (completeness >= 60) {
        // Sufficient data extracted
        setScanningState(prev => ({ ...prev, stage: 'completed' }));
        speakInstruction(`Document details extracted with ${Math.round(completeness)}% accuracy. Please review and correct any incorrect details.`);
        
        const finalData: DocumentData = {
          name: extractedData.name || 'Not detected',
          documentNumber: extractedData.documentNumber || 'Not detected',
          documentType: documentType,
          nationality: extractedData.nationality,
          dateOfBirth: extractedData.dateOfBirth,
          expiryDate: extractedData.expiryDate,
          photo: imageData,
          confidence: completeness / 100,
          completeness: completeness / 100
        };
        
        onScanComplete(finalData);
      } else {
        // Insufficient data, ask for retry
        setScanningState(prev => ({ ...prev, stage: 'error' }));
        speakInstruction(`Only ${Math.round(completeness)}% of details extracted. Please recapture the document with better lighting and positioning.`);
      }
      
    } catch (error) {
      console.error('Document processing error:', error);
      setScanningState(prev => ({ ...prev, stage: 'error' }));
      speakInstruction("Failed to process document image. Please try capturing again with better lighting.");
    } finally {
      setIsProcessingImage(false);
    }
  };

  const performSingleScan = async () => {
    if (!webcamRef.current || !workerRef.current) return;

    try {
      const currentAttempt = scanningState.scanAttempts + 1;
      setScanningState(prev => ({ 
        ...prev, 
        scanAttempts: currentAttempt,
        progress: 30 + (currentAttempt / prev.maxAttempts) * 40
      }));

      console.log(`🔍 Scan attempt ${currentAttempt}/${scanningState.maxAttempts}`);
      
      // Capture image
      const imageSrc = webcamRef.current.getScreenshot({
        width: 1280,
        height: 720,
        quality: 0.95
      });
      
      if (!imageSrc) {
        console.warn('Failed to capture image, retrying...');
        return;
      }

      // Add to scanned images
      setScannedImages(prev => [...prev, imageSrc]);

      // Process with enhanced OCR
      const { data: { text, confidence } } = await workerRef.current.recognize(imageSrc, {
        rectangle: { top: 0, left: 0, width: 1280, height: 720 }
      });

      console.log(`📄 OCR Text (${confidence}% confidence):`, text.substring(0, 200) + '...');
      
      // Add to all extracted texts
      setAllExtractedTexts(prev => [...prev, text]);

      // Combine all texts for better analysis
      const combinedText = allExtractedTexts.join(' ') + ' ' + text;
      
      // Analyze document with combined text
      const documentData = await analyzeDocumentWithAI(combinedText, imageSrc, confidence);
      
      // Check if we have sufficient data
      if (documentData.completeness >= 0.7) {
        // Stop continuous scanning
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current);
        }
        
        setScanningState(prev => ({ 
          ...prev, 
          stage: 'review', 
          progress: 100,
          detectedType: documentData.documentType,
          confidence: documentData.confidence
        }));

        setDocumentData(documentData);
        speakInstruction(`Document scanned successfully. ${documentData.documentType.replace('_', ' ')} identified with ${Math.round(documentData.confidence * 100)}% confidence. Please review the details.`);
        
        console.log('✅ Document scanning complete:', documentData);
        return;
      }

      // Continue scanning if not enough data
      if (currentAttempt >= scanningState.maxAttempts) {
        // Stop after max attempts
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current);
        }
        
        if (documentData.completeness > 0.3) {
          // Partial data available
          setScanningState(prev => ({ 
            ...prev, 
            stage: 'review', 
            progress: 80,
            detectedType: documentData.documentType,
            confidence: documentData.confidence
          }));
          setDocumentData(documentData);
          speakInstruction("Partial document details extracted. Please review and correct any missing information using voice commands.");
        } else {
          // Failed to get sufficient data
          setError('Unable to extract sufficient document details. Please ensure document is clearly visible and try again.');
          speakInstruction("Unable to read document clearly. Please reposition your document and try again.");
        }
      } else {
        // Provide guidance for better scanning
        const missingFields = getMissingFields(documentData);
        if (missingFields.length > 0) {
          speakInstruction(`Still scanning for ${missingFields.join(', ')}. Please hold document steady.`);
        }
      }

    } catch (error) {
      console.error('❌ Scan attempt error:', error);
      // Continue scanning on individual errors
    }
  };

  const analyzeDocumentWithAI = async (
    text: string, 
    imageSrc: string, 
    ocrConfidence: number
  ): Promise<DocumentData> => {
    setScanningState(prev => ({ ...prev, stage: 'analyzing' }));
    
    const cleanText = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    console.log('🧠 Analyzing text:', cleanText.substring(0, 300) + '...');
    
    // Enhanced document type identification with better patterns
    const documentPatterns = {
      passport: {
        patterns: [
          /passport/i, /republic\s+of\s+india/i, /भारत\s+गणराज्य/i, /united\s+states\s+of\s+america/i,
          /type\s*[:\-]?\s*p/i, /passport\s*no/i, /travel\s*document/i, /nationality/i,
          /date\s+of\s+birth/i, /place\s+of\s+birth/i, /country\s+code/i, /issuing\s+authority/i,
          /valid\s+until/i, /expires/i, /issued\s+on/i
        ],
        weight: 1.0,
        requiredFields: ['name', 'documentNumber', 'nationality', 'dateOfBirth', 'expiryDate']
      },
      pan: {
        patterns: [
          /permanent\s+account\s+number/i, /income\s+tax\s+department/i, /govt\s*\.?\s*of\s+india/i,
          /pan\s*card/i, /[A-Z]{5}[0-9]{4}[A-Z]{1}/, /father\s*\'?s?\s+name/i, /signature/i,
          /acknowledgment/i, /permanent\s+account/i
        ],
        weight: 1.0,
        requiredFields: ['name', 'documentNumber', 'dateOfBirth']
      },
      license: {
        patterns: [
          /driving\s*license/i, /driver\s*license/i, /dl\s*no/i, /license\s*no/i,
          /transport\s+department/i, /motor\s+vehicle/i, /class\s+of\s+vehicle/i,
          /valid\s+till/i, /issued\s+on/i, /driving\s+licence/i, /learner/i
        ],
        weight: 1.0,
        requiredFields: ['name', 'documentNumber', 'dateOfBirth', 'address']
      },
      green_card: {
        patterns: [
          /permanent\s+resident\s+card/i, /united\s+states\s+of\s+america/i, /uscis/i,
          /green\s*card/i, /resident\s+since/i, /alien\s+number/i, /card\s+expires/i,
          /category/i, /country\s+of\s+birth/i
        ],
        weight: 1.0,
        requiredFields: ['name', 'documentNumber', 'nationality', 'dateOfBirth']
      },
      id_card: {
        patterns: [
          /identity\s*card/i, /id\s*card/i, /identification/i,
          /employee\s*id/i, /student\s*id/i, /government\s*id/i, /voter\s*id/i
        ],
        weight: 0.8,
        requiredFields: ['name', 'documentNumber']
      }
    };

    // Calculate confidence for each document type
    let bestMatch: { type: keyof typeof documentPatterns; confidence: number; config: any } = {
      type: 'id_card',
      confidence: 0,
      config: documentPatterns.id_card
    };

    for (const [type, config] of Object.entries(documentPatterns)) {
      const matchCount = config.patterns.filter(pattern => pattern.test(cleanText)).length;
      const typeConfidence = (matchCount / config.patterns.length) * config.weight;
      
      if (typeConfidence > bestMatch.confidence) {
        bestMatch = {
          type: type as keyof typeof documentPatterns,
          confidence: typeConfidence,
          config
        };
      }
    }

    const documentType = bestMatch.type;
    console.log(`🎯 Document type identified: ${documentType} (${Math.round(bestMatch.confidence * 100)}% confidence)`);
    
    setScanningState(prev => ({ ...prev, stage: 'extracting' }));
    
    // Extract data with enhanced patterns
    const extractedData = await extractDocumentDataEnhanced(cleanText, documentType);
    
    // Calculate completeness based on required fields
    const completeness = calculateCompleteness(extractedData, bestMatch.config.requiredFields);
    
    // Calculate overall confidence
    const dataConfidence = calculateDataConfidence(extractedData, cleanText);
    const finalConfidence = Math.min((bestMatch.confidence + dataConfidence + (ocrConfidence / 100)) / 3, 1.0);

    console.log(`📊 Extraction completeness: ${Math.round(completeness * 100)}%, confidence: ${Math.round(finalConfidence * 100)}%`);

    return {
      ...extractedData,
      documentType,
      photo: imageSrc,
      confidence: finalConfidence,
      rawText: cleanText,
      completeness
    };
  };

  const extractDocumentDataEnhanced = async (text: string, docType: keyof typeof documentPatterns): Promise<Partial<DocumentData>> => {
    const data: Partial<DocumentData> = {};

    switch (docType) {
      case 'passport':
        data.name = extractNameEnhanced(text, 'passport');
        data.documentNumber = extractPassportNumberEnhanced(text);
        data.nationality = extractNationalityEnhanced(text);
        data.dateOfBirth = extractDateOfBirthEnhanced(text);
        data.expiryDate = extractExpiryDateEnhanced(text);
        break;

      case 'pan':
        data.name = extractNameEnhanced(text, 'pan');
        data.documentNumber = extractPANNumberEnhanced(text);
        data.dateOfBirth = extractDateOfBirthEnhanced(text);
        break;

      case 'license':
        data.name = extractNameEnhanced(text, 'license');
        data.documentNumber = extractLicenseNumberEnhanced(text);
        data.dateOfBirth = extractDateOfBirthEnhanced(text);
        data.address = extractAddressEnhanced(text);
        data.expiryDate = extractExpiryDateEnhanced(text);
        break;

      case 'green_card':
        data.name = extractNameEnhanced(text, 'green_card');
        data.documentNumber = extractGreenCardNumberEnhanced(text);
        data.nationality = extractNationalityEnhanced(text);
        data.dateOfBirth = extractDateOfBirthEnhanced(text);
        break;

      case 'id_card':
        data.name = extractNameEnhanced(text, 'id_card');
        data.documentNumber = extractIDNumberEnhanced(text);
        data.dateOfBirth = extractDateOfBirthEnhanced(text);
        break;
    }

    return data;
  };

  // Enhanced extraction functions with better accuracy
  const extractNameEnhanced = (text: string, docType: string): string => {
    const namePatterns = [
      // Passport specific patterns
      /given\s+names?\s*[:\-]?\s*([A-Z][A-Z\s]{2,30})/i,
      /surname\s*[:\-]?\s*([A-Z][A-Z\s]{2,30})/i,
      /name\s*[:\-]?\s*([A-Z][A-Z\s]{4,40})/i,
      
      // PAN card specific patterns
      /name\s*[:\-]?\s*([A-Z][A-Z\s]{4,40})/i,
      /([A-Z]{2,}\s+[A-Z]{2,}(?:\s+[A-Z]{2,})?(?:\s+[A-Z]{2,})?)/,
      
      // License specific patterns
      /name\s*[:\-]?\s*([A-Z][A-Z\s]{4,40})/i,
      /holder\s*[:\-]?\s*([A-Z][A-Z\s]{4,40})/i,
      
      // General patterns - more specific
      /([A-Z]{2,}\s+[A-Z]{2,}(?:\s+[A-Z]{2,})?)/,
      /([A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?)/,
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim().replace(/\s+/g, ' ');
        // Validate name quality
        if (name.length >= 4 && name.split(' ').length >= 2 && !name.includes('INDIA') && !name.includes('GOVERNMENT')) {
          console.log(`✅ Name extracted: ${name}`);
          return name;
        }
      }
    }

    console.warn('⚠️ Name not found, using fallback');
    return '';
  };

  const extractDateOfBirthEnhanced = (text: string): string => {
    const dobPatterns = [
      // Various date formats with DOB context
      /(?:dob|date\s+of\s+birth|born\s+on?)\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
      /(?:dob|date\s+of\s+birth|born\s+on?)\s*[:\-]?\s*(\d{1,2}\s+\w+\s+\d{4})/i,
      /(?:dob|date\s+of\s+birth|born\s+on?)\s*[:\-]?\s*(\w+\s+\d{1,2},?\s+\d{4})/i,
      
      // Date patterns near birth context
      /birth\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
      /birth\s*[:\-]?\s*(\d{1,2}\s+\w+\s+\d{4})/i,
      
      // Standalone date patterns (more restrictive)
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.](19|20)\d{2})/,
      /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(19|20)\d{2})/i,
    ];

    for (const pattern of dobPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const dateStr = match[1].trim();
        // Validate date format and range
        if (isValidBirthDate(dateStr)) {
          console.log(`✅ Date of birth extracted: ${dateStr}`);
          return formatDate(dateStr);
        }
      }
    }

    console.warn('⚠️ Date of birth not found');
    return '';
  };

  const extractPassportNumberEnhanced = (text: string): string => {
    const passportPatterns = [
      /passport\s*(?:no|number)\s*[:\-]?\s*([A-Z]\d{7,8})/i,
      /passport\s*[:\-]?\s*([A-Z]\d{7,8})/i,
      /([A-Z]\d{7,8})(?=\s|$)/,
      /p\s*[:\-]?\s*([A-Z0-9]{8,9})/i,
      /([A-Z]{1,2}\d{6,8})/,
      // Indian passport format
      /([A-Z]\d{7})/,
      // US passport format
      /([A-Z]{2}\d{7})/
    ];

    for (const pattern of passportPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const passportNo = match[1].toUpperCase().replace(/\s/g, '');
        if (passportNo.length >= 7 && passportNo.length <= 9) {
          console.log(`✅ Passport number extracted: ${passportNo}`);
          return passportNo;
        }
      }
    }

    console.warn('⚠️ Passport number not found');
    return '';
  };

  const extractPANNumberEnhanced = (text: string): string => {
    const panPatterns = [
      /([A-Z]{5}[0-9]{4}[A-Z]{1})/g,
      /pan\s*(?:no|number)\s*[:\-]?\s*([A-Z]{5}[0-9]{4}[A-Z]{1})/i,
      /permanent\s+account\s*[:\-]?\s*([A-Z]{5}[0-9]{4}[A-Z]{1})/i
    ];

    for (const pattern of panPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match && match[1]) {
          const panNo = match[1].toUpperCase();
          console.log(`✅ PAN number extracted: ${panNo}`);
          return panNo;
        }
      }
    }

    console.warn('⚠️ PAN number not found');
    return '';
  };

  const extractLicenseNumberEnhanced = (text: string): string => {
    const licensePatterns = [
      /(?:dl|license)\s*(?:no|number)\s*[:\-]?\s*([A-Z0-9]{10,16})/i,
      /([A-Z]{2}\d{2}\s?\d{11})/,
      /([A-Z]{2}-\d{13})/,
      /([A-Z]{2}\d{13})/,
      // Indian DL format
      /([A-Z]{2}-?\d{2}-?\d{4}-?\d{7})/,
      /([A-Z]{2}\d{14})/
    ];

    for (const pattern of licensePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const licenseNo = match[1].replace(/\s/g, '').toUpperCase();
        console.log(`✅ License number extracted: ${licenseNo}`);
        return licenseNo;
      }
    }

    console.warn('⚠️ License number not found');
    return '';
  };

  const extractGreenCardNumberEnhanced = (text: string): string => {
    const greenCardPatterns = [
      /uscis\s*(?:no|number)\s*[:\-]?\s*([A-Z0-9]{13})/i,
      /card\s*(?:no|number)\s*[:\-]?\s*([A-Z0-9]{13})/i,
      /([A-Z]{3}\d{10})/,
      /alien\s*(?:no|number)\s*[:\-]?\s*([A-Z0-9]{8,13})/i,
      /receipt\s*(?:no|number)\s*[:\-]?\s*([A-Z]{3}\d{10})/i
    ];

    for (const pattern of greenCardPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const greenCardNo = match[1].toUpperCase();
        console.log(`✅ Green card number extracted: ${greenCardNo}`);
        return greenCardNo;
      }
    }

    console.warn('⚠️ Green card number not found');
    return '';
  };

  const extractIDNumberEnhanced = (text: string): string => {
    const idPatterns = [
      /(?:id|identification)\s*(?:no|number)\s*[:\-]?\s*([A-Z0-9]{6,15})/i,
      /employee\s*id\s*[:\-]?\s*([A-Z0-9]{6,15})/i,
      /card\s*(?:no|number)\s*[:\-]?\s*([A-Z0-9]{6,15})/i,
      /([A-Z0-9]{8,12})/
    ];

    for (const pattern of idPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const idNo = match[1].toUpperCase();
        console.log(`✅ ID number extracted: ${idNo}`);
        return idNo;
      }
    }

    console.warn('⚠️ ID number not found');
    return '';
  };

  const extractNationalityEnhanced = (text: string): string => {
    const nationalityPatterns = [
      /nationality\s*[:\-]?\s*([A-Z]{3}|[A-Z][a-z]+)/i,
      /country\s*[:\-]?\s*([A-Z]{3}|[A-Z][a-z]+)/i,
      /citizen\s+of\s+([A-Z][a-z]+)/i,
      /(india|indian)/i,
      /(usa|united\s+states)/i,
      /(uk|united\s+kingdom|britain)/i,
      /(canada|canadian)/i,
      /(australia|australian)/i
    ];

    for (const pattern of nationalityPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let nationality = match[1].toUpperCase();
        // Normalize common variations
        if (nationality.includes('UNITED STATES') || nationality === 'USA') nationality = 'USA';
        if (nationality.includes('UNITED KINGDOM') || nationality === 'UK') nationality = 'UK';
        if (nationality === 'INDIAN') nationality = 'INDIA';
        
        console.log(`✅ Nationality extracted: ${nationality}`);
        return nationality;
      }
    }

    console.warn('⚠️ Nationality not found');
    return '';
  };

  const extractExpiryDateEnhanced = (text: string): string => {
    const expiryPatterns = [
      /(?:expiry|expires|valid\s+until|valid\s+till)\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
      /(?:expiry|expires|valid\s+until|valid\s+till)\s*[:\-]?\s*(\d{1,2}\s+\w+\s+\d{4})/i,
      /(?:expiry|expires|valid\s+until|valid\s+till)\s*[:\-]?\s*(\w+\s+\d{1,2},?\s+\d{4})/i,
      // Look for dates after expiry context
      /expiry.*?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
      /expires.*?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i
    ];

    for (const pattern of expiryPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const dateStr = match[1].trim();
        if (isValidFutureDate(dateStr)) {
          console.log(`✅ Expiry date extracted: ${dateStr}`);
          return formatDate(dateStr);
        }
      }
    }

    console.warn('⚠️ Expiry date not found');
    return '';
  };

  const extractAddressEnhanced = (text: string): string => {
    const addressPatterns = [
      /address\s*[:\-]?\s*([A-Za-z0-9\s,.\-#\/]{15,100})/i,
      /residence\s*[:\-]?\s*([A-Za-z0-9\s,.\-#\/]{15,100})/i,
      /([A-Za-z0-9\s,.\-#\/]{20,80}(?:street|road|avenue|lane|drive|nagar|colony|sector))/i
    ];

    for (const pattern of addressPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const address = match[1].trim().replace(/\s+/g, ' ');
        if (address.length >= 15) {
          console.log(`✅ Address extracted: ${address}`);
          return address;
        }
      }
    }

    console.warn('⚠️ Address not found');
    return '';
  };

  // Helper functions for validation
  const isValidBirthDate = (dateStr: string): boolean => {
    try {
      const date = new Date(dateStr);
      const currentYear = new Date().getFullYear();
      const birthYear = date.getFullYear();
      return birthYear >= 1900 && birthYear <= currentYear - 10; // At least 10 years old
    } catch {
      return false;
    }
  };

  const isValidFutureDate = (dateStr: string): boolean => {
    try {
      const date = new Date(dateStr);
      const currentDate = new Date();
      return date > currentDate; // Must be in the future
    } catch {
      return false;
    }
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
    } catch {
      return dateStr;
    }
  };

  const calculateCompleteness = (data: Partial<DocumentData>, requiredFields: string[]): number => {
    const extractedFields = requiredFields.filter(field => {
      const value = data[field as keyof DocumentData];
      return value && String(value).trim().length > 0;
    });
    
    return extractedFields.length / requiredFields.length;
  };

  const calculateDataConfidence = (data: Partial<DocumentData>, text: string): number => {
    let score = 0;
    let maxScore = 0;

    // Name confidence
    maxScore += 0.3;
    if (data.name && data.name.length > 4 && data.name.split(' ').length >= 2) {
      score += 0.3;
    } else if (data.name && data.name.length > 0) {
      score += 0.1;
    }

    // Document number confidence
    maxScore += 0.3;
    if (data.documentNumber && data.documentNumber.length >= 6) {
      score += 0.3;
    } else if (data.documentNumber && data.documentNumber.length > 0) {
      score += 0.1;
    }

    // Date confidence
    maxScore += 0.2;
    if (data.dateOfBirth && isValidBirthDate(data.dateOfBirth)) {
      score += 0.2;
    } else if (data.dateOfBirth) {
      score += 0.1;
    }

    // Additional fields confidence
    maxScore += 0.2;
    if (data.nationality || data.address || data.expiryDate) {
      score += 0.2;
    }

    return maxScore > 0 ? score / maxScore : 0.3;
  };

  const getMissingFields = (data: Partial<DocumentData>): string[] => {
    const missing: string[] = [];
    if (!data.name || data.name.length < 4) missing.push('name');
    if (!data.documentNumber || data.documentNumber.length < 6) missing.push('document number');
    if (!data.dateOfBirth) missing.push('date of birth');
    return missing;
  };

  const performOCR = async (imageData: string): Promise<string> => {
    try {
      speakInstruction("Extracting text from document using AI OCR...");
      
      const worker = await createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      
      // Enhanced OCR settings for better accuracy
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,/-:',
        tessedit_pageseg_mode: '6', // Uniform block of text
        preserve_interword_spaces: '1'
      });
      
      const { data: { text } } = await worker.recognize(imageData);
      await worker.terminate();
      
      console.log('OCR extracted text:', text.substring(0, 200) + '...');
      return text;
    } catch (error) {
      console.error('OCR error:', error);
      throw new Error('Failed to extract text from document');
    }
  };
  
  const identifyDocumentType = (text: string): DocumentType => {
    speakInstruction("Identifying document type...");
    
    const lowerText = text.toLowerCase();
    
    // Enhanced patterns for better document identification
    if (lowerText.includes('passport') || 
        lowerText.includes('republic of india') || 
        lowerText.includes('united states of america') ||
        /type\s*[:\-]?\s*p/i.test(text) ||
        lowerText.includes('nationality')) {
      return 'passport';
    }
    
    if (lowerText.includes('permanent account number') || 
        lowerText.includes('income tax department') ||
        /[A-Z]{5}\d{4}[A-Z]/.test(text) ||
        lowerText.includes('pan card')) {
      return 'pan';
    }
    
    if (lowerText.includes('driving license') || 
        lowerText.includes('driver license') ||
        lowerText.includes('transport department') ||
        /dl\s*no/i.test(text)) {
      return 'license';
    }
    
    if (lowerText.includes('permanent resident card') || 
        lowerText.includes('uscis') ||
        lowerText.includes('green card')) {
      return 'green_card';
    }
    
    return 'id_card';
  };
  
  const extractDocumentData = (text: string, docType: DocumentType): Partial<DocumentData> => {
    speakInstruction(`Extracting ${docType.replace('_', ' ')} details...`);
    
    const data: Partial<DocumentData> = {};
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    switch (docType) {
      case 'passport':
        // Enhanced passport extraction
        data.name = extractPassportName(text);
        data.documentNumber = extractPattern(text, /(?:passport\s*(?:no|number|#)?\s*:?\s*)?([A-Z]\d{8}|[A-Z]{2}\d{7})/gi)?.[0];
        data.nationality = extractPattern(text, /(?:nationality|country)\s*:?\s*([A-Z]{3}|[A-Z][a-z]+)/gi)?.[0];
        data.dateOfBirth = extractDateOfBirth(text);
        data.expiryDate = extractExpiryDate(text);
        break;
        
      case 'pan':
        // Enhanced PAN card extraction
        data.name = extractPanName(text);
        data.documentNumber = extractPattern(text, /(?:pan\s*(?:no|number|#)?\s*:?\s*)?([A-Z]{5}\d{4}[A-Z])/gi)?.[0];
        data.dateOfBirth = extractDateOfBirth(text);
        break;
        
      case 'license':
        // Enhanced license extraction
        data.name = extractLicenseName(text);
        data.documentNumber = extractPattern(text, /(?:DL|LICENSE)\s*(?:NO|NUMBER|#)?\s*:?\s*([A-Z0-9]{10,20})/gi)?.[0] ||
                            extractPattern(text, /[A-Z]{2}\d{2}\s?\d{11}|[A-Z]\d{7,15}/g)?.[0];
        data.dateOfBirth = extractDateOfBirth(text);
        data.expiryDate = extractExpiryDate(text);
        break;
        
      case 'green_card':
        // Enhanced green card extraction
        data.name = extractGreenCardName(text);
        data.documentNumber = extractPattern(text, /(?:USCIS|A)\s*(?:NO|NUMBER|#)?\s*:?\s*(\d{8,9})/gi)?.[0] ||
                            extractPattern(text, /(?:card\s*(?:no|number|#)?\s*:?\s*)?(\d{3}-\d{3}-\d{3}|\d{9})/gi)?.[0];
        data.nationality = 'USA';
        data.dateOfBirth = extractDateOfBirth(text);
        break;
        
      default:
        // Generic ID card extraction
        data.name = extractGenericName(text);
        data.documentNumber = extractPattern(text, /(?:id\s*(?:no|number|#)?\s*:?\s*)?([A-Z0-9]{6,20})/gi)?.[0];
        data.dateOfBirth = extractDateOfBirth(text);
        break;
    }
    
    return data;
  };
  
  // Enhanced name extraction functions
  const extractPassportName = (text: string): string => {
    const lines = text.split('\n');
    const namePatterns = [
      /(?:name|surname|given\s*names?)\s*:?\s*([A-Z][A-Z\s]{2,40})/gi,
      /^([A-Z][A-Z\s]{2,40})$/gm, // Full caps names on their own line
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g // Proper case names
    ];
    
    for (const pattern of namePatterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        const name = match[1]?.trim();
        if (name && name.length > 2 && !isCountryOrDocument(name)) {
          return name;
        }
      }
    }
    return '';
  };
  
  const extractPanName = (text: string): string => {
    const namePatterns = [
      /(?:name|full\s*name)\s*:?\s*([A-Z][A-Z\s]{2,40})/gi,
      /^([A-Z][A-Z\s]{2,40})$/gm
    ];
    
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1] && !isCountryOrDocument(match[1])) {
        return match[1].trim();
      }
    }
    return '';
  };
  
  const extractLicenseName = (text: string): string => {
    const namePatterns = [
      /(?:name|holder|full\s*name)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi,
      /([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g
    ];
    
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1] && !isCountryOrDocument(match[1])) {
        return match[1].trim();
      }
    }
    return '';
  };
  
  const extractGreenCardName = (text: string): string => {
    const nameMatch = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
    return nameMatch ? nameMatch[1].trim() : '';
  };
  
  const extractGenericName = (text: string): string => {
    // Generic name extraction for any ID
    const namePatterns = [
      /(?:name|full\s*name)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi,
      /([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g
    ];
    
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1] && !isCountryOrDocument(match[1])) {
        return match[1].trim();
      }
    }
    return '';
  };
  
  const isCountryOrDocument = (text: string): boolean => {
    const excludeWords = ['passport', 'republic', 'united states', 'india', 'government', 'department', 'ministry', 'authority', 'card', 'license', 'driving'];
    return excludeWords.some(word => text.toLowerCase().includes(word));
  };
  
  const extractDateOfBirth = (text: string): string => {
    // Enhanced date extraction with multiple patterns
    const datePatterns = [
      /(?:date\s*of\s*birth|dob|birth\s*date)\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/gi,
      /(?:born|birth)\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/gi,
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/g,
      /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/g, // YYYY-MM-DD format
      /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})/gi // DD MMM YYYY
    ];
    
    for (const pattern of datePatterns) {
      const matches = [...text.matchAll(pattern)];
      if (matches && matches.length > 0) {
        for (const match of matches) {
          const dateStr = match[1] || match[0];
          
          // Validate date is reasonable for birth date
          const year = parseInt(dateStr.match(/\d{4}/)?.[0] || '0');
          const currentYear = new Date().getFullYear();
          if (year < 1900 || year > currentYear - 10) {
            continue; // Skip unreasonable birth years
          }
          
          if (isValidDate(dateStr)) {
            return formatDate(dateStr);
          }
        }
      }
    }
    return '';
  };
  
  const extractExpiryDate = (text: string): string => {
    const expiryPatterns = [
      /(?:expiry|expires|valid\s*until|exp)\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/gi,
      /(?:valid\s*till|till)\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/gi,
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/g, // Any date that could be expiry
      /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})/gi
    ];
    
    for (const pattern of expiryPatterns) {
      const matches = [...text.matchAll(pattern)];
      if (matches && matches.length > 0) {
        for (const match of matches) {
          const dateStr = match[1] || match[0];
          
          // Validate date is reasonable for expiry (future date)
          const year = parseInt(dateStr.match(/\d{4}/)?.[0] || '0');
          const currentYear = new Date().getFullYear();
          if (year < currentYear || year > currentYear + 20) {
            continue; // Skip unreasonable expiry years
          }
          
          if (isValidDate(dateStr)) {
            return formatDate(dateStr);
          }
        }
      }
    }
    return '';
  };
  
  const extractPattern = (text: string, pattern: RegExp): string[] => {
    const matches = [...text.matchAll(pattern)];
    return matches.map(match => match[1] || match[0]).filter(Boolean);
  };
  
  const isValidDate = (dateStr: string): boolean => {
    try {
      const date = new Date(dateStr);
      return !isNaN(date.getTime()) && date.getFullYear() > 1900;
    } catch {
      return false;
    }
  };
  
  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
    } catch {
      return dateStr;
    }
  };
  
  const calculateCompleteness = (data: Partial<DocumentData>, docType: DocumentType): number => {
    const requiredFields = {
      passport: ['name', 'documentNumber', 'nationality', 'dateOfBirth'],
      pan: ['name', 'documentNumber', 'dateOfBirth'],
      license: ['name', 'documentNumber', 'dateOfBirth'],
      green_card: ['name', 'documentNumber', 'nationality'],
      id_card: ['name', 'documentNumber']
    };
    
    const required = requiredFields[docType] || ['name', 'documentNumber'];
    const extracted = required.filter(field => {
      const value = data[field as keyof DocumentData];
      return value && String(value).trim().length > 0;
    });
    
    return (extracted.length / required.length) * 100;
  };

  // AI-powered voice correction with better prompts
  const processVoiceCorrection = async (voiceInput: string, fieldName: string) => {
    try {
      setScanningState(prev => ({ ...prev, stage: 'correcting' }));
      speakInstruction(`Processing your correction for ${fieldName}.`);
      
      const correctionPrompt = `
Extract the corrected ${fieldName} from this user input: "${voiceInput}"

Current ${fieldName}: "${documentData?.[fieldName as keyof DocumentData] || ''}"

Rules:
- For name: Extract full name in proper case (e.g., "John Smith")
- For documentNumber: Extract alphanumeric document number only
- For dateOfBirth: Convert to DD/MM/YYYY format
- For nationality: Extract country name or code
- For address: Extract complete address

User said: "${voiceInput}"

Respond with ONLY the corrected value, nothing else.
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
        speakInstruction(`${fieldName} updated to ${correctedValue}.`);
      }

      setEditingField('');
      setScanningState(prev => ({ ...prev, stage: 'review' }));
      
      console.log(`✅ AI corrected ${fieldName} to: ${correctedValue}`);

    } catch (error) {
      console.error('❌ AI correction error:', error);
      setError('Failed to process voice correction. Please try manual editing.');
      speakInstruction('Sorry, I could not process that correction. Please try again or edit manually.');
      setEditingField('');
    }
  };

  const startVoiceCorrection = (fieldName: string) => {
    setEditingField(fieldName);
    resetTranscript();
    startListening();
    speakInstruction(`Say the correct ${fieldName.replace(/([A-Z])/g, ' $1').toLowerCase()}.`);
  };

  const stopVoiceCorrection = () => {
    stopListening();
    setEditingField('');
    speakInstruction('Voice correction cancelled.');
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
      speakInstruction(`${editingField} has been updated.`);
    }
  };

  const confirmDocumentData = () => {
    if (documentData) {
      setScanningState(prev => ({ ...prev, stage: 'complete' }));
      speakInstruction('Document details confirmed. Processing check-in.');
      setTimeout(() => {
        onScanComplete(documentData);
        onClose();
      }, 1500);
    }
  };

  const retryScanning = () => {
    setCapturedImage('');
    setIsProcessingImage(false);
    setScanningState({
      stage: 'camera_ready',
      progress: 20,
      detectedType: '',
      confidence: 0,
      scanAttempts: 0,
      maxAttempts: 10
    });
    setScannedImages([]);
    setAllExtractedTexts([]);
    setDocumentData(null);
    setError('');
    setEditingField('');
    speakInstruction('Restarting document scanner. Please position your document clearly.');
  };

  const handleClose = () => {
    retryScanning();
    onClose();
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'ready':
        return { color: 'primary.main', text: 'Ready to Scan' };
      case 'capturing':
        return { color: 'info.main', text: 'Capturing Document...' };
      case 'processing':
        return { color: 'warning.main', text: 'Processing Document...' };
      case 'completed':
        return { color: 'success.main', text: 'Scan Complete' };
      case 'error':
        return { color: 'error.main', text: 'Scan Failed' };
      default:
        return { color: 'grey.500', text: 'Initializing...' };
    }
  };

  const getStageIcon = () => {
    switch (scanningState.stage) {
      case 'ready':
        return <CameraAlt sx={{ fontSize: 40, color: 'primary.main' }} />;
      case 'capturing':
        return <Scanner sx={{ fontSize: 40 }} />;
      case 'processing':
        return <DocumentScannerIcon sx={{ fontSize: 40, color: 'warning.main' }} />;
      case 'analyzing':
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
      case 'initializing':
        return 'Initializing AI Document Scanner...';
      case 'camera_ready':
        return 'Position Document Clearly - Auto-scan Starting Soon';
      case 'continuous_scanning':
        return `AI Continuously Scanning... (${scanningState.scanAttempts}/${scanningState.maxAttempts})`;
      case 'processing':
        return 'Processing Document with Enhanced OCR...';
      case 'analyzing':
        return 'AI Analyzing Document Type & Content...';
      case 'extracting':
        return 'Extracting Document Details...';
      case 'review':
        return 'Review Extracted Details - Use Voice to Correct';
      case 'correcting':
        return 'AI Processing Voice Correction...';
      case 'complete':
        return 'Document Scan Complete!';
      default:
        return 'Preparing AI Scanner...';
    }
  };

  const renderDocumentReview = () => {
    if (!documentData) return null;

    const fields = [
      { key: 'name', label: 'Full Name', required: true, description: 'Say: "My name is John Smith"' },
      { key: 'documentNumber', label: 'Document Number', required: true, description: 'Say: "Document number is ABC123"' },
      { key: 'documentType', label: 'Document Type', required: true, readonly: true },
      { key: 'dateOfBirth', label: 'Date of Birth', required: false, description: 'Say: "Born on March 15, 1990"' },
      { key: 'nationality', label: 'Nationality', required: false, description: 'Say: "Nationality is Indian"' },
      { key: 'expiryDate', label: 'Expiry Date', required: false, description: 'Say: "Expires on March 15, 2030"' },
      { key: 'address', label: 'Address', required: false, description: 'Say: "Address is 123 Main Street"' }
    ];

    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircle color="success" />
          AI Extracted Document Details
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Voice Corrections Available:</strong> Click the microphone next to any field and speak naturally to correct it.
          </Typography>
        </Alert>

        {/* Completeness Indicator */}
        <Card sx={{ mb: 3, bgcolor: documentData.completeness >= 0.7 ? 'success.light' : 'warning.light' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" fontWeight="bold">
                Extraction Completeness:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={documentData.completeness * 100}
                  sx={{ 
                    width: 120, 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: 'grey.300',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: documentData.completeness >= 0.7 ? 'success.main' : 'warning.main'
                    }
                  }}
                />
                <Typography variant="body2" fontWeight="bold">
                  {Math.round(documentData.completeness * 100)}%
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Grid container spacing={2}>
          {fields.map((field) => {
            const value = documentData[field.key as keyof DocumentData] as string;
            const isEditing = editingField === field.key;
            const isListeningForField = isListening && editingField === field.key;
            const hasValue = value && value.trim().length > 0;

            return (
              <Grid item xs={12} sm={6} key={field.key}>
                <Card sx={{ 
                  border: isEditing ? 2 : 1,
                  borderColor: isEditing ? 'primary.main' : hasValue ? 'success.light' : 'error.light',
                  bgcolor: isListeningForField ? 'primary.light' : hasValue ? 'success.light' : 'error.light'
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" fontWeight="bold" color="text.secondary">
                        {field.label} {field.required && <span style={{ color: 'red' }}>*</span>}
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
                      <Typography 
                        variant="body1" 
                        fontWeight="medium"
                        color={hasValue ? 'text.primary' : 'error.main'}
                      >
                        {value || 'Not detected - Use voice to add'}
                      </Typography>
                    )}

                    {/* Voice Listening Indicator */}
                    {isListeningForField && (
                      <Box sx={{ mt: 1, p: 1, bgcolor: 'primary.light', borderRadius: 1 }}>
                        <Typography variant="caption" color="primary.main" fontWeight="bold">
                          🎤 {field.description}
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

                    {/* Field Status Indicator */}
                    {!field.readonly && (
                      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {hasValue ? (
                          <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                        ) : (
                          <ErrorIcon sx={{ fontSize: 16, color: 'error.main' }} />
                        )}
                        <Typography variant="caption" color={hasValue ? 'success.main' : 'error.main'}>
                          {hasValue ? 'Extracted' : 'Missing'}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* AI Instructions Display */}
        {aiInstructions && (
          <Card sx={{ mt: 3, bgcolor: 'info.light' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VolumeUp color="info" />
                <Typography variant="body2" fontWeight="medium">
                  AI Instructions: {aiInstructions}
                </Typography>
                {isSpeaking && <CircularProgress size={16} />}
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    );
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      fullScreen
      PaperProps={{
        sx: {
          borderRadius: 0,
          m: 0,
          maxHeight: '100vh',
          height: '100vh',
          overflow: 'hidden'
        }
      }}
      TransitionComponent={undefined}
    >
      {/* Header */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          p: { xs: 2, md: 3 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {getStageIcon()}
          <Box>
            <Typography variant="h6" fontWeight="bold">
              AI Document Scanner
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
              Automatic document identification and data extraction
            </Typography>
          </Box>
        </Box>
        
        <IconButton onClick={handleClose} sx={{ color: 'white' }}>
          <Close />
        </IconButton>
      </Box>
      
      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {!capturedImage ? (
          /* Camera View */
          <Box sx={{ flex: 1, position: 'relative', bgcolor: 'black' }}>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              screenshotQuality={0.95}
              videoConstraints={{
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                facingMode: isMobile ? 'environment' : 'user',
                aspectRatio: 16/9
              }}
              onUserMedia={handleCameraReady}
              onUserMediaError={handleCameraError}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            
            {/* Document Frame Overlay - Only show when ready */}
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '85%', md: '70%' },
              height: { xs: '60%', md: '50%' },
              border: '3px solid',
              borderColor: scanningState.stage === 'ready' ? 'primary.main' : 
                          scanningState.stage === 'capturing' ? 'info.main' : 'warning.main',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: scanningState.stage === 'capturing' ? 'scanPulse 1s infinite' : 
                        scanningState.stage === 'processing' ? 'processPulse 2s infinite' : 'none',
              '@keyframes scanPulse': {
                '0%': { borderColor: 'info.main', boxShadow: '0 0 0 0 rgba(33, 150, 243, 0.7)' },
                '50%': { borderColor: 'success.main', boxShadow: '0 0 0 10px rgba(76, 175, 80, 0)' },
                '100%': { borderColor: 'warning.main', boxShadow: '0 0 0 0 rgba(255, 152, 0, 0.7)' }
              },
              '@keyframes processPulse': {
                '0%': { borderColor: 'warning.main', boxShadow: '0 0 0 0 rgba(255, 152, 0, 0.7)' },
                '50%': { borderColor: 'info.main', boxShadow: '0 0 0 15px rgba(33, 150, 243, 0)' },
                '100%': { borderColor: 'warning.main', boxShadow: '0 0 0 0 rgba(255, 152, 0, 0.7)' }
              }
            }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'white', 
                  textAlign: 'center',
                  bgcolor: 'rgba(0,0,0,0.8)',
                  p: { xs: 1.5, md: 2 },
                  borderRadius: 1,
                  fontWeight: 'bold',
                  fontSize: { xs: '0.8rem', md: '1rem' }
                }}
              >
                <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', md: '1rem' } }}>
                  {scanningState.stage === 'ready' && 'Position document clearly in frame'}
                  {scanningState.stage === 'capturing' && 'Capturing document image...'}
                  {scanningState.stage === 'processing' && 'AI is extracting document details...'}
                </Typography>
              </Typography>
            </Box>
            
            {/* Scanning Progress Overlay */}
            {scanningState.stage === 'processing' && (
              <Box sx={{
                position: 'absolute',
                bottom: { xs: 80, md: 100 },
                left: '50%',
                transform: 'translateX(-50%)',
                bgcolor: 'rgba(0,0,0,0.9)',
                color: 'white',
                p: { xs: 2, md: 3 },
                borderRadius: 2,
                minWidth: { xs: 280, md: 350 },
                textAlign: 'center'
              }}>
                <CircularProgress 
                  variant="determinate" 
                  value={scanningState.progress} 
                  size={50} 
                  sx={{ mb: 2, color: 'warning.main' }}
                />
                <Typography variant="body1" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>
                  {getStageText()}
                </Typography>
                <Typography variant="body2" textAlign="center" sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' } }}>
                  Extracting Details... {scanningState.progress}%
                </Typography>
                <Typography variant="caption" textAlign="center" sx={{ opacity: 0.8, fontSize: { xs: '0.7rem', md: '0.8rem' } }}>
                  AI is reading your document
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          /* Results View */
          <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2, md: 3 } }}>
            {/* Captured Image Preview */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Captured Document
              </Typography>
              <Box sx={{ 
                maxWidth: 400, 
                mx: 'auto', 
                border: 2, 
                borderColor: 'success.main',
                borderRadius: 2,
                overflow: 'hidden'
              }}>
                <img 
                  src={capturedImage} 
                  alt="Captured Document" 
                  style={{ 
                    width: '100%', 
                    height: 'auto',
                    display: 'block'
                  }} 
                />
              </Box>
            </Box>
            
            {/* Processing Status */}
            {isProcessingImage && (
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography variant="body1">
                  AI is extracting document details...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This may take a few moments
                </Typography>
              </Box>
            )}
            <Typography variant="h5" gutterBottom textAlign="center">
              Document Scan Results
            </Typography>
            
            {/* Results content would go here */}
            <Typography variant="body1" textAlign="center" color="text.secondary">
              Document processing complete. Review the extracted information above.
            </Typography>
          </Box>
        )}
      </Box>
      
      {/* Bottom Actions */}
      {scanningState.stage === 'ready' && !capturedImage && (
        <Box sx={{ 
          p: { xs: 2, md: 3 }, 
          bgcolor: 'grey.100',
          display: 'flex',
          justifyContent: 'center',
          gap: 2
        }}>
          <Button
            variant="contained"
            size="large"
            onClick={captureDocument}
            startIcon={<Scanner />}
            sx={{ minWidth: { xs: '100%', md: 200 }, py: { xs: 2, md: 1.5 } }}
          >
            Capture Document
          </Button>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            AI will automatically identify and extract document details
          </Typography>
        </Box>
      )}

      {scanningState.stage === 'review' && documentData && (
        <DialogActions sx={{ 
          p: { xs: 2, md: 3 }, 
          bgcolor: 'grey.50',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 0 }
        }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            fullWidth={isMobile}
            size="large"
          >
            Cancel
          </Button>
          
          <Box sx={{ flex: 1 }} />
          
          <Button
            variant="outlined"
            onClick={retryScanning}
            startIcon={<Refresh />}
            sx={{ mr: 1 }}
            size="large"
          >
            Scan Again
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={confirmDocumentData}
            startIcon={<CheckCircle />}
            fullWidth={isMobile}
            size="large"
            disabled={documentData.completeness < 0.5}
          >
            Confirm Details ({Math.round(documentData.completeness * 100)}% Complete)
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default DocumentScannerModal;