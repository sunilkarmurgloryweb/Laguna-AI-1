import React from 'react';
import { 
  Calendar,
  Users,
  Hotel as HotelIcon,
  User,
  CreditCard,
  CheckCircle,
  Wifi,
  Coffee,
  Car,
  Utensils,
  Bed
} from 'lucide-react';
import { ReservationData, ReservationStep } from '../types/reservation';
import { roomTypes, paymentMethods } from '../data/hotels';
import VoiceIndicator from './VoiceIndicator';
import { VoiceState } from '../types/reservation';

interface ReservationFlowProps {
  step: ReservationStep;
  reservationData: ReservationData;
  voiceState: VoiceState;
  isSupported: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onNext: () => void;
  onHelp?: () => void;
  onReset?: () => void;
  transcript: string;
}

const ReservationFlow: React.FC<ReservationFlowProps> = ({
  step,
  reservationData,
  voiceState,
  isSupported,
  onStartListening,
  onStopListening,
  onNext,
  onHelp,
  onReset,
  transcript
}) => {
  const stepIcons = {
    'dates-guests': Calendar,
    'room-selection': HotelIcon,
    'guest-info': User,
    'payment': CreditCard,
    'confirmation': CheckCircle
  };

  const getAmenityIcon = (amenity: string) => {
    if (amenity.includes('WiFi')) return <Wifi className="w-4 h-4" />;
    if (amenity.includes('Bar')) return <Coffee className="w-4 h-4" />;
    if (amenity.includes('Balcony')) return <Car className="w-4 h-4" />;
    if (amenity.includes('Kitchen')) return <Utensils className="w-4 h-4" />;
    if (amenity.includes('Bed')) return <Bed className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  const canProceed = () => {
    switch (step) {
      case 'dates-guests':
        return reservationData.checkIn && reservationData.adults > 0;
      case 'room-selection':
        return reservationData.roomType;
      case 'guest-info':
        return reservationData.guestName;
      case 'payment':
        return reservationData.paymentMethod;
      default:
        return false;
    }
  };

  const getStepContent = () => {
    switch (step) {
      case 'dates-guests':
        return (
          <div>
            <h2 className="text-3xl font-bold text-blue-900 mb-2">
              Let's Plan Your Stay
            </h2>
            <p className="text-gray-600 mb-6">
              Please tell me your check-in and check-out dates, number of adults, and number of children.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Example:</strong> "Check-in on July 15, check-out on July 18, 2 adults and 1 child"
              </p>
            </div>

            {reservationData.checkIn && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800">
                  <strong>Captured:</strong> 
                  {reservationData.checkIn && ` Check-in: ${reservationData.checkIn}`}
                  {reservationData.checkOut && `, Check-out: ${reservationData.checkOut}`}
                  {reservationData.adults > 0 && `, ${reservationData.adults} adults`}
                  {reservationData.children > 0 && `, ${reservationData.children} children`}
                </p>
              </div>
            )}
          </div>
        );
      
      case 'room-selection':
        return (
          <div>
            <h2 className="text-3xl font-bold text-blue-900 mb-2">
              Choose Your Room
            </h2>
            <p className="text-gray-600 mb-6">
              Here are our available room types. Please say the room type you'd like to book.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {roomTypes.map((room) => (
                <div 
                  key={room.id}
                  className={`border-2 rounded-xl p-6 transition-all duration-300 ${
                    reservationData.roomType === room.name 
                      ? 'border-blue-500 bg-blue-50 shadow-lg' 
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {room.name}
                    </h3>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      {room.available} available
                    </span>
                  </div>
                  
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    ${room.price}
                    <span className="text-sm text-gray-500 font-normal">/night</span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3">
                    {room.description}
                  </p>
                  
                  <p className="text-gray-600 text-sm mb-3">
                    Max occupancy: {room.maxOccupancy} guests
                  </p>
                  
                  <div className="border-t pt-3">
                    <p className="text-sm font-medium mb-2">Amenities:</p>
                    <div className="space-y-1">
                      {room.amenities.slice(0, 3).map((amenity, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600">
                          {getAmenityIcon(amenity)}
                          <span className="ml-2">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {reservationData.roomType && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>Selected:</strong> {reservationData.roomType}
                </p>
              </div>
            )}
          </div>
        );
      
      case 'guest-info':
        return (
          <div>
            <h2 className="text-3xl font-bold text-blue-900 mb-2">
              Guest Information
            </h2>
            <p className="text-gray-600 mb-6">
              Please say your full name, contact number, and email address.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Example:</strong> "My name is John Smith, my number is 1234567890, and my email is john@example.com"
              </p>
            </div>

            {reservationData.guestName && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>Captured:</strong> {reservationData.guestName} 
                  {reservationData.phone && `, ${reservationData.phone}`}
                  {reservationData.email && `, ${reservationData.email}`}
                </p>
              </div>
            )}
          </div>
        );
      
      case 'payment':
        return (
          <div>
            <h2 className="text-3xl font-bold text-blue-900 mb-2">
              Payment Method
            </h2>
            <p className="text-gray-600 mb-6">
              Please choose your preferred payment method.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 text-center ${
                    reservationData.paymentMethod === method.name
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    {method.name}
                  </h3>
                </div>
              ))}
            </div>

            {reservationData.paymentMethod && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>Selected:</strong> {reservationData.paymentMethod}
                </p>
              </div>
            )}
          </div>
        );
      
      case 'confirmation':
        return (
          <div>
            <h2 className="text-3xl font-bold text-blue-900 mb-2">
              Booking Confirmation
            </h2>
            <p className="text-gray-600 mb-6">
              Please review your reservation details and say "Yes, confirm the booking" to proceed.
            </p>
            
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Hotel</p>
                  <p className="font-semibold">{reservationData.hotel}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Room Type</p>
                  <p className="font-semibold">{reservationData.roomType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Check-in</p>
                  <p className="font-semibold">{reservationData.checkIn}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Check-out</p>
                  <p className="font-semibold">{reservationData.checkOut}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Guests</p>
                  <p className="font-semibold">
                    {reservationData.adults} adults, {reservationData.children} children
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-semibold">{reservationData.paymentMethod}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm text-gray-500">Guest Name</p>
                  <p className="font-semibold">{reservationData.guestName}</p>
                </div>
              </div>
              
              <div className="border-t mt-4 pt-4 flex justify-between items-center">
                <span className="text-lg font-semibold">Total Amount:</span>
                <span className="text-2xl font-bold text-blue-600">
                  ${reservationData.roomPrice}/night
                </span>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const getCurrentIcon = () => {
    const IconComponent = stepIcons[step as keyof typeof stepIcons];
    return IconComponent ? <IconComponent className="w-10 h-10" /> : null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                {getCurrentIcon()}
              </div>
              {getStepContent()}
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

            {/* Transcript Display */}
            {transcript && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-500 mb-1">Last heard:</p>
                <p className="italic">"{transcript}"</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 flex-wrap">
              <button
                onClick={onNext}
                disabled={!canProceed()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-colors duration-200"
              >
                Next Step
              </button>
              
              {onHelp && (
                <button
                  onClick={onHelp}
                  className="border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold px-6 py-3 rounded-xl transition-colors duration-200"
                >
                  Get Help
                </button>
              )}
              
              {onReset && (
                <button
                  onClick={onReset}
                  className="text-gray-500 hover:text-gray-700 text-sm px-4 py-2 transition-colors duration-200"
                >
                  Start Over
                </button>
              )}
            </div>

            {/* Help Text */}
            <div className="text-center mt-6">
              <p className="text-sm text-gray-500">
                Say "Next" to continue • Say "Help" for guidance • Voice commands work at any time
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationFlow;