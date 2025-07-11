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
  CreditCard,
  Menu,
  Settings,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import AIChatbot from './AIChatbot';
import ReservationModal from './ReservationModal';
import CheckInModal from './CheckInModal';
import CheckOutModal from './CheckOutModal';

const HotelHomepage: React.FC = () => {
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [aiPanelWidth, setAiPanelWidth] = useState(400); // Default width for AI panel
  const [isResizing, setIsResizing] = useState(false);

  const accommodations = [
    {
      name: "Ocean View King Suite",
      price: 299,
      period: "per night",
      capacity: "Up to 2 adults, 1 children",
      amenities: ["Ocean View", "Balcony", "Kitchenette", "Mini Bar", "WiFi"],
      available: true,
      status: "Available",
      roomNumber: "205"
    },
    {
      name: "Deluxe Garden Room",
      price: 199,
      period: "per night",
      capacity: "Up to 2 adults, 0 children",
      amenities: ["Garden View", "Work Desk", "Coffee Maker", "WiFi"],
      available: true,
      status: "Occupied",
      roomNumber: "102"
    },
    {
      name: "Family Oceanfront Suite",
      price: 399,
      period: "per night",
      capacity: "Up to 4 adults, 2 children",
      amenities: ["Ocean View", "Separate Living Area", "Kitchenette", "Mini Bar", "WiFi"],
      available: true,
      status: "Maintenance",
      roomNumber: "301"
    },
    {
      name: "Presidential Suite",
      price: 599,
      period: "per night",
      capacity: "Up to 4 adults, 2 children",
      amenities: ["Panoramic Ocean View", "Private Terrace", "Jacuzzi", "Butler Service", "WiFi"],
      available: true,
      status: "Available",
      roomNumber: "401"
    },
    {
      name: "Standard Double Room",
      price: 149,
      period: "per night",
      capacity: "Up to 2 adults, 0 children",
      amenities: ["City View", "Double Bed", "Work Desk", "WiFi"],
      available: true,
      status: "Cleaning",
      roomNumber: "103"
    },
    {
      name: "Luxury Spa Suite",
      price: 449,
      period: "per night",
      capacity: "Up to 2 adults, 1 children",
      amenities: ["Ocean View", "Private Spa", "Balcony", "Kitchenette", "WiFi"],
      available: true,
      status: "Available",
      roomNumber: "302"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Occupied': return 'bg-red-100 text-red-800';
      case 'Maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'Cleaning': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    
    const newWidth = window.innerWidth - e.clientX;
    const minWidth = 300;
    const maxWidth = window.innerWidth * 0.6;
    
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setAiPanelWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

  const handleOpenModal = (modalType: 'reservation' | 'checkin' | 'checkout' | 'availability', data?: any) => {
    switch (modalType) {
      case 'reservation':
        setShowReservationModal(true);
        break;
      case 'checkin':
        setShowCheckInModal(true);
        break;
      case 'checkout':
        setShowCheckOutModal(true);
        break;
      case 'availability':
        // Handle availability modal
        break;
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Full Width Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">L</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Lagunacreek PMS</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      Resort & Spa Management
                    </span>
                    <span>📞 +1 (555) 123-4567</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search guests, rooms..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>
              <button className="p-2 text-gray-600 hover:text-gray-800 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-800">
                <Settings className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  {[1,2,3,4,5].map((star) => (
                    <Star key={star} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                  <span className="ml-2 text-sm font-medium">4.8 Rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side - Main App */}
        <div 
          className="flex-1 overflow-y-auto bg-gray-50"
          style={{ width: `calc(100% - ${aiPanelWidth}px)` }}
        >
          <div className="p-6">
            {/* Dashboard Stats */}
            <div className="grid grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Rooms</p>
                    <p className="text-2xl font-bold text-gray-900">156</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Occupied</p>
                    <p className="text-2xl font-bold text-green-600">124</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Available</p>
                    <p className="text-2xl font-bold text-blue-600">28</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Maintenance</p>
                    <p className="text-2xl font-bold text-orange-600">4</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Settings className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-4 gap-4">
                <button 
                  onClick={() => setShowReservationModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-colors"
                >
                  <Calendar className="w-5 h-5" />
                  <span>New Reservation</span>
                </button>
                <button 
                  onClick={() => setShowCheckInModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-colors"
                >
                  <Users className="w-5 h-5" />
                  <span>Check In</span>
                </button>
                <button 
                  onClick={() => setShowCheckOutModal(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-4 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-colors"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Check Out</span>
                </button>
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-colors">
                  <Search className="w-5 h-5" />
                  <span>Room Status</span>
                </button>
              </div>
            </div>

            {/* Room Management */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Room Management</h3>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View All Rooms
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                {accommodations.map((room, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-lg text-gray-900">{room.name}</h4>
                        <p className="text-sm text-gray-600">Room {room.roomNumber}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                        {room.status}
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
                    
                    <div className="mt-4 flex space-x-2">
                      <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors">
                        View Details
                      </button>
                      <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors">
                        Manage
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Resizer */}
        <div
          className="w-1 bg-gray-300 hover:bg-gray-400 cursor-col-resize flex-shrink-0 relative group"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-500 group-hover:bg-opacity-20 transition-colors"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex space-x-1">
              <ChevronLeft className="w-3 h-3 text-gray-600" />
              <ChevronRight className="w-3 h-3 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Right Side - AI Assistant */}
        <div 
          className="bg-white border-l border-gray-200 flex flex-col"
          style={{ width: `${aiPanelWidth}px`, minWidth: '300px' }}
        >
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-white">AI Assistant</h3>
                <p className="text-xs text-blue-100">Powered by Gemini AI</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1">
            <AIChatbot onOpenModal={handleOpenModal} />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showReservationModal && (
        <ReservationModal onClose={() => setShowReservationModal(false)} />
      )}
      
      {showCheckInModal && (
        <CheckInModal 
          isOpen={showCheckInModal}
          onClose={() => setShowCheckInModal(false)} 
        />
      )}
      
      {showCheckOutModal && (
        <CheckOutModal 
          isOpen={showCheckOutModal}
          onClose={() => setShowCheckOutModal(false)} 
        />
      )}
    </div>
  );
};

export default HotelHomepage;