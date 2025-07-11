import React, { useState } from 'react';
import { X, Camera, Upload, Users } from 'lucide-react';

interface CheckInModalProps {
  onClose: () => void;
}

const CheckInModal: React.FC<CheckInModalProps> = ({ onClose }) => {
  const [step, setStep] = useState(1);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Guest Check-In</h2>
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
          <div className="flex items-center mb-6">
            <Users className="w-6 h-6 text-blue-600 mr-3" />
            <h3 className="text-xl font-semibold">Document Verification</h3>
          </div>
          
          <p className="text-gray-600 mb-6">
            Please capture or upload a photo of your identification document for verification.
          </p>

          <div className="flex justify-center space-x-4 mb-6">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors">
              <Camera className="w-5 h-5" />
              <span>Start Camera</span>
            </button>
            <button className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors">
              <Upload className="w-5 h-5" />
              <span>Upload Document</span>
            </button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              📋 Please ensure your document is clear and all information is visible for quick verification.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 hover:text-gray-800"
          >
            Previous
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-semibold transition-colors">
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckInModal;