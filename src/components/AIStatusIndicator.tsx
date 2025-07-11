import React from 'react';
import { 
  Brain,
  CheckCircle,
  AlertTriangle,
  RotateCw
} from 'lucide-react';

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
    if (error) return 'border-red-500 bg-red-50';
    if (isProcessing) return 'border-blue-500 bg-blue-50';
    if (confidence > 0.8) return 'border-green-500 bg-green-50';
    if (confidence > 0.5) return 'border-yellow-500 bg-yellow-50';
    return 'border-gray-300 bg-gray-50';
  };

  const getStatusIcon = () => {
    if (error) return <AlertTriangle className="w-5 h-5 text-red-600" />;
    if (isProcessing) return <RotateCw className="w-5 h-5 text-blue-600 animate-spin" />;
    if (confidence > 0.7) return <CheckCircle className="w-5 h-5 text-green-600" />;
    return <Brain className="w-5 h-5 text-gray-600" />;
  };

  const getStatusText = () => {
    if (error) return 'AI Error';
    if (isProcessing) return 'AI Processing...';
    if (confidence > 0.8) return 'High Confidence';
    if (confidence > 0.5) return 'Medium Confidence';
    return 'AI Ready';
  };

  const getStatusBadgeColor = () => {
    if (error) return 'bg-red-100 text-red-800';
    if (isProcessing) return 'bg-blue-100 text-blue-800';
    if (confidence > 0.8) return 'bg-green-100 text-green-800';
    if (confidence > 0.5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`border-2 rounded-lg p-4 mb-4 ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-semibold text-sm">
            Gemini AI Assistant
          </span>
        </div>
        
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor()}`}>
          {getStatusText()}
        </span>
      </div>
      
      {isProcessing && (
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>
      )}
      
      {confidence > 0 && !isProcessing && !error && (
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Confidence</span>
            <span>{Math.round(confidence * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                confidence > 0.7 ? 'bg-green-500' : 
                confidence > 0.5 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${confidence * 100}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {error && (
        <p className="text-sm text-red-700 mt-2">
          {error}
        </p>
      )}
      
      {lastResponse && !error && (
        <p className="text-sm text-gray-600 mt-2 italic">
          "{lastResponse.substring(0, 100)}{lastResponse.length > 100 ? '...' : ''}"
        </p>
      )}
    </div>
  );
};

export default AIStatusIndicator;