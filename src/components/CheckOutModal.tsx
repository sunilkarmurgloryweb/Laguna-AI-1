import React from 'react';
import { X, CreditCard } from 'lucide-react';

interface CheckOutModalProps {
  onClose: () => void;
}

const CheckOutModal: React.FC<CheckOutModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Guest Check-Out</h2>
            <div className="flex items-center mt-2">
              <span className="text-sm text-gray-500">Step 1 of 3</span>
              <div className="ml-4 flex-1 max-w-xs">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full w-1/3"></div>
                </div>
              </div>
              <span className="ml-4 text-sm text-gray-500">33% Complete</span>
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
            <CreditCard className="w-6 h-6 text-blue-600 mr-3" />
            <h3 className="text-xl font-semibold">Guest Folio</h3>
          </div>
          
          <p className="text-gray-600 mb-6">
            Review your charges and settle any outstanding balance.
          </p>

          {/* Guest Information */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Guest Information</h4>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-500">Guest Name:</span> John Smith</p>
                <p><span className="text-gray-500">Check-In:</span> January 15, 2024</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Room</h4>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-500">Room:</span> Ocean View King Suite - 205</p>
                <p><span className="text-gray-500">Check-Out:</span> January 17, 2024</p>
              </div>
            </div>
          </div>

          {/* Charge Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-4">Charge Details</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">🏨 Room Charge - Ocean View King Suite</p>
                  <p className="text-sm text-gray-500">Jan 15 - 17</p>
                </div>
                <span className="font-semibold">$299.00</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">🏨 Room Charge - Ocean View King Suite</p>
                  <p className="text-sm text-gray-500">Jan 15 - 17</p>
                </div>
                <span className="font-semibold">$299.00</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">🧘 Spa Service - Massage Therapy</p>
                  <p className="text-sm text-gray-500">Jan 16, 2:00 PM</p>
                </div>
                <span className="font-semibold">$150.00</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">🍽️ Restaurant - Dinner at Oceanview Grill</p>
                  <p className="text-sm text-gray-500">Jan 16, 7:30 PM</p>
                </div>
                <span className="font-semibold">$85.50</span>
              </div>
            </div>
            
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total Outstanding:</span>
                <span className="text-blue-600">$1012.04</span>
              </div>
              <div className="flex justify-center space-x-4 text-xs text-gray-500 mt-2">
                <span>🏨 Room Charges</span>
                <span>🛎️ Services</span>
                <span>🍽️ Taxes</span>
                <span>💰 Fees</span>
              </div>
            </div>
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
          <button className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 rounded-lg font-semibold transition-colors">
            Settle Balance
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckOutModal;