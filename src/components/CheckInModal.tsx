import React, { useState } from 'react';
import { X, Camera, Upload, User, Calendar, CreditCard } from 'lucide-react';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestData?: {
    name?: string;
    confirmationNumber?: string;
    checkInDate?: string;
    roomType?: string;
  };
}

export const CheckInModal: React.FC<CheckInModalProps> = ({ 
  isOpen, 
  onClose,
  guestData = {}
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: guestData.name || '',
    confirmationNumber: guestData.confirmationNumber || '',
    checkInDate: guestData.checkInDate || '',
    roomType: guestData.roomType || '',
    documentUploaded: false,
    signatureCompleted: false
  });

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Handle check-in completion
    console.log('Check-in completed:', formData);
    onClose();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center mb-4">
              <User className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold">Guest Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmation Number
                </label>
                <input
                  type="text"
                  value={formData.confirmationNumber}
                  onChange={(e) => setFormData({...formData, confirmationNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="LG123456"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check-in Date
                </label>
                <input
                  type="date"
                  value={formData.checkInDate}
                  onChange={(e) => setFormData({...formData, checkInDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Type
                </label>
                <select
                  value={formData.roomType}
                  onChange={(e) => setFormData({...formData, roomType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select room type</option>
                  <option value="Ocean View King Suite">Ocean View King Suite</option>
                  <option value="Deluxe Garden Room">Deluxe Garden Room</option>
                  <option value="Family Oceanfront Suite">Family Oceanfront Suite</option>
                  <option value="Presidential Suite">Presidential Suite</option>
                  <option value="Standard Double Room">Standard Double Room</option>
                  <option value="Luxury Spa Suite">Luxury Spa Suite</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center mb-4">
              <CreditCard className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold">Document Verification</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Please capture or upload a photo of your identification document for verification.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setFormData({...formData, documentUploaded: true})}
                className="flex-1 flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Camera className="w-5 h-5 mr-2" />
                Start Camera
              </button>
              <button
                onClick={() => setFormData({...formData, documentUploaded: true})}
                className="flex-1 flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Document
              </button>
            </div>
            {formData.documentUploaded && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800">✓ Document uploaded successfully</p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center mb-4">
              <Calendar className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold">Check-in Summary</h3>
            </div>
            <div className="bg-gray-50 p-4 rounded-md space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Guest Name:</span>
                <span>{formData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Confirmation:</span>
                <span>{formData.confirmationNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Check-in Date:</span>
                <span>{formData.checkInDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Room Type:</span>
                <span>{formData.roomType}</span>
              </div>
            </div>
            <div className="mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.signatureCompleted}
                  onChange={(e) => setFormData({...formData, signatureCompleted: e.target.checked})}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  I confirm that all information is correct and agree to the terms and conditions
                </span>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Guest Check-In</h2>
            <p className="text-sm text-gray-600">Step {currentStep} of 3 - {Math.round((currentStep / 3) * 100)}% Complete</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            ></div>
          </div>
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
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {currentStep < 3 ? (
            <button
              onClick={handleNext}
              disabled={
                (currentStep === 1 && (!formData.name || !formData.confirmationNumber)) ||
                (currentStep === 2 && !formData.documentUploaded)
              }
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={!formData.signatureCompleted}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Complete Check-in
            </button>
          )}
        </div>
      </div>
    </div>
  );
};