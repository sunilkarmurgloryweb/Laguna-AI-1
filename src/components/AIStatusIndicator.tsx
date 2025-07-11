import React from 'react';
import { 
  Box, 
  Chip, 
  Typography,
  Paper,
  LinearProgress
} from '@mui/material';
import { 
  Psychology,
  CheckCircle,
  Error,
  Refresh
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
    if (error) return 'error';
    if (isProcessing) return 'info';
    if (confidence > 0.8) return 'success';
    if (confidence > 0.5) return 'warning';
    return 'default';
  };

  const getStatusIcon = () => {
    if (error) return <Error />;
    if (isProcessing) return <Refresh className="animate-spin" />;
    if (confidence > 0.7) return <CheckCircle />;
    return <Psychology />;
  };

  const getStatusText = () => {
    if (error) return 'AI Error';
    if (isProcessing) return 'AI Processing...';
    if (confidence > 0.8) return 'High Confidence';
    if (confidence > 0.5) return 'Medium Confidence';
    return 'AI Ready';
  };

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 2, 
        mb: 2, 
        backgroundColor: error ? '#ffebee' : isProcessing ? '#e3f2fd' : '#f8f9fa',
        border: `1px solid ${error ? '#f44336' : isProcessing ? '#2196f3' : '#e0e0e0'}`
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Box display="flex" alignItems="center" gap={1}>
          {getStatusIcon()}
          <Typography variant="body2" fontWeight={600}>
            Gemini AI Assistant
          </Typography>
        </Box>
        
        <Chip 
          label={getStatusText()} 
          color={getStatusColor() as any}
          size="small"
          variant="outlined"
        />
      </Box>
      
      {isProcessing && (
        <LinearProgress 
          sx={{ mb: 1, borderRadius: 1 }} 
          color="primary"
        />
      )}
      
      {confidence > 0 && !isProcessing && !error && (
        <Box>
          <Typography variant="caption" color="text.secondary">
            Confidence: {Math.round(confidence * 100)}%
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={confidence * 100} 
            sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
            color={confidence > 0.7 ? 'success' : confidence > 0.5 ? 'warning' : 'error'}
          />
        </Box>
      )}
      
      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
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