import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  TextField,
  IconButton,
  Badge,
  Grid2 as Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  Rating,
  Divider,
  Paper,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Fab
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
  Menu as MenuIcon,
  Chat,
  Language,
  Close
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import AIChatbot from './AIChatbot';
import ReservationModal from './ReservationModal';
import CheckInModal from './CheckInModal';
import CheckOutModal from './CheckOutModal';
import RoomAvailabilityModal from './RoomAvailabilityModal';
import LanguageSelector from './LanguageSelector';
import { multilingualAI } from '../services/multilingualAIService';

const ResizeHandle = styled(Box)(({ theme }) => ({
  width: 4,
  backgroundColor: theme.palette.divider,
  cursor: 'col-resize',
  position: 'relative',
  display: 'none',
  [theme.breakpoints.up('lg')]: {
    display: 'block',
  },
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
  height: 56,
  borderRadius: theme.spacing(1.5),
  textTransform: 'none',
  fontSize: '0.9rem',
  fontWeight: 600,
  [theme.breakpoints.up('md')]: {
    height: 64,
    fontSize: '1rem',
  },
}));

const RoomCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const ChatFab = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(2),
  right: theme.spacing(2),
  zIndex: 1000,
  [theme.breakpoints.up('lg')]: {
    display: 'none',
  },
}));

const HotelHomepage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [showRoomAvailabilityModal, setShowRoomAvailabilityModal] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [aiPanelWidth, setAiPanelWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [modalData, setModalData] = useState<any>({});
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');

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
    if (!isDesktop) return;
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing || !isDesktop) return;
    
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
    if (isResizing && isDesktop) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, isDesktop]);

  const handleOpenModal = (modalType: 'reservation' | 'checkin' | 'checkout' | 'availability', data?: Record<string, unknown>) => {
    setModalData(data || {});
    
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

  const handleLanguageChange = (language: string) => {
    setCurrentLanguage(language);
    multilingualAI.setLanguage(language);
    setShowLanguageSelector(false);
  };

  const getLanguageInfo = () => {
    return multilingualAI.getLanguageInfo(currentLanguage);
  };

  const renderMobileDrawer = () => (
    <Drawer
      anchor="left"
      open={mobileDrawerOpen}
      onClose={() => setMobileDrawerOpen(false)}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
            <Hotel />
          </Avatar>
          <Typography variant="h6" fontWeight="bold">
            Lagunacreek PMS
          </Typography>
        </Box>
        
        <List>
          <ListItem button onClick={() => setShowReservationModal(true)}>
            <ListItemIcon><CalendarToday /></ListItemIcon>
            <ListItemText primary="New Reservation" />
          </ListItem>
          <ListItem button onClick={() => setShowCheckInModal(true)}>
            <ListItemIcon><People /></ListItemIcon>
            <ListItemText primary="Check In" />
          </ListItem>
          <ListItem button onClick={() => setShowCheckOutModal(true)}>
            <ListItemIcon><CreditCard /></ListItemIcon>
            <ListItemText primary="Check Out" />
          </ListItem>
          <ListItem button onClick={() => setShowRoomAvailabilityModal(true)}>
            <ListItemIcon><Search /></ListItemIcon>
            <ListItemText primary="Room Availability" />
          </ListItem>
          <ListItem button onClick={() => setShowLanguageSelector(true)}>
            <ListItemIcon><Language /></ListItemIcon>
            <ListItemText primary="Language" />
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );

  const renderChatDrawer = () => (
    <Drawer
      anchor="right"
      open={chatDrawerOpen}
      onClose={() => setChatDrawerOpen(false)}
      sx={{
        '& .MuiDrawer-paper': {
          width: '100vw',
          [theme.breakpoints.up('sm')]: {
            width: 400,
          },
          boxSizing: 'border-box',
          height: '100vh',
          maxHeight: '100vh',
          overflow: 'hidden'
        },
      }}
    >
      <Box sx={{ 
        height: '100%',
        maxHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
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
                {getLanguageInfo().name} • Powered by Gemini AI
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setChatDrawerOpen(false)} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Box>
        
        <Box sx={{ 
          flex: 1, 
          overflow: 'hidden',
          maxHeight: 'calc(100vh - 80px)'
        }}>
          <AIChatbot 
            onOpenModal={handleOpenModal}
            context={`hotel_general_${currentLanguage}`}
          />
        </Box>
      </Box>
    </Drawer>
  );

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'grey.50' }}>
      {/* Full Width Header */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
          {isMobile && (
            <IconButton
              edge="start"
              onClick={() => setMobileDrawerOpen(true)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 40, height: 40 }}>
              <Hotel />
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="h6" component="h1" fontWeight="bold">
                Lagunacreek PMS
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationOn sx={{ fontSize: 14, mr: 0.5 }} />
                  Resort & Spa Management
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>
                  📞 +1 (555) 123-4567
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Header Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
            {!isMobile && (
              <TextField
                size="small"
                placeholder="Search guests, rooms..."
                sx={{ width: { sm: 200, md: 250 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            )}
            
            <IconButton onClick={() => setShowLanguageSelector(true)}>
              <Language />
            </IconButton>
            
            <IconButton>
              <Badge badgeContent={4} color="error">
                <Notifications />
              </Badge>
            </IconButton>
            
            {!isMobile && (
              <>
                <IconButton>
                  <Settings />
                </IconButton>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Rating value={4.8} precision={0.1} size="small" readOnly />
                  <Typography variant="body2" fontWeight="medium" sx={{ display: { xs: 'none', lg: 'block' } }}>
                    4.8 Rating
                  </Typography>
                </Box>
              </>
            )}
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
            width: isDesktop ? `calc(100% - ${aiPanelWidth}px)` : '100%',
            p: { xs: 1, sm: 2, md: 3 }
          }}
        >
          {/* Dashboard Stats */}
          <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: { xs: 3, md: 4 } }}>
            <Grid item xs={6} sm={6} md={3}>
              <StatsCard>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" variant="body2" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                        Total Rooms
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
                        156
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: { xs: 32, md: 40 }, height: { xs: 32, md: 40 } }}>
                      <People sx={{ fontSize: { xs: 16, md: 20 } }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </StatsCard>
            </Grid>
            
            <Grid item xs={6} sm={6} md={3}>
              <StatsCard>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" variant="body2" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                        Occupied
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="success.main" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
                        124
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'success.light', color: 'success.main', width: { xs: 32, md: 40 }, height: { xs: 32, md: 40 } }}>
                      <CalendarToday sx={{ fontSize: { xs: 16, md: 20 } }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </StatsCard>
            </Grid>
            
            <Grid item xs={6} sm={6} md={3}>
              <StatsCard>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" variant="body2" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                        Available
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
                        28
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: { xs: 32, md: 40 }, height: { xs: 32, md: 40 } }}>
                      <LocationOn sx={{ fontSize: { xs: 16, md: 20 } }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </StatsCard>
            </Grid>
            
            <Grid item xs={6} sm={6} md={3}>
              <StatsCard>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" variant="body2" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                        Maintenance
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="warning.main" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
                        4
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.main', width: { xs: 32, md: 40 }, height: { xs: 32, md: 40 } }}>
                      <Settings sx={{ fontSize: { xs: 16, md: 20 } }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </StatsCard>
            </Grid>
          </Grid>

          {/* Quick Actions */}
          <Paper sx={{ p: { xs: 2, md: 3 }, mb: { xs: 3, md: 4 } }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={6} md={3}>
                <ActionButton
                  variant="contained"
                  fullWidth
                  startIcon={<CalendarToday />}
                  onClick={() => setShowReservationModal(true)}
                  sx={{ fontSize: { xs: '0.75rem', md: '1rem' } }}
                >
                  {isMobile ? 'Reserve' : 'New Reservation'}
                </ActionButton>
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <ActionButton
                  variant="contained"
                  color="success"
                  fullWidth
                  startIcon={<People />}
                  onClick={() => setShowCheckInModal(true)}
                  sx={{ fontSize: { xs: '0.75rem', md: '1rem' } }}
                >
                  Check In
                </ActionButton>
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <ActionButton
                  variant="contained"
                  color="warning"
                  fullWidth
                  startIcon={<CreditCard />}
                  onClick={() => setShowCheckOutModal(true)}
                  sx={{ fontSize: { xs: '0.75rem', md: '1rem' } }}
                >
                  Check Out
                </ActionButton>
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <ActionButton
                  variant="contained"
                  color="secondary"
                  fullWidth
                  startIcon={<Search />}
                  onClick={() => setShowRoomAvailabilityModal(true)}
                  sx={{ fontSize: { xs: '0.75rem', md: '1rem' } }}
                >
                  {isMobile ? 'Rooms' : 'Room Status'}
                </ActionButton>
              </Grid>
            </Grid>
          </Paper>

          {/* Room Management */}
          <Paper sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">
                Room Management
              </Typography>
              <Button color="primary" size={isMobile ? 'small' : 'medium'}>
                View All Rooms
              </Button>
            </Box>
            
            <Grid container spacing={{ xs: 2, md: 3 }}>
              {accommodations.map((room, index) => (
                <Grid item xs={12} sm={6} lg={6} xl={4} key={index}>
                  <RoomCard>
                    <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flex: 1, mr: 1 }}>
                          <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
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
                      
                      <Typography variant="h4" color="primary.main" fontWeight="bold" sx={{ mb: 1, fontSize: { xs: '1.5rem', md: '2rem' } }}>
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
                          {room.amenities.slice(0, isMobile ? 2 : 3).map((amenity, i) => (
                            <Chip
                              key={i}
                              label={amenity}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                          ))}
                          {room.amenities.length > (isMobile ? 2 : 3) && (
                            <Chip
                              label={`+${room.amenities.length - (isMobile ? 2 : 3)}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          fullWidth
                        >
                          Details
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

        {/* Resizer - Desktop Only */}
        {isDesktop && (
          <ResizeHandle onMouseDown={handleMouseDown}>
            <Box className="resize-indicator">
              <Box sx={{ width: 2, height: 20, bgcolor: 'grey.400' }} />
              <Box sx={{ width: 2, height: 20, bgcolor: 'grey.400' }} />
            </Box>
          </ResizeHandle>
        )}

        {/* Right Side - AI Assistant - Desktop Only */}
        {isDesktop && (
          <Box 
            sx={{ 
              width: `${aiPanelWidth}px`,
              minWidth: 300,
              maxHeight: '100vh',
              bgcolor: 'background.paper',
              borderLeft: 1,
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
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
                    {getLanguageInfo().name} • Powered by Gemini AI
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            <Box sx={{ 
              flex: 1, 
              overflow: 'hidden',
              maxHeight: 'calc(100vh - 120px)'
            }}>
              <AIChatbot 
                onOpenModal={handleOpenModal}
                context={`hotel_general_${currentLanguage}`}
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* Mobile Chat FAB */}
      {!isDesktop && (
        <ChatFab
          color="primary"
          onClick={() => setChatDrawerOpen(true)}
        >
          <Chat />
        </ChatFab>
      )}

      {/* Mobile Drawer */}
      {renderMobileDrawer()}

      {/* Chat Drawer for Mobile/Tablet */}
      {renderChatDrawer()}

      {/* Language Selector Modal */}
      {showLanguageSelector && (
        <LanguageSelector
          currentLanguage={currentLanguage}
          onLanguageSelect={handleLanguageChange}
          onClose={() => setShowLanguageSelector(false)}
        />
      )}

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