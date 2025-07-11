import React, { useState } from 'react';
import { 
  MapPin, 
  Wifi, 
  Car, 
  Phone, 
  Users, 
  Calendar,
  Star,
  MessageCircle,
  Mic,
  Bot,
  X,
  Camera,
  Upload,
  CreditCard
} from 'lucide-react';
import AIChatbot from './AIChatbot';
import ReservationModal from './ReservationModal';
import CheckInModal from './CheckInModal';
import CheckOutModal from './CheckOutModal';

const HotelHomepage: React.FC = () => {
  const [showChatbot, setShowChatbot] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);

  const accommodations = [
    {
      name: "Ocean View King Suite",
      price: 299,
      period: "per night",
      capacity: "Up to 2 adults, 1 children",
      amenities: ["Ocean View", "Balcony", "Kitchenette", "Mini Bar", "WiFi"],
      available: true
    },
    {
      name: "Deluxe Garden Room",
      price: 199,
      period: "per night",
      capacity: "Up to 2 adults, 0 children",
      amenities: ["Garden View", "Work Desk", "Coffee Maker", "WiFi"],
      available: true
    },
    {
      name: "Family Oceanfront Suite",
      price: 399,
      period: "per night",
      capacity: "Up to 4 adults, 2 children",
      amenities: ["Ocean View", "Separate Living Area", "Kitchenette", "Mini Bar", "WiFi"],
      available: true
    },
    {
      name: "Presidential Suite",
      price: 599,
      period: "per night",
      capacity: "Up to 4 adults, 2 children",
      amenities: ["Panoramic Ocean View", "Private Terrace", "Jacuzzi", "Butler Service", "WiFi"],
      available: true
    },
    {
      name: "Standard Double Room",
      price: 149,
      period: "per night",
      capacity: "Up to 2 adults, 0 children",
      amenities: ["City View", "Double Bed", "Work Desk", "WiFi"],
      available: true
    },
    {
      name: "Luxury Spa Suite",
      price: 449,
      period: "per night",
      capacity: "Up to 2 adults, 1 children",
      amenities: ["Ocean View", "Private Spa", "Balcony", "Kitchenette", "WiFi"],
      available: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Lagunacreek Resort & Spa</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    Oceanfront Paradise
                  </span>
                  <span>📞 +1 (555) 123-4567</span>
                  <span>✉️ info@lagunacreek.com</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {[1,2,3,4,5].map((star) => (
                  <Star key={star} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
                <span className="ml-2 text-sm font-medium">4.8 (2847 reviews)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-4xl font-bold mb-4">Experience Luxury by the Ocean</h2>
          <p className="text-xl mb-6">Premium accommodations with world-class amenities and breathtaking oceanfront views</p>
          <div className="flex items-center justify-center space-x-8 text-sm">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Oceanfront Location
            </div>
            <div className="flex items-center">
              <span className="mr-2">🏨</span>
              6 Room Types
            </div>
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Family Friendly
            </div>
          </div>
        </div>
      </div>

      {/* Resort Amenities */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h3 className="text-2xl font-bold text-center mb-8">Resort Amenities</h3>
          <div className="grid grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-semibold">Oceanfront Location</h4>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wifi className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-semibold">Free WiFi</h4>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Car className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-semibold">Valet Parking</h4>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-semibold">24/7 Room Service</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Our Accommodations */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h3 className="text-2xl font-bold text-center mb-8">Our Accommodations</h3>
          <div className="grid grid-cols-3 gap-6">
            {accommodations.map((room, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-semibold text-lg">{room.name}</h4>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    Available
                  </span>
                </div>
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  ${room.price}
                  <span className="text-sm text-gray-500 font-normal ml-1">{room.period}</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{room.capacity}</p>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Amenities:</p>
                  <div className="flex flex-wrap gap-1">
                    {room.amenities.slice(0, 3).map((amenity, i) => (
                      <span key={i} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <h3 className="text-2xl font-bold text-center mb-6">Quick Actions</h3>
        <div className="flex justify-center space-x-4">
          <button 
            onClick={() => setShowReservationModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold flex items-center space-x-2 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            <span>New Reservation</span>
          </button>
          <button 
            onClick={() => setShowCheckInModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-semibold flex items-center space-x-2 transition-colors"
          >
            <Users className="w-5 h-5" />
            <span>Check In</span>
          </button>
          <button 
            onClick={() => setShowCheckOutModal(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-xl font-semibold flex items-center space-x-2 transition-colors"
          >
            <CreditCard className="w-5 h-5" />
            <span>Check Out</span>
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl font-semibold flex items-center space-x-2 transition-colors">
            <span>🏨</span>
            <span>Room Availability</span>
          </button>
        </div>
      </div>

      {/* AI Chatbot Button */}
      {!showChatbot && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-3">
          {/* Voice Button */}
          <button
            onClick={() => setShowChatbot(true)}
            className="w-12 h-12 bg-gray-600 hover:bg-gray-700 text-white rounded-full shadow-lg transition-all duration-200 flex items-center justify-center"
          >
            <Mic className="w-6 h-6" />
          </button>

          {/* AI Assistant Button */}
          <button
            onClick={() => setShowChatbot(true)}
            className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-200 flex items-center justify-center"
          >
            <Bot className="w-7 h-7" />
          </button>
        </div>
      )}

      {/* Modals */}
      {showReservationModal && (
        <ReservationModal onClose={() => setShowReservationModal(false)} />
      )}
      
      {showCheckInModal && (
        <CheckInModal onClose={() => setShowCheckInModal(false)} />
      )}
      
      {showCheckOutModal && (
        <CheckOutModal onClose={() => setShowCheckOutModal(false)} />
      )}

      {/* AI Chatbot */}
      {showChatbot && (
        <AIChatbot onClose={() => setShowChatbot(false)} />
      )}
    </div>
  );
};

export default HotelHomepage;