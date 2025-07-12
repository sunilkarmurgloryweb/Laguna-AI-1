import React from 'react';
import { 
  Box,
  Typography,
  LinearProgress,
  Alert,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  Psychology as BrainIcon,
  CheckCircle,
  Warning as WarningIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

interface AIStatusIndicatorProps {
  isProcessing: boolean;
  lastResponse?: string;
  confidence?: number;
  error?: string;
}

const AIStatusIndicator: React.FC<AIStatusIndicatorProps> = ({
  isProcessing,
  lastResponse,
  confidence = 0,
  error
}) => {
  const getStatusColor = () => {
    if (error) return 'error.main';
    if (isProcessing) return 'primary.main';
    if (confidence > 0.8) return 'success.main';
    if (confidence > 0.5) return 'warning.main';
    return 'grey.500';
  };

  const getStatusIcon = () => {
    if (error) return <WarningIcon sx={{ color: 'error.main' }} />;
    if (isProcessing) return <CircularProgress size={20} sx={{ color: 'primary.main' }} />;
    if (confidence > 0.7) return <CheckCircle sx={{ color: 'success.main' }} />;
    return <BrainIcon sx={{ color: 'grey.600' }} />;
  };

  const getStatusText = () => {
    if (error) return 'AI Error';
    if (isProcessing) return 'AI Processing...';
    if (confidence > 0.8) return 'High Confidence';
    if (confidence > 0.5) return 'Medium Confidence';
    return 'AI Ready';
  };

  const getStatusBadgeColor = () => {
    if (error) return 'error';
    if (isProcessing) return 'primary';
    if (confidence > 0.8) return 'success';
    if (confidence > 0.5) return 'warning';
    return 'default';
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 2, 
        mb: 2,
        borderLeft: 4,
        borderLeftColor: getStatusColor(),
        backgroundColor: error ? 'error.light' : isProcessing ? 'primary.light' : 'background.paper'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getStatusIcon()}
          <Typography variant="subtitle2" fontWeight="bold">
            Gemini AI Assistant
          </Typography>
        </Box>
        
        <Box 
          sx={{ 
            px: 1.5, 
            py: 0.5, 
            borderRadius: 2, 
            backgroundColor: `${getStatusBadgeColor()}.light`,
            color: `${getStatusBadgeColor()}.contrastText`
          }}
        >
          <Typography variant="caption" fontWeight="medium">
            {getStatusText()}
          </Typography>
        </Box>
      </Box>
      
      {isProcessing && (
        <Box sx={{ mb: 1 }}>
          <LinearProgress 
            variant="indeterminate" 
            sx={{ 
              height: 4, 
              borderRadius: 2,
              backgroundColor: 'primary.light',
              '& .MuiLinearProgress-bar': {
                backgroundColor: 'primary.main'
              }
            }} 
          />
        </Box>
      )}
      
      {confidence > 0 && !isProcessing && !error && (
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Confidence
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {Math.round(confidence * 100)}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={confidence * 100}
            sx={{ 
              height: 4, 
              borderRadius: 2,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                backgroundColor: confidence > 0.7 ? 'success.main' : 
                                confidence > 0.5 ? 'warning.main' : 'error.main'
              }
            }}
          />
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          <Typography variant="body2">
            {error}
          </Typography>
        </Alert>
      )}
      
      {lastResponse && !error && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
          "{lastResponse.substring(0, 100)}{lastResponse.length > 100 ? '...' : ''}"
        </Typography>
      )}
    </Paper>
  );
};

export default AIStatusIndicator;