import React from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  AlertTriangle 
} from 'lucide-react';
import { VoiceState } from '../types/reservation';
import { useAppSelector } from '../hooks/useAppSelector';

interface VoiceIndicatorProps {
  voiceState: VoiceState;
  isSupported: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
}

const VoiceIndicator: React.FC<VoiceIndicatorProps> = ({
  voiceState,
  isSupported,
  onStartListening,
  onStopListening
}) => {
  const { lastError } = useAppSelector((state) => state.voice);

  const getIcon = () => {
    switch (voiceState) {
      case 'listening':
        return <Mic className="w-8 h-8 text-red-500" />;
      case 'processing':
        return (
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      case 'speaking':
        return <Volume2 className="w-8 h-8 text-green-500" />;
      default:
        return <MicOff className="w-8 h-8 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (voiceState) {
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Processing...';
      case 'speaking':
        return 'Speaking...';
      default:
        return 'Tap to speak';
    }
  };

  const getButtonColor = () => {
    switch (voiceState) {
      case 'listening':
        return 'bg-red-500 hover:bg-red-600';
      case 'processing':
        return 'bg-blue-500';
      case 'speaking':
        return 'bg-green-500';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const handleClick = () => {
    if (voiceState === 'listening') {
      onStopListening();
    } else if (voiceState === 'idle') {
      onStartListening();
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
          <span className="text-yellow-800 text-sm">
            Voice recognition is not supported in your browser.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleClick}
        disabled={voiceState === 'processing' || voiceState === 'speaking'}
        className={`
          w-20 h-20 rounded-full text-white transition-all duration-200
          ${getButtonColor()}
          ${voiceState === 'listening' ? 'animate-pulse' : ''}
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-4 focus:ring-blue-300
        `}
      >
        {getIcon()}
      </button>
      
      <span className="text-sm text-gray-600 font-medium">
        {getStatusText()}
      </span>
      
      {lastError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-w-xs">
          <div className="flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
            <span className="text-red-800 text-sm text-center">
              {lastError}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceIndicator;