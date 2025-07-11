import React, { useState } from 'react';
import { X, Calendar, Users, Mic, MicOff } from 'lucide-react';
import { useVoiceRedux } from '../hooks/useVoiceRedux';

interface ReservationModalProps {
  onClose: () => void;
}

const ReservationModal: React.FC<ReservationModalProps> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    checkInDate: '',
    checkOutDate: '',
    adults: 1,
    children: 0,
    rooms: 1
  });

  const {
    voiceState,
    isSupported,
    transcript,
    startListening,
    stopListening
  } = useVoiceRedux();

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleVoiceToggle = () => {
    if (voiceState === 'listening') {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">New Reservation</h2>
            <div className="flex items-center mt-2">
              <span className="text-sm text-gray-500">Step {step} of 3</span>
              <div className="ml-4 flex-1 max-w-xs">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(step / 3) * 100}%` }}
                  ></div>
                </div>
              </div>
              <span className="ml-4 text-sm text-gray-500">{Math.round((step / 3) * 100)}% Complete</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div>
              <div className="flex items-center mb-6">
                <Calendar className="w-6 h-6 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold">Reservation Details</h3>
              </div>
              <p className="text-gray-600 mb-6">I'll guide you through each step with voice prompts. Please speak clearly.</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Check-in Date</label>
                  <input
                    type="date"
                    value={formData.checkInDate}
                    onChange={(e) => setFormData({...formData, checkInDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">📝 For your check-in date like "July 15th"</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Check-out Date</label>
                  <input
                    type="date"
                    value={formData.checkOutDate}
                    onChange={(e) => setFormData({...formData, checkOutDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adults</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.adults}
                    onChange={(e) => setFormData({...formData, adults: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Children</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.children}
                    onChange={(e) => setFormData({...formData, children: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rooms</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.rooms}
                    onChange={(e) => setFormData({...formData, rooms: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-900 mb-2">Voice Instructions</h4>
                <p className="text-sm text-blue-800">
                  Please say your check-in date, for example: "I'd like to check in on July 15th" or "July 15th".
                  You can also say "Next" to proceed to the next step.
                </p>
              </div>

              {/* Voice Controls */}
              {isSupported && (
                <div className="flex items-center justify-center mb-6">
                  <button
                    onClick={handleVoiceToggle}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-full font-semibold transition-colors ${
                      voiceState === 'listening' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {voiceState === 'listening' ? (
                      <>
                        <MicOff className="w-5 h-5" />
                        <span>Stop Listening</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-5 h-5" />
                        <span>Start Voice Input</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {transcript && (
                <div className="bg-gray-50 border rounded-lg p-3 mb-6">
                  <p className="text-sm text-gray-600">Last heard:</p>
                  <p className="font-medium">"{transcript}"</p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Select Room Type</h3>
              <p className="text-gray-600 mb-6">Choose your preferred accommodation</p>
              {/* Room selection content */}
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Guest Information</h3>
              <p className="text-gray-600 mb-6">Please provide your contact details</p>
              {/* Guest info form */}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50 rounded-b-2xl">
          <button
            onClick={handlePrevious}
            disabled={step === 1}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-semibold transition-colors"
          >
            {step === 3 ? 'Complete Reservation' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReservationModal;