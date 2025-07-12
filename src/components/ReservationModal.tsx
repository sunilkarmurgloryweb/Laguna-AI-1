import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  LinearProgress,
  IconButton,
  TextField,
  useTheme,
  useMediaQuery,
  Grid,
  CircularProgress,
  Avatar
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import {
  Close,
  CalendarToday,
  People,
  Hotel,
  CreditCard,
  CheckCircle
} from '@mui/icons-material';
import VoiceInput from './VoiceInput';
import { multilingualAI } from '../services/multilingualAIService';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { updateReservationData } from '../store/slices/reservationSlice';
import { ProcessedVoiceResponse, VoiceProcessedData } from '../types/reservation';
import { FormDataWithDayjs, ConvertDayjsToString } from '../types/reservation';

interface ReservationModalProps {
  isOpen?: boolean;
  onClose: () => void;
  initialData?: VoiceProcessedData;
  onAIMessage?: (message: string, shouldSpeak?: boolean) => void;
}

const ReservationModal: React.FC<ReservationModalProps> = ({ 
  isOpen = true, 
  onClose,
  initialData = {},
  onAIMessage
}) => {
  // ... rest of the component code ...
};

export default ReservationModal;