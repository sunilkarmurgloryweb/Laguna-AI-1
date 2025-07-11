import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, Hotel, CreditCard, CheckCircle } from 'lucide-react';

interface ReservationModalProps {
  isOpen?: boolean;
  onClose: () => void;
  initialData?: {
    checkIn?: string;
    checkOut?: string;
    adults?: number;
    children?: number;
    roomType?: string;
    guestName?: string;
    phone?: string;
    email?: string;
    paymentMethod?: string;
  };
}

const ReservationModal: React.FC<ReservationModalProps> = ({ 
  isOpen = true, 
  onClose,
  initialData = {}
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    checkIn: initialData.checkIn || '',
    checkOut: initialData.checkOut || '',
    adults: initialData.adults || 1,
    children: initialData.children || 0,
    roomType: initialData.roomType || '',
    guestName: initialData.guestName || '',
    phone: initialData.phone || '',
    email: initialData.email || '',
    paymentMethod: initialData.paymentMethod || ''
  });

  // Update form data when initialData changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...initialData
    }));
    
    // Auto-advance to the next incomplete step
    const nextStep = determineNextStep(initialData);
    setCurrentStep(nextStep);
  }, [initialData]);

  const totalSteps = 4;

  // Determine which step to show based on available data
  const determineNextStep = (data: any): number => {
    // Step 1: Dates & Guests
    if (!data.checkIn || !data.checkOut || !data.adults) {
      return 1;
    }
    
    // Step 2: Room Selection
    if (!data.roomType) {
      return 2;
    }
    
    // Step 3: Guest Information
    if (!data.guestName || !data.phone || !data.email) {
      return 3;
    }
    
    // Step 4: Payment Method
    if (!data.paymentMethod) {
      return 4;
    }
    
    // All steps complete, stay on payment step for final review
    return 4;
  };

  const roomTypes = [
    {
      id: 'ocean-view-king',
      name: 'Ocean View King Suite',
      price: 299,
      description: 'Luxurious suite with panoramic ocean views',
      amenities: ['Ocean View', 'King Bed', 'Balcony', 'Mini Bar', 'WiFi']
    },
    {
      id: 'deluxe-garden',
      name: 'Deluxe Garden Room',
      price: 199,
      description: 'Comfortable room overlooking beautiful gardens',
      amenities: ['Garden View', 'Queen Bed', 'Work Desk', 'Coffee Maker', 'WiFi']
    },
    {
      id: 'family-oceanfront',
      name: 'Family Oceanfront Suite',
      price: 399,
      description: 'Spacious suite perfect for families',
      amenities: ['Ocean View', '2 Queen Beds', 'Living Area', 'Kitchenette', 'WiFi']
    }
  ];

  const paymentMethods = [
    { id: 'credit-card', name: 'Credit Card', description: 'Pay with Visa, MasterCard, or Amex' },
    { id: 'pay-at-hotel', name: 'Pay at Hotel', description: 'Pay when you arrive at the hotel' },
    { id: 'upi', name: 'UPI / Digital Wallet', description: 'Pay with UPI, PayPal, or other digital wallets' }
  ];

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    console.log('Reservation submitted:', formData);
    alert('Reservation confirmed! You will receive a confirmation email shortly.');
    onClose();
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return formData.checkIn && formData.checkOut && formData.adults > 0;
      case 2:
        return formData.roomType;
      case 3:
        return formData.guestName && formData.phone && formData.email;
      case 4:
        return formData.paymentMethod;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <Calendar className="w-6 h-6 text-blue-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-800">Dates & Guests</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-in Date
                </label>
                <input
                  type="date"
                  value={formData.checkIn}
                  onChange={(e) => setFormData({...formData, checkIn: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formData.checkIn ? 'border-green-500 bg-green-50' : 'border-gray-300'
                  }`}
                />
                {formData.checkIn && (
                  <p className="text-xs text-green-600 mt-1">✓ Auto-filled from voice</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-out Date
                </label>
                <input
                  type="date"
                  value={formData.checkOut}
                  onChange={(e) => setFormData({...formData, checkOut: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formData.checkOut ? 'border-green-500 bg-green-50' : 'border-gray-300'
                  }`}
                />
                {formData.checkOut && (
                  <p className="text-xs text-green-600 mt-1">✓ Auto-filled from voice</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adults
                </label>
                <select
                  value={formData.adults}
                  onChange={(e) => setFormData({...formData, adults: parseInt(e.target.value)})}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formData.adults > 1 || initialData.adults ? 'border-green-500 bg-green-50' : 'border-gray-300'
                  }`}
                >
                  {[1,2,3,4,5,6].map(num => (
                    <option key={num} value={num}>{num} Adult{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
                {(formData.adults > 1 || initialData.adults) && (
                  <p className="text-xs text-green-600 mt-1">✓ Auto-filled from voice</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Children
                </label>
                <select
                  value={formData.children}
                  onChange={(e) => setFormData({...formData, children: parseInt(e.target.value)})}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formData.children > 0 || initialData.children ? 'border-green-500 bg-green-50' : 'border-gray-300'
                  }`}
                >
                  {[0,1,2,3,4].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'Child' : 'Children'}</option>
                  ))}
                </select>
                {(formData.children > 0 || initialData.children) && (
                  <p className="text-xs text-green-600 mt-1">✓ Auto-filled from voice</p>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <Hotel className="w-6 h-6 text-blue-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-800">Select Room</h3>
            </div>
            
            <div className="space-y-4">
              {roomTypes.map((room) => (
                <div
                  key={room.id}
                  onClick={() => setFormData({...formData, roomType: room.name})}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    formData.roomType === room.name
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800">{room.name}</h4>
                      {formData.roomType === room.name && initialData.roomType && (
                        <p className="text-xs text-green-600">✓ Auto-selected from voice</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">${room.price}</div>
                      <div className="text-sm text-gray-500">per night</div>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3">{room.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {room.amenities.map((amenity, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <Users className="w-6 h-6 text-blue-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-800">Guest Information</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.guestName}
                  onChange={(e) => setFormData({...formData, guestName: e.target.value})}
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="Enter phone number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="Enter email address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <CreditCard className="w-6 h-6 text-blue-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-800">Payment Method</h3>
            </div>
            
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  onClick={() => setFormData({...formData, paymentMethod: method.name})}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    formData.paymentMethod === method.name
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <h4 className="text-lg font-semibold text-gray-800 mb-1">{method.name}</h4>
                  <p className="text-gray-600 text-sm">{method.description}</p>
                </div>
              ))}
            </div>

            {/* Booking Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mt-6">
              <h4 className="font-semibold text-gray-800 mb-3">Booking Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Check-in:</span>
                  <span>{formData.checkIn}</span>
                </div>
                <div className="flex justify-between">
                  <span>Check-out:</span>
                  <span>{formData.checkOut}</span>
                </div>
                <div className="flex justify-between">
                  <span>Guests:</span>
                  <span>{formData.adults} adults, {formData.children} children</span>
                </div>
                <div className="flex justify-between">
                  <span>Room:</span>
                  <span>{formData.roomType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Guest:</span>
                  <span>{formData.guestName}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span>Payment:</span>
                  <span>{formData.paymentMethod}</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Make Reservation</h2>
            <div className="flex items-center mt-2">
              <span className="text-sm text-gray-600">Step {currentStep} of {totalSteps}</span>
              <div className="ml-4 flex-1 max-w-xs">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  ></div>
                </div>
              </div>
              <span className="ml-4 text-sm font-medium text-blue-600">
                {Math.round((currentStep / totalSteps) * 100)}% Complete
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          
          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              disabled={!canProceedToNext()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceedToNext()}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm Reservation
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReservationModal;