import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  Button,
  Typography,
  Box,
  Paper,
  LinearProgress,
  IconButton,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  TextField,
  useTheme,
  useMediaQuery,
  Fade,
  Avatar
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Close,
  CameraAlt,
  Scanner,
  CheckCircle,
  Refresh,
  Edit,
  Mic,
  MicOff,
  DocumentScanner as DocumentScannerIcon,
  Stop
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
  photo?: string;
  confidence: number;
}

interface DocumentScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (data: DocumentData) => void;
  onError: (error: string) => void;
}

const DocumentScannerModal: React.FC<DocumentScannerModalProps> = ({
  isOpen,
  onClose,
  onScanComplete,
  onError
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const webcamRef = useRef<Webcam>(null);
  const [scanningStage, setScanningStage] = useState<'ready' | 'capturing' | 'processing' | 'complete' | 'error'>('ready');
  const [progress, setProgress] = useState(0);
  const [capturedImage, setCapturedImage] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [editingField, setEditingField] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [ocrWorker, setOcrWorker] = useState<any>(null);

  // Initialize OCR worker
  useEffect(() => {
    if (isOpen) {
      initializeOCR();
    }
    return () => {
      if (ocrWorker) {
        ocrWorker.terminate();
      }
    };
  }, [isOpen]);

  const initializeOCR = async () => {
    try {
      const worker = await createWorker('eng');
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,/-:()[]',
        tessedit_pageseg_mode: '3', // Fully automatic page segmentation
        tessedit_ocr_engine_mode: '1', // Neural nets LSTM engine only
      });
      setOcrWorker(worker);
      console.log('OCR worker initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OCR worker:', error);
      setErrorMessage('Failed to initialize document scanner');
      setScanningStage('error');
    }
  };

  const speakInstruction = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.2;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      speechSynthesis.speak(utterance);
    }
  }, []);

  const captureDocument = useCallback(async () => {
    if (!webcamRef.current || !ocrWorker) {
      setErrorMessage('Camera or OCR not ready');
      return;
    }

    try {
      setScanningStage('capturing');
      setProgress(10);
      speakInstruction('Capturing document...');

      // Capture high-quality image
      const imageSrc = webcamRef.current.getScreenshot({
        width: 1920,
        height: 1080,
        screenshotFormat: 'image/jpeg',
        screenshotQuality: 0.95
      });

      if (!imageSrc) {
        throw new Error('Failed to capture image');
      }

      setCapturedImage(imageSrc);
      setProgress(30);
      
      // Start OCR processing
      setScanningStage('processing');
      speakInstruction('Processing document text...');
      
      await processDocument(imageSrc);

    } catch (error) {
      console.error('Capture error:', error);
      setErrorMessage('Failed to capture document. Please try again.');
      setScanningStage('error');
      speakInstruction('Capture failed. Please try again.');
    }
  }, [ocrWorker, speakInstruction]);

  const processDocument = async (imageData: string) => {
    if (!ocrWorker) {
      setErrorMessage('OCR worker not available');
      setScanningStage('error');
      return;
    }

    try {
      setProgress(40);
      speakInstruction('Extracting text from document...');

      // Convert base64 to image for OCR with better preprocessing
      const { data: { text, confidence } } = await ocrWorker.recognize(imageData, {
        rectangle: { top: 0, left: 0, width: 0, height: 0 }
      });
      
      setExtractedText(text);
      setProgress(70);
      
      console.log('Extracted text:', text);
      console.log('OCR confidence:', confidence);
      speakInstruction('Analyzing document details...');

      // Process extracted text
      const processedData = await analyzeDocumentText(text, imageData);
      
      if (processedData) {
        setDocumentData(processedData);
        setProgress(100);
        setScanningStage('complete');
        
        const completeness = calculateCompleteness(processedData);
        speakInstruction(`Document scanned successfully. ${Math.round(completeness)}% complete. Please review the details.`);
      } else {
        throw new Error('Could not extract document details');
      }

    } catch (error) {
      console.error('OCR processing error:', error);
      setErrorMessage('Failed to process document text. Please ensure document is clear and well-lit.');
      setScanningStage('error');
      speakInstruction('Document processing failed. Please ensure your document is clear and try again.');
    }
  };

  const analyzeDocumentText = async (text: string, imageData: string): Promise<DocumentData | null> => {
    try {
      const cleanText = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      console.log('Analyzing text:', cleanText);
      console.log('Raw OCR text lines:', text.split('\n'));

      // Identify document type
      const docType = identifyDocumentType(cleanText);
      console.log('Identified document type:', docType);

      // Extract data based on document type
      const extractedData = extractDocumentData(cleanText, docType);
      console.log('Extracted data:', extractedData);
      
      if (!extractedData.name && !extractedData.documentNumber) {
        console.log('No name or document number found, trying alternative extraction...');
        
        // Try alternative extraction methods
        const alternativeData = extractDataAlternative(text, docType);
        if (alternativeData.name || alternativeData.documentNumber) {
          Object.assign(extractedData, alternativeData);
        }
      }
      
      if (!extractedData.name && !extractedData.documentNumber) {
        return null;
      }

      return {
        ...extractedData,
        documentType: docType,
        photo: imageData,
        confidence: calculateConfidence(extractedData, cleanText)
      };

    } catch (error) {
      console.error('Document analysis error:', error);
      return null;
    }
  };
  
  // Alternative extraction method for difficult documents
  const extractDataAlternative = (text: string, docType: DocumentData['documentType']) => {
    const data: Partial<DocumentData> = {};
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 2);
    
    console.log('Alternative extraction from lines:', lines);
    
    if (docType === 'license') {
      // For driving license, look for specific patterns in lines
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Look for name patterns in driving license
        if (!data.name) {
          // Pattern: Line starting with class and name (e.g., "4d JOHN SMITH")
          const classNameMatch = line.match(/^[0-9][a-z]\s+([A-Z][A-Za-z]+\s+[A-Z][A-Za-z]+)/);
          if (classNameMatch) {
            data.name = classNameMatch[1];
            console.log('Found name with class pattern:', data.name);
          }
          
          // Pattern: Full name on its own line
          if (!data.name && /^[A-Z][A-Za-z]+\s+[A-Z][A-Za-z]+$/.test(line)) {
            const excludeTerms = ['DRIVING', 'LICENSE', 'DEPARTMENT', 'MOTOR', 'VEHICLE', 'STATE', 'COUNTY'];
            if (!excludeTerms.some(term => line.includes(term))) {
              data.name = line;
              console.log('Found name on line:', data.name);
            }
          }
        }
        
        // Look for license number
        if (!data.documentNumber) {
          // Pattern: License number (usually long alphanumeric)
          const licenseMatch = line.match(/\b([A-Z]{1,2}\d{8,15})\b/);
          if (licenseMatch) {
            data.documentNumber = licenseMatch[1];
            console.log('Found license number:', data.documentNumber);
          }
        }
        
        // Look for date of birth
        if (!data.dateOfBirth) {
          const dateMatch = line.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
          if (dateMatch) {
            const parsedDate = parseAndValidateDate(dateMatch[1], 'birth');
            if (parsedDate) {
              data.dateOfBirth = parsedDate;
              console.log('Found date of birth:', data.dateOfBirth);
            }
          }
        }
      }
    }
    
    return data;
  };

  const identifyDocumentType = (text: string): DocumentData['documentType'] => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('passport')) return 'passport';
    if (lowerText.includes('pan') || lowerText.includes('income tax')) return 'pan';
    if (lowerText.includes('driving') || lowerText.includes('license') || lowerText.includes('licence')) return 'license';
    if (lowerText.includes('permanent resident') || lowerText.includes('green card')) return 'green_card';
    
    return 'id_card';
  };

  const extractDocumentData = (text: string, docType: DocumentData['documentType']) => {
    const data: Partial<DocumentData> = {};

    // Extract name with improved patterns
    data.name = extractName(text, docType);
    
    // Extract document number
    data.documentNumber = extractDocumentNumber(text, docType);
    
    // Extract date of birth
    data.dateOfBirth = extractDateOfBirth(text);
    
    // Extract expiry date
    data.expiryDate = extractExpiryDate(text);
    
    // Extract nationality for passport
    if (docType === 'passport') {
      data.nationality = extractNationality(text);
    }

    return data;
  };

  const extractName = (text: string, docType: DocumentData['documentType']): string => {
    // Remove common document terms that might be mistaken for names
    const excludeTerms = [
      'passport', 'republic', 'india', 'united', 'states', 'america', 'government',
      'driving', 'license', 'licence', 'department', 'transport', 'motor', 'vehicle',
      'pan', 'income', 'tax', 'permanent', 'account', 'number', 'card', 'identity',
      'date', 'birth', 'issue', 'expiry', 'valid', 'until', 'nationality', 'sex', 'male', 'female',
      'place', 'signature', 'holder', 'authority', 'issued', 'type', 'code', 'class', 'restrictions',
      'endorsements', 'veteran', 'donor', 'height', 'weight', 'eyes', 'hair', 'address', 'city', 'state',
      'zip', 'county', 'country', 'organ', 'blood', 'rstr', 'end', 'iss', 'exp', 'dob', 'dd', 'lic'
    ];

    // Clean text and split into lines for better analysis
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // For driving license, look for specific patterns
    if (docType === 'license') {
      // Look for name patterns specific to driving licenses
      const licenseNamePatterns = [
        // Pattern: "4d JOHN SMITH" or "4a JANE DOE"
        /^[0-9][a-z]\s+([A-Z][A-Za-z]+\s+[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)$/,
        // Pattern: "SMITH, JOHN" format
        /^([A-Z][A-Za-z]+,\s*[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)$/,
        // Pattern: "JOHN SMITH" on its own line
        /^([A-Z][A-Za-z]+\s+[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)$/,
        // Pattern after "LN" (Last Name) and "FN" (First Name)
        /LN\s+([A-Z][A-Za-z]+)\s+FN\s+([A-Z][A-Za-z]+)/i,
        // Pattern: Name before date of birth
        /([A-Z][A-Za-z]+\s+[A-Z][A-Za-z]+)(?=.*\d{2}\/\d{2}\/\d{4})/
      ];
      
      for (const pattern of licenseNamePatterns) {
        const match = text.match(pattern);
        if (match) {
          let candidateName = '';
          if (match[2]) {
            // LN/FN pattern - combine last and first name
            candidateName = `${match[2]} ${match[1]}`;
          } else {
            candidateName = match[1];
          }
          
          if (isValidName(candidateName, excludeTerms)) {
            return candidateName.trim();
          }
        }
      }
      
      // Look line by line for driving license names
      for (const line of lines) {
        // Skip lines with common license terms
        if (excludeTerms.some(term => line.toLowerCase().includes(term))) {
          continue;
        }
        
        // Look for lines with proper name format
        if (/^[A-Z][A-Za-z]+\s+[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?$/.test(line)) {
          if (isValidName(line, excludeTerms)) {
            return line.trim();
          }
        }
      }
    }
    
    // General name patterns for other documents
    const generalNamePatterns = [
      // Pattern for names after keywords
      /(?:name|full name|given name)\s*:?\s*([A-Z][A-Za-z\s]{4,49})/i,
      // Pattern for names in passport format
      /([A-Z]{2,20},\s*[A-Z][A-Za-z\s]{2,30})/,
      // Pattern for names near date of birth
      /([A-Z][A-Za-z\s]{4,49})(?=.*(?:date.*birth|dob|\d{2}\/\d{2}\/\d{4}))/i
    for (const pattern of generalNamePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const candidateName = match[1].trim();
        
        // Validate name
        if (isValidName(candidateName, excludeTerms)) {
          return candidateName;
        }
      }
    }

    // Fallback: look for capitalized words that could be names
    const words = text.split(/\s+/);
    const capitalizedWords = words.filter(word => 
      /^[A-Z][a-z]+$/.test(word) && 
      word.length >= 2 && 
      !excludeTerms.includes(word.toLowerCase())
    );

    if (capitalizedWords.length >= 2) {
      const name = capitalizedWords.slice(0, 4).join(' ');
      if (isValidName(name, excludeTerms)) {
        return name;
      }
    }

    return '';
  };

  const isValidName = (name: string, excludeTerms: string[]): boolean => {
    const words = name.split(/\s+/).filter(w => w.length > 0);
    
    // Check basic requirements
    if (name.length < 5 || name.length > 50 || words.length < 2 || words.length > 5) {
      return false;
    }
    
    // Check for numbers
    if (/\d/.test(name)) {
      return false;
    }
    
    // Check against exclude terms
    const lowerName = name.toLowerCase();
    for (const term of excludeTerms) {
      if (lowerName.includes(term)) {
        return false;
      }
    }
    
    return true;
  };

  const extractDocumentNumber = (text: string, docType: DocumentData['documentType']): string => {
    const patterns: Record<DocumentData['documentType'], RegExp[]> = {
      passport: [
        /passport\s*(?:no|number|#)?\s*:?\s*([A-Z]\d{7,8})/i,
        /([A-Z]\d{7,8})/,
        /([A-Z]{1,2}\d{6,8})/
      ],
      pan: [
        /pan\s*(?:no|number|#)?\s*:?\s*([A-Z]{5}\d{4}[A-Z])/i,
        /([A-Z]{5}\d{4}[A-Z])/
      ],
      license: [
        // Driving license specific patterns
        /(?:lic|license|licence)\s*(?:no|number|#)?\s*:?\s*([A-Z0-9]{8,20})/i,
        /DL\s*(?:NO|NUMBER)?\s*:?\s*([A-Z0-9]{8,20})/i,
        /([A-Z]{1,2}\d{2}\s*\d{11})/,
        /([A-Z0-9]{8,15})/,
        // Look for numbers after "4d" or similar class indicators
        /[0-9][a-z]\s+[A-Z][A-Za-z\s]+\s+([A-Z0-9]{8,20})/,
        // Look for standalone license numbers
        /\b([A-Z]{1,2}\d{13,15})\b/
      ],
      green_card: [
        /(?:card|number)\s*(?:no|#)?\s*:?\s*([A-Z0-9]{9,13})/i,
        /([A-Z0-9]{9,13})/
      ],
      id_card: [
        /(?:id|card)\s*(?:no|number|#)?\s*:?\s*([A-Z0-9]{6,20})/i,
        /([A-Z0-9]{6,20})/
      ]
    };

    const docPatterns = patterns[docType] || patterns.id_card;
    
    // For driving license, also look line by line
    if (docType === 'license') {
      const lines = text.split('\n').map(line => line.trim());
      
      for (const line of lines) {
        // Look for lines that might contain license numbers
        const licenseNumberMatch = line.match(/\b([A-Z]{1,2}\d{13,15})\b/);
        if (licenseNumberMatch) {
          return licenseNumberMatch[1];
        }
        
        // Look for patterns like "DL NO: ABC123456789"
        const dlMatch = line.match(/(?:DL|LICENSE)\s*(?:NO|NUMBER)?\s*:?\s*([A-Z0-9]{8,20})/i);
        if (dlMatch) {
          return dlMatch[1];
        }
      }
    }
    
    for (const pattern of docPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].replace(/\s/g, '');
      }
    }

    return '';
  };

  const extractDateOfBirth = (text: string): string => {
    // Clean the text and look for date patterns
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    const datePatterns = [
      // Look for dates after DOB or similar keywords
      /(?:DOB|date.*birth|born)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
      // Look for dates in MM/DD/YYYY format (common in US licenses)
      /(\d{1,2}\/\d{1,2}\/\d{4})/g,
      // Look for dates in DD-MM-YYYY format
      /(\d{1,2}-\d{1,2}-\d{4})/g,
      // Look for dates in YYYY-MM-DD format
      /(\d{4}-\d{1,2}-\d{1,2})/g,
      // Look for dates with month names
      /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})/gi
    ];

    for (const pattern of datePatterns) {
      const matches = [...cleanText.matchAll(pattern)];
      for (const match of matches) {
        if (match && match[1]) {
          const dateStr = match[1];
          const parsedDate = parseAndValidateDate(dateStr, 'birth');
          if (parsedDate) {
            return parsedDate;
          }
        }
      }
    }

    return '';
  };

  const extractExpiryDate = (text: string): string => {
    const expiryPatterns = [
      /(?:expiry|expires|valid.*until|exp).*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})(?=.*(?:expiry|expires|valid))/i,
      /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})(?=.*(?:expiry|expires|valid))/i
    ];

    for (const pattern of expiryPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const dateStr = match[1];
        const parsedDate = parseAndValidateDate(dateStr, 'expiry');
        if (parsedDate) {
          return parsedDate;
        }
      }
    }

    return '';
  };

  const extractNationality = (text: string): string => {
    const nationalityPatterns = [
      /nationality\s*:?\s*([A-Z]{2,3}|[A-Z][a-z]+)/i,
      /country\s*:?\s*([A-Z]{2,3}|[A-Z][a-z]+)/i,
      /(USA|IND|GBR|CAN|AUS|DEU|FRA|JPN|CHN|BRA)/i
    ];

    for (const pattern of nationalityPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].toUpperCase();
      }
    }

    return '';
  };

  const parseAndValidateDate = (dateStr: string, type: 'birth' | 'expiry'): string => {
    try {
      let date: Date;
      
      // Try different date formats
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          // For US documents, assume MM/DD/YYYY format
          if (parseInt(parts[0]) > 12) {
            // If first part > 12, it's likely DD/MM/YYYY
            date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          } else {
            // Otherwise assume MM/DD/YYYY (US format)
            date = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
          }
        } else {
          return '';
        }
      } else if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            // YYYY-MM-DD format
            date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          } else {
            // DD-MM-YYYY format
            date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          }
        } else {
          return '';
        }
      } else {
        // Try parsing as is
        date = new Date(cleanDateStr);
      }

      if (isNaN(date.getTime())) {
        return '';
      }

      const currentYear = new Date().getFullYear();
      const year = date.getFullYear();

      // Validate date ranges
      if (type === 'birth') {
        if (year < 1900 || year > currentYear - 10) {
          return '';
        }
      } else if (type === 'expiry') {
        if (year < currentYear || year > currentYear + 20) {
          return '';
        }
      }

      // Return in YYYY-MM-DD format
      return date.toISOString().split('T')[0];

    } catch (error) {
      console.error('Date parsing error:', error);
      return '';
    }
  };

  const calculateConfidence = (data: Partial<DocumentData>, text: string): number => {
    let score = 0;
    let maxScore = 0;

    // Name confidence
    maxScore += 30;
    if (data.name && data.name.length >= 5) {
      score += 30;
    } else if (data.name && data.name.length >= 2) {
      score += 15;
    }

    // Document number confidence
    maxScore += 25;
    if (data.documentNumber && data.documentNumber.length >= 6) {
      score += 25;
    } else if (data.documentNumber && data.documentNumber.length >= 3) {
      score += 12;
    }

    // Date of birth confidence
    maxScore += 20;
    if (data.dateOfBirth) {
      score += 20;
    }

    // Expiry date confidence
    maxScore += 15;
    if (data.expiryDate) {
      score += 15;
    }

    // Nationality confidence (for passport)
    maxScore += 10;
    if (data.nationality) {
      score += 10;
    }

    return Math.min(score / maxScore, 1);
  };

  const calculateCompleteness = (data: DocumentData): number => {
    const requiredFields = ['name', 'documentNumber'];
    const optionalFields = ['dateOfBirth', 'expiryDate', 'nationality'];
    
    let filledRequired = 0;
    let filledOptional = 0;

    requiredFields.forEach(field => {
      if (data[field as keyof DocumentData]) filledRequired++;
    });

    optionalFields.forEach(field => {
      if (data[field as keyof DocumentData]) filledOptional++;
    });

    const requiredScore = (filledRequired / requiredFields.length) * 70;
    const optionalScore = (filledOptional / optionalFields.length) * 30;

    return requiredScore + optionalScore;
  };

  const handleFieldCorrection = async (field: string, newValue: string) => {
    if (!documentData) return;

    const updatedData = { ...documentData, [field]: newValue };
    setDocumentData(updatedData);
    
    speakInstruction(`${field} updated to ${newValue}`);
    setEditingField('');
  };

  const startVoiceCorrection = (field: string) => {
    setEditingField(field);
    setIsListening(true);
    speakInstruction(`Please say the correct ${field}`);

    // Start speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event: any) => {
        const result = event.results[0][0].transcript;
        handleFieldCorrection(field, result);
        setIsListening(false);
      };
      
      recognition.onerror = () => {
        setIsListening(false);
        speakInstruction('Voice input failed. Please try again.');
      };
      
      recognition.start();
    }
  };

  const handleConfirm = () => {
    if (documentData) {
      onScanComplete(documentData);
      onClose();
    }
  };

  const handleRetry = () => {
    setScanningStage('ready');
    setProgress(0);
    setCapturedImage('');
    setExtractedText('');
    setDocumentData(null);
    setErrorMessage('');
    speakInstruction('Ready to scan. Position your document and click capture.');
  };

  const renderScanningInterface = () => {
    if (scanningStage === 'error') {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorMessage}
          </Alert>
          <Button
            variant="contained"
            onClick={handleRetry}
            startIcon={<Refresh />}
            size="large"
          >
            Try Again
          </Button>
        </Box>
      );
    }

    if (scanningStage === 'complete' && documentData) {
      return (
        <Box>
          {/* Captured Image Preview */}
          {capturedImage && (
            <Paper sx={{ p: 2, mb: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>Captured Document</Typography>
              <img
                src={capturedImage}
                alt="Captured document"
                style={{
                  maxWidth: '100%',
                  maxHeight: 200,
                  borderRadius: 8,
                  border: '2px solid #1976d2'
                }}
              />
            </Paper>
          )}

          {/* Extracted Details */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle color="success" />
                Extracted Document Details
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 120 }}>
                      Document Type:
                    </Typography>
                    <Typography variant="body2">
                      {documentData.documentType.toUpperCase().replace('_', ' ')}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 120 }}>
                      Name:
                    </Typography>
                    <TextField
                      value={documentData.name}
                      onChange={(e) => handleFieldCorrection('name', e.target.value)}
                      size="small"
                      sx={{ flex: 1 }}
                      disabled={editingField === 'name' && isListening}
                    />
                    <IconButton
                      onClick={() => startVoiceCorrection('name')}
                      color={isListening && editingField === 'name' ? 'error' : 'primary'}
                      size="small"
                    >
                      {isListening && editingField === 'name' ? <MicOff /> : <Mic />}
                    </IconButton>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 120 }}>
                      Document Number:
                    </Typography>
                    <TextField
                      value={documentData.documentNumber}
                      onChange={(e) => handleFieldCorrection('documentNumber', e.target.value)}
                      size="small"
                      sx={{ flex: 1 }}
                      disabled={editingField === 'documentNumber' && isListening}
                    />
                    <IconButton
                      onClick={() => startVoiceCorrection('document number')}
                      color={isListening && editingField === 'documentNumber' ? 'error' : 'primary'}
                      size="small"
                    >
                      {isListening && editingField === 'documentNumber' ? <MicOff /> : <Mic />}
                    </IconButton>
                  </Box>
                </Grid>

                {documentData.dateOfBirth && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 120 }}>
                        Date of Birth:
                      </Typography>
                      <TextField
                        value={documentData.dateOfBirth}
                        onChange={(e) => handleFieldCorrection('dateOfBirth', e.target.value)}
                        size="small"
                        sx={{ flex: 1 }}
                        disabled={editingField === 'dateOfBirth' && isListening}
                      />
                      <IconButton
                        onClick={() => startVoiceCorrection('date of birth')}
                        color={isListening && editingField === 'dateOfBirth' ? 'error' : 'primary'}
                        size="small"
                      >
                        {isListening && editingField === 'dateOfBirth' ? <MicOff /> : <Mic />}
                      </IconButton>
                    </Box>
                  </Grid>
                )}

                {documentData.nationality && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 120 }}>
                        Nationality:
                      </Typography>
                      <TextField
                        value={documentData.nationality}
                        onChange={(e) => handleFieldCorrection('nationality', e.target.value)}
                        size="small"
                        sx={{ flex: 1 }}
                        disabled={editingField === 'nationality' && isListening}
                      />
                      <IconButton
                        onClick={() => startVoiceCorrection('nationality')}
                        color={isListening && editingField === 'nationality' ? 'error' : 'primary'}
                        size="small"
                      >
                        {isListening && editingField === 'nationality' ? <MicOff /> : <Mic />}
                      </IconButton>
                    </Box>
                  </Grid>
                )}
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" fontWeight="bold">
                  Extraction Confidence:
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={documentData.confidence * 100}
                  sx={{ flex: 1, height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" fontWeight="bold">
                  {Math.round(documentData.confidence * 100)}%
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={handleRetry}
              startIcon={<Refresh />}
            >
              Scan Again
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirm}
              startIcon={<CheckCircle />}
              color="success"
            >
              Confirm Details
            </Button>
          </Box>
        </Box>
      );
    }

    return (
      <Box>
        {/* Camera Interface */}
        <Paper sx={{ 
          position: 'relative', 
          mb: 3, 
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: 'black',
          aspectRatio: '16/9'
        }}>
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.95}
            videoConstraints={{
              width: 1920,
              height: 1080,
              facingMode: isMobile ? 'environment' : 'user'
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          
          {/* Document Frame Overlay */}
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            height: '60%',
            border: '3px solid',
            borderColor: scanningStage === 'capturing' ? 'warning.main' : 'primary.main',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: scanningStage === 'capturing' ? 'scanPulse 1s infinite' : 'none',
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
                p: 1.5,
                borderRadius: 1,
                fontSize: { xs: '0.75rem', md: '0.875rem' }
              }}
            >
              {scanningStage === 'capturing' ? 'Capturing document...' : 
               scanningStage === 'processing' ? 'Processing text...' :
               'Position document within frame'}
            </Typography>
          </Box>

          {/* Scanning Animation */}
          {(scanningStage === 'capturing' || scanningStage === 'processing') && (
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

        {/* Progress and Controls */}
        {scanningStage !== 'ready' && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" fontWeight="medium">
                {scanningStage === 'capturing' ? 'Capturing Document...' :
                 scanningStage === 'processing' ? 'Processing Text...' : 'Ready'}
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}

        {/* Capture Button */}
        {scanningStage === 'ready' && (
          <Box sx={{ textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={captureDocument}
              startIcon={<CameraAlt />}
              sx={{ minWidth: 200, py: 2 }}
            >
              Capture Document
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Position your document clearly within the frame
            </Typography>
          </Box>
        )}

        {/* Processing Indicator */}
        {(scanningStage === 'capturing' || scanningStage === 'processing') && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body1" fontWeight="medium">
              {scanningStage === 'capturing' ? 'Capturing...' : 'Processing...'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait while AI processes your document
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: {
          bgcolor: 'background.default'
        }
      }}
    >
      <Box sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 1000
      }}>
        <IconButton
          onClick={onClose}
          sx={{
            bgcolor: 'rgba(0,0,0,0.5)',
            color: 'white',
            '&:hover': {
              bgcolor: 'rgba(0,0,0,0.7)'
            }
          }}
        >
          <Close />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: { xs: 2, md: 4 }, height: '100vh', overflow: 'auto' }}>
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Avatar sx={{ 
              bgcolor: 'primary.main', 
              width: 64, 
              height: 64, 
              mx: 'auto', 
              mb: 2 
            }}>
              <DocumentScannerIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              AI Document Scanner
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Automatic document identification and data extraction
            </Typography>
          </Box>

          {renderScanningInterface()}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentScannerModal;