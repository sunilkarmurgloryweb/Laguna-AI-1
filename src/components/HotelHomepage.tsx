import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  TextField,
  IconButton,
  Badge,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  Rating,
  Divider,
  Paper,
  InputAdornment
} from '@mui/material';
import {
  Search,
  Notifications,
  Settings,
  People,
  CalendarToday,
  LocationOn,
  CreditCard,
  Hotel,
  Menu as MenuIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import AIChatbot from './AIChatbot';
import ReservationModal from './ReservationModal';
import CheckInModal from './CheckInModal';
import CheckOutModal from './CheckOutModal';
import RoomAvailabilityModal from './RoomAvailabilityModal';

const ResizeHandle = styled(Box)(({ theme }) => ({
  width: 4,
  backgroundColor: theme.palette.divider,
  cursor: 'col-resize',
  position: 'relative',
  '&:hover': {
    backgroundColor: theme.palette.primary.main,
    '& .resize-indicator': {
      opacity: 1,
    },
  },
  '& .resize-indicator': {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    opacity: 0,
    transition: 'opacity 0.2s',
    display: 'flex',
    gap: 1,
  },
}));

const StatsCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  height: 64,
  borderRadius: theme.spacing(1.5),
  textTransform: 'none',
  fontSize: '1rem',
  fontWeight: 600,
}));

const RoomCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const HotelHomepage: React.FC = () => {
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [showRoomAvailabilityModal, setShowRoomAvailabilityModal] = useState(false);
  const [aiPanelWidth, setAiPanelWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [modalData, setModalData] = useState<any>({});

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
      case 'Available': return 'success';
      case 'Occupied': return 'error';
      case 'Maintenance': return 'warning';
      case 'Cleaning': return 'info';
      default: return 'default';
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
    setModalData(data || {});
    console.log(modalType, "modalType");
    
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
        setShowRoomAvailabilityModal(true);
        break;
      default:
        console.warn('Unknown modal type:', modalType);
        break;
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'grey.50' }}>
      {/* Full Width Header */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar sx={{ px: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 40, height: 40 }}>
              <Hotel />
            </Avatar>
            <Box>
              <Typography variant="h6" component="h1" fontWeight="bold">
                Lagunacreek PMS
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationOn sx={{ fontSize: 14, mr: 0.5 }} />
                  Resort & Spa Management
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  📞 +1 (555) 123-4567
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Header Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              size="small"
              placeholder="Search guests, rooms..."
              sx={{ width: 250 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <IconButton>
              <Badge badgeContent={4} color="error">
                <Notifications />
              </Badge>
            </IconButton>
            <IconButton>
              <Settings />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Rating value={4.8} precision={0.1} size="small" readOnly />
              <Typography variant="body2" fontWeight="medium">
                4.8 Rating
              </Typography>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Side - Main App */}
        <Box 
          sx={{ 
            flex: 1, 
            overflow: 'auto', 
            width: `calc(100% - ${aiPanelWidth}px)`,
            p: 3
          }}
        >
          {/* Dashboard Stats */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        Total Rooms
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        156
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                      <People />
                    </Avatar>
                  </Box>
                </CardContent>
              </StatsCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        Occupied
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="success.main">
                        124
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'success.light', color: 'success.main' }}>
                      <CalendarToday />
                    </Avatar>
                  </Box>
                </CardContent>
              </StatsCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        Available
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="primary.main">
                        28
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                      <LocationOn />
                    </Avatar>
                  </Box>
                </CardContent>
              </StatsCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        Maintenance
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="warning.main">
                        4
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.main' }}>
                      <Settings />
                    </Avatar>
                  </Box>
                </CardContent>
              </StatsCard>
            </Grid>
          </Grid>

          {/* Quick Actions */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <ActionButton
                  variant="contained"
                  fullWidth
                  startIcon={<CalendarToday />}
                  onClick={() => setShowReservationModal(true)}
                >
                  New Reservation
                </ActionButton>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ActionButton
                  variant="contained"
                  color="success"
                  fullWidth
                  startIcon={<People />}
                  onClick={() => setShowCheckInModal(true)}
                >
                  Check In
                </ActionButton>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ActionButton
                  variant="contained"
                  color="warning"
                  fullWidth
                  startIcon={<CreditCard />}
                  onClick={() => setShowCheckOutModal(true)}
                >
                  Check Out
                </ActionButton>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ActionButton
                  variant="contained"
                  color="secondary"
                  fullWidth
                  startIcon={<Search />}
                >
                  Room Status
                </ActionButton>
              </Grid>
            </Grid>
          </Paper>

          {/* Room Management */}
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">
                Room Management
              </Typography>
              <Button color="primary">
                View All Rooms
              </Button>
            </Box>
            
            <Grid container spacing={3}>
              {accommodations.map((room, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <RoomCard>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {room.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Room {room.roomNumber}
                          </Typography>
                        </Box>
                        <Chip
                          label={room.status}
                          color={getStatusColor(room.status) as any}
                          size="small"
                        />
                      </Box>
                      
                      <Typography variant="h4" color="primary.main" fontWeight="bold" sx={{ mb: 1 }}>
                        ${room.price}
                        <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          {room.period}
                        </Typography>
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {room.capacity}
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                          Amenities:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {room.amenities.slice(0, 3).map((amenity, i) => (
                            <Chip
                              key={i}
                              label={amenity}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                          ))}
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          fullWidth
                        >
                          View Details
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          fullWidth
                        >
                          Manage
                        </Button>
                      </Box>
                    </CardContent>
                  </RoomCard>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Box>

        {/* Resizer */}
        <ResizeHandle onMouseDown={handleMouseDown}>
          <Box className="resize-indicator">
            <Box sx={{ width: 2, height: 20, bgcolor: 'grey.400' }} />
            <Box sx={{ width: 2, height: 20, bgcolor: 'grey.400' }} />
          </Box>
        </ResizeHandle>

        {/* Right Side - AI Assistant */}
        <Box 
          sx={{ 
            width: `${aiPanelWidth}px`,
            minWidth: 300,
            bgcolor: 'background.paper',
            borderLeft: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box sx={{ 
            p: 2, 
            borderBottom: 1, 
            borderColor: 'divider',
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            color: 'white'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: 'white', color: 'primary.main', width: 32, height: 32 }}>
                <Settings />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  AI Assistant
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Powered by Gemini AI
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <AIChatbot onOpenModal={handleOpenModal} />
          </Box>
        </Box>
      </Box>

      {/* Modals */}
      {showReservationModal && (
        <ReservationModal 
          isOpen={showReservationModal}
          onClose={() => setShowReservationModal(false)}
          initialData={modalData}
        />
      )}
      
      {showCheckInModal && (
        <CheckInModal 
          isOpen={showCheckInModal}
          onClose={() => setShowCheckInModal(false)}
          guestData={modalData}
        />
      )}
      
      {showCheckOutModal && (
        <CheckOutModal 
          isOpen={showCheckOutModal}
          onClose={() => setShowCheckOutModal(false)}
          guestData={modalData}
        />
      )}
      
      {showRoomAvailabilityModal && (
        <RoomAvailabilityModal
          isOpen={showRoomAvailabilityModal}
          onClose={() => setShowRoomAvailabilityModal(false)}
          availabilityData={modalData}
        />
      )}
    </Box>
  );
};

export default HotelHomepage;