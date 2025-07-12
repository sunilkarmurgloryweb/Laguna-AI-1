import React from 'react';
import { Hotel as HotelIcon, LocationOn as LocationOnIcon, Star as StarIcon } from '@mui/icons-material';
import { Hotel as HotelType } from '../types/reservation';
import VoiceIndicator from './VoiceIndicator';
import { VoiceState } from '../types/reservation';

interface WelcomeScreenProps {
  hotels: HotelType[];
  voiceState: VoiceState;
  isSupported: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  hotels,
  voiceState,
  isSupported,
  onStartListening,
  onStopListening
}) => {
  const voiceCommands = [
    'Make a reservation',
    'Book a room',
    'I need a hotel room',
    'Show me available rooms'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <HotelIcon className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-blue-900 mb-2">
                Welcome to Lagunacreek
              </h1>
              <p className="text-xl text-gray-600">
                How can I assist you today?
              </p>
            </div>

            {/* Hotels Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {hotels.map((hotel) => (
                <div 
                  key={hotel.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-center mb-3">
                    <HotelIcon className="w-6 h-6 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {hotel.name}
                    </h3>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3">
                    {hotel.description}
                  </p>
                  
                  <div className="flex items-center mb-3">
                    <LocationOnIcon className="w-4 h-4 text-gray-500 mr-1" />
                    <span className="text-xs text-gray-500">
                      {hotel.address}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <StarIcon className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="text-sm font-medium">
                        {hotel.rating}
                      </span>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Available
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Voice Indicator */}
            <div className="text-center mb-8">
              <VoiceIndicator
                voiceState={voiceState}
                isSupported={isSupported}
                onStartListening={onStartListening}
                onStopListening={onStopListening}
              />
            </div>

            {/* Voice Commands Help */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                Try saying:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {voiceCommands.map((command, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
                    <span className="text-gray-700">
                      "{command}"
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;