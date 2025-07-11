import React from 'react';
import { 
  CheckCircle,
  Calendar,
  Users,
  Hotel as HotelIcon,
  User,
  CreditCard,
  Mail,
  Phone,
  Bell
} from 'lucide-react';
import { ReservationData } from '../types/reservation';

interface ConfirmationScreenProps {
  reservationData: ReservationData;
  onNewReservation: () => void;
}

const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({
  reservationData,
  onNewReservation
}) => {
  const bookingId = `LG${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-green-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8">
            {/* Success Header */}
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-14 h-14 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-green-600 mb-2">
                Booking Confirmed!
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Your reservation has been successfully created.
              </p>
              
              <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4 inline-block">
                <h2 className="text-xl font-semibold text-green-700">
                  Booking ID: {bookingId}
                </h2>
              </div>
            </div>

            {/* Reservation Details */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h3 className="text-2xl font-semibold text-blue-900 mb-4">
                Reservation Details
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <Calendar className="w-6 h-6 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Check-in</p>
                    <p className="font-semibold">{reservationData.checkIn}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="w-6 h-6 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Check-out</p>
                    <p className="font-semibold">{reservationData.checkOut}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Users className="w-6 h-6 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Guests</p>
                    <p className="font-semibold">
                      {reservationData.adults} adults, {reservationData.children} children
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <HotelIcon className="w-6 h-6 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Room Type</p>
                    <p className="font-semibold">{reservationData.roomType}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Guest & Payment Info */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h3 className="text-2xl font-semibold text-blue-900 mb-4">
                Guest & Payment Information
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <User className="w-6 h-6 text-gray-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Guest Name</p>
                    <p className="font-semibold">{reservationData.guestName}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <CreditCard className="w-6 h-6 text-gray-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="font-semibold">{reservationData.paymentMethod}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* What's Next */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                What's Next?
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="text-sm">
                    A confirmation email has been sent to {reservationData.email}
                  </span>
                </div>
                <div className="flex items-center">
                  <Bell className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="text-sm">
                    You'll receive a reminder 24 hours before check-in
                  </span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="text-sm">
                    Contact us at support@lagunacreek.com for any changes
                  </span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="text-center">
              <button
                onClick={onNewReservation}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors duration-200"
              >
                Make Another Reservation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationScreen;