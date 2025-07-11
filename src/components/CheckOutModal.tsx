import React, { useState } from 'react';
import { X, FileText, CreditCard, Receipt } from 'lucide-react';

interface CheckOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestData?: {
    name: string;
    room: string;
    checkIn: string;
    checkOut: string;
  };
}

export const CheckOutModal: React.FC<CheckOutModalProps> = ({ 
  isOpen, 
  onClose,
  guestData = {
    name: 'John Smith',
    room: 'Ocean View King Suite - 205',
    checkIn: 'January 15, 2024',
    checkOut: 'January 17, 2024'
  }
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const charges = [
    { description: 'Room Charge - Ocean View King Suite', date: '2024-01-15', amount: 299.00 },
    { description: 'Room Charge - Ocean View King Suite', date: '2024-01-16', amount: 299.00 },
    { description: 'Spa Service - Massage Therapy', date: '2024-01-16', amount: 150.00 },
    { description: 'Restaurant - Dinner at Oceanview Grill', date: '2024-01-16', amount: 85.50 }
  ];

  const totalAmount = charges.reduce((sum, charge) => sum + charge.amount, 0);
  const roomCharges = charges.filter(c => c.description.includes('Room Charge')).reduce((sum, c) => sum + c.amount, 0);
  const services = charges.filter(c => !c.description.includes('Room Charge')).reduce((sum, c) => sum + c.amount, 0);
  const taxes = totalAmount * 0.12;
  const fees = 25.00;
  const finalTotal = totalAmount + taxes + fees;

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

  const handleSettleBalance = () => {
    // Handle checkout completion
    alert('Checkout completed successfully!');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Guest Check-Out</h2>
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
          {currentStep === 1 && (
            <div>
              <div className="flex items-center mb-6">
                <FileText className="w-6 h-6 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-800">Guest Folio</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Review your charges and settle any outstanding balance.
              </p>

              {/* Guest Information */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Guest Information</h4>
                    <p className="text-sm text-gray-600">Guest Name:</p>
                    <p className="font-medium">{guestData.name}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Room</h4>
                    <p className="font-medium">{guestData.room}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Check In</h4>
                    <p className="font-medium">{guestData.checkIn}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Check Out</h4>
                    <p className="font-medium">{guestData.checkOut}</p>
                  </div>
                </div>
              </div>

              {/* Charge Details */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-4">Charge Details</h4>
                <div className="space-y-3">
                  {charges.map((charge, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div>
                        <p className="font-medium text-gray-800">{charge.description}</p>
                        <p className="text-sm text-gray-500">{charge.date}</p>
                      </div>
                      <p className="font-medium text-gray-800">${charge.amount.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Breakdown */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">Total Outstanding:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Room Charges</span>
                    <span>${roomCharges.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Services</span>
                    <span>${services.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Taxes</span>
                    <span>${taxes.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fees</span>
                    <span>${fees.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total Outstanding:</span>
                    <span className="text-blue-600">${finalTotal.toFixed(2)}</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center text-xs text-gray-500">
                  <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                  <span>Room Charges</span>
                  <span className="w-3 h-3 bg-green-500 rounded-full ml-4 mr-2"></span>
                  <span>Services</span>
                  <span className="w-3 h-3 bg-yellow-500 rounded-full ml-4 mr-2"></span>
                  <span>Taxes</span>
                  <span className="w-3 h-3 bg-red-500 rounded-full ml-4 mr-2"></span>
                  <span>Fees</span>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <div className="flex items-center mb-6">
                <CreditCard className="w-6 h-6 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-800">Payment Method</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Select your preferred payment method to settle the outstanding balance.
              </p>

              <div className="space-y-4">
                <div className="border rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors">
                  <div className="flex items-center">
                    <input type="radio" name="payment" id="card" className="mr-3" defaultChecked />
                    <label htmlFor="card" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Credit/Debit Card on File</p>
                          <p className="text-sm text-gray-500">**** **** **** 1234</p>
                        </div>
                        <CreditCard className="w-5 h-5 text-gray-400" />
                      </div>
                    </label>
                  </div>
                </div>

                <div className="border rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors">
                  <div className="flex items-center">
                    <input type="radio" name="payment" id="cash" className="mr-3" />
                    <label htmlFor="cash" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Cash Payment</p>
                          <p className="text-sm text-gray-500">Pay at front desk</p>
                        </div>
                        <Receipt className="w-5 h-5 text-gray-400" />
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Payment will be processed immediately upon confirmation.
                </p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <div className="flex items-center mb-6">
                <Receipt className="w-6 h-6 text-green-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-800">Checkout Confirmation</h3>
              </div>
              
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Receipt className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Ready to Check Out</h4>
                <p className="text-gray-600">
                  Please review your final charges and confirm checkout.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Total Amount:</span>
                  <span className="text-xl font-bold text-green-600">${finalTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Payment Method:</span>
                  <span>Credit Card (**** 1234)</span>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Thank you for staying with us!</strong> We hope you enjoyed your experience at Lagunacreek Resort & Spa.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          
          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSettleBalance}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Settle Balance
            </button>
          )}
        </div>
      </div>
    </div>
  );
};