import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close,
  Hotel,
  CalendarToday,
  People,
  CheckCircle,
  Cancel,
  ViewModule,
  CalendarMonth
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import VoiceInput from './VoiceInput';
import type { ProcessedVoiceResponse } from '../store/api/geminiApi';

interface DayAvailability {
  date: string;
  rooms: {
    [roomType: string]: {
      available: number;
      total: number;
      price: number;
    };
  };
}

interface RoomAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  availabilityData?: {
    checkInDate?: string;
    checkOutDate?: string;
    adults?: number;
    children?: number;
    roomType?: string;
  };
  onBookRoom?: (roomData: any) => void;
}

const RoomAvailabilityModal: React.FC<RoomAvailabilityModalProps> = ({ 
  isOpen, 
  onClose,
  availabilityData = {},
  onBookRoom
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [viewMode, setViewMode] = useState<'search' | 'calendar'>('search');
  const [searchData, setSearchData] = useState({
    checkInDate: availabilityData.checkInDate ? dayjs(availabilityData.checkInDate) : null,
    checkOutDate: availabilityData.checkOutDate ? dayjs(availabilityData.checkOutDate) : null,
    adults: availabilityData.adults || 1,
    children: availabilityData.children || 0,
    roomType: availabilityData.roomType || ''
  });
  const [voiceFilledFields, setVoiceFilledFields] = useState<Set<string>>(new Set());
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [calendarData, setCalendarData] = useState<DayAvailability[]>([]);

  const availableRooms = [
    {
      id: 'ocean-view-king',
      name: 'Ocean View King Suite',
      price: 299,
      available: 3,
      description: 'Luxurious suite with panoramic ocean views',
      amenities: ['Ocean View', 'King Bed', 'Balcony', 'Mini Bar', 'WiFi'],
      status: 'Available'
    },
    {
      id: 'deluxe-garden',
      name: 'Deluxe Garden Room',
      price: 199,
      available: 5,
      description: 'Comfortable room overlooking beautiful gardens',
      amenities: ['Garden View', 'Queen Bed', 'Work Desk', 'Coffee Maker', 'WiFi'],
      status: 'Available'
    },
    {
      id: 'family-oceanfront',
      name: 'Family Oceanfront Suite',
      price: 399,
      available: 2,
      description: 'Spacious suite perfect for families',
      amenities: ['Ocean View', '2 Queen Beds', 'Living Area', 'Kitchenette', 'WiFi'],
      status: 'Available'
    },
    {
      id: 'presidential',
      name: 'Presidential Suite',
      price: 599,
      available: 1,
      description: 'Ultimate luxury with premium amenities',
      amenities: ['Panoramic View', 'King Bed', 'Private Terrace', 'Butler Service', 'WiFi'],
      status: 'Available'
    },
    {
      id: 'standard-double',
      name: 'Standard Double Room',
      price: 149,
      available: 0,
      description: 'Comfortable standard accommodation',
      amenities: ['City View', 'Double Bed', 'Work Desk', 'WiFi'],
      status: 'Fully Booked'
    },
    {
      id: 'luxury-spa',
      name: 'Luxury Spa Suite',
      price: 449,
      available: 1,
      description: 'Relaxation suite with spa amenities',
      amenities: ['Ocean View', 'Private Spa', 'Balcony', 'Kitchenette', 'WiFi'],
      status: 'Available'
    }
  ];

  useEffect(() => {
    setSearchData(prev => ({
      ...prev,
      ...availabilityData
    }));
    
    // Generate calendar data for the current month
    generateCalendarData(selectedMonth);
  }, [availabilityData]);

  useEffect(() => {
    generateCalendarData(selectedMonth);
  }, [selectedMonth]);

  const generateCalendarData = (month: dayjs.Dayjs) => {
    const startOfMonth = month.startOf('month');
    const endOfMonth = month.endOf('month');
    const daysInMonth = endOfMonth.diff(startOfMonth, 'day') + 1;
    
    const data: DayAvailability[] = [];
    
    for (let i = 0; i < daysInMonth; i++) {
      const currentDate = startOfMonth.add(i, 'day');
      const dateStr = currentDate.format('YYYY-MM-DD');
      
      // Generate mock availability data with some variation
      const dayOfWeek = currentDate.day();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = Math.random() < 0.1; // 10% chance of being a holiday
      
      const rooms: { [key: string]: { available: number; total: number; price: number } } = {};
      
      availableRooms.forEach(room => {
        const baseAvailable = room.available;
        const total = baseAvailable + Math.floor(Math.random() * 3) + 2; // Total rooms
        
        let available = baseAvailable;
        
        // Reduce availability on weekends and holidays
        if (isWeekend) {
          available = Math.max(0, available - Math.floor(Math.random() * 2));
        }
        if (isHoliday) {
          available = Math.max(0, available - Math.floor(Math.random() * 3));
        }
        
        // Increase prices on weekends and holidays
        let price = room.price;
        if (isWeekend) price = Math.round(price * 1.2);
        if (isHoliday) price = Math.round(price * 1.5);
        
        rooms[room.name] = {
          available,
          total,
          price
        };
      });
      
      data.push({
        date: dateStr,
        rooms
      });
    }
    
    setCalendarData(data);
  };
  const handleVoiceProcessed = (result: any) => {
    const voiceResult = result as ProcessedVoiceResponse;
    
    if (voiceResult.extractedData) {
      const updates: any = {};
      const newVoiceFields = new Set(voiceFilledFields);
      
      if (voiceResult.extractedData.checkIn) {
        updates.checkInDate = dayjs(voiceResult.extractedData.checkIn);
        newVoiceFields.add('checkInDate');
      }
      if (voiceResult.extractedData.checkOut) {
        updates.checkOutDate = dayjs(voiceResult.extractedData.checkOut);
        newVoiceFields.add('checkOutDate');
      }
      if (voiceResult.extractedData.adults) {
        updates.adults = voiceResult.extractedData.adults;
        newVoiceFields.add('adults');
      }
      if (voiceResult.extractedData.children !== undefined) {
        updates.children = voiceResult.extractedData.children;
        newVoiceFields.add('children');
      }
      if (voiceResult.extractedData.roomType) {
        updates.roomType = voiceResult.extractedData.roomType;
        newVoiceFields.add('roomType');
      }
      
      if (Object.keys(updates).length > 0) {
        setSearchData(prev => ({ ...prev, ...updates }));
        setVoiceFilledFields(newVoiceFields);
      }
    }
  };

  const isVoiceFilled = (field: string) => voiceFilledFields.has(field);

  const getFieldSx = (field: string) => ({
    '& .MuiOutlinedInput-root': {
      backgroundColor: isVoiceFilled(field) ? 'success.light' : 'background.paper',
      '& fieldset': {
        borderColor: isVoiceFilled(field) ? 'success.main' : undefined,
      },
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'success';
      case 'Fully Booked': return 'error';
      case 'Limited': return 'warning';
      default: return 'default';
    }
  };

  const handleBookRoom = (room: any) => {
    if (onBookRoom) {
      onBookRoom({
        ...searchData,
        roomType: room.name,
        roomPrice: room.price
      });
    }
    onClose();
  };

  const getAvailabilityColor = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (percentage === 0) return 'error.main';
    if (percentage <= 25) return 'warning.main';
    if (percentage <= 50) return 'info.main';
    return 'success.main';
  };

  const getDayAvailabilityStatus = (dayData: DayAvailability) => {
    const totalAvailable = Object.values(dayData.rooms).reduce((sum, room) => sum + room.available, 0);
    const totalRooms = Object.values(dayData.rooms).reduce((sum, room) => sum + room.total, 0);
    
    if (totalAvailable === 0) return { status: 'Fully Booked', color: 'error' };
    if (totalAvailable <= totalRooms * 0.25) return { status: 'Limited', color: 'warning' };
    return { status: 'Available', color: 'success' };
  };

  const renderCalendarView = () => {
    const startOfMonth = selectedMonth.startOf('month');
    const endOfMonth = selectedMonth.endOf('month');
    const startOfCalendar = startOfMonth.startOf('week');
    const endOfCalendar = endOfMonth.endOf('week');
    
    const calendarDays = [];
    let currentDay = startOfCalendar;
    
    while (currentDay.isBefore(endOfCalendar) || currentDay.isSame(endOfCalendar, 'day')) {
      calendarDays.push(currentDay);
      currentDay = currentDay.add(1, 'day');
    }
    
    const weeks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }
    
    return (
      <Box sx={{ mt: 2 }}>
        {/* Month Navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Button
            onClick={() => setSelectedMonth(prev => prev.subtract(1, 'month'))}
            variant="outlined"
            size="small"
          >
            Previous
          </Button>
          <Typography variant="h6" fontWeight="bold">
            {selectedMonth.format('MMMM YYYY')}
          </Typography>
          <Button
            onClick={() => setSelectedMonth(prev => prev.add(1, 'month'))}
            variant="outlined"
            size="small"
          >
            Next
          </Button>
        </Box>
        
        {/* Calendar Grid */}
        <Paper sx={{ p: 2, mb: 3 }}>
          {/* Day Headers */}
          <Grid container spacing={1} sx={{ mb: 1 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Grid item xs key={day}>
                <Typography variant="caption" fontWeight="bold" sx={{ display: 'block', textAlign: 'center' }}>
                  {day}
                </Typography>
              </Grid>
            ))}
          </Grid>
          
          {/* Calendar Days */}
          {weeks.map((week, weekIndex) => (
            <Grid container spacing={1} key={weekIndex} sx={{ mb: 1 }}>
              {week.map((day) => {
                const dayData = calendarData.find(d => d.date === day.format('YYYY-MM-DD'));
                const isCurrentMonth = day.month() === selectedMonth.month();
                const isToday = day.isSame(dayjs(), 'day');
                const isPast = day.isBefore(dayjs(), 'day');
                
                const availabilityStatus = dayData ? getDayAvailabilityStatus(dayData) : null;
                
                return (
                  <Grid item xs key={day.format('YYYY-MM-DD')}>
                    <Tooltip
                      title={
                        dayData && isCurrentMonth ? (
                          <Box>
                            <Typography variant="caption" fontWeight="bold">
                              {day.format('MMM DD, YYYY')}
                            </Typography>
                            {Object.entries(dayData.rooms).map(([roomType, roomData]) => (
                              <Box key={roomType} sx={{ mt: 0.5 }}>
                                <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                                  {roomType}: {roomData.available}/{roomData.total} (${roomData.price})
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        ) : ''
                      }
                      arrow
                    >
                      <Card
                        sx={{
                          minHeight: { xs: 40, md: 60 },
                          cursor: isCurrentMonth && !isPast ? 'pointer' : 'default',
                          opacity: isCurrentMonth ? 1 : 0.3,
                          bgcolor: isToday ? 'primary.light' : 'background.paper',
                          border: isToday ? 2 : 1,
                          borderColor: isToday ? 'primary.main' : 'divider',
                          '&:hover': isCurrentMonth && !isPast ? {
                            boxShadow: 2,
                            transform: 'translateY(-1px)'
                          } : {}
                        }}
                        onClick={() => {
                          if (isCurrentMonth && !isPast && dayData) {
                            setSearchData(prev => ({
                              ...prev,
                              checkInDate: day,
                              checkOutDate: day.add(1, 'day')
                            }));
                            setViewMode('search');
                          }
                        }}
                      >
                        <CardContent sx={{ p: { xs: 0.5, md: 1 }, '&:last-child': { pb: { xs: 0.5, md: 1 } } }}>
                          <Typography 
                            variant="body2" 
                            fontWeight={isToday ? 'bold' : 'normal'}
                            sx={{ 
                              fontSize: { xs: '0.7rem', md: '0.875rem' },
                              textAlign: 'center',
                              mb: 0.5
                            }}
                          >
                            {day.format('D')}
                          </Typography>
                          
                          {dayData && isCurrentMonth && (
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                              <Badge
                                badgeContent={Object.values(dayData.rooms).reduce((sum, room) => sum + room.available, 0)}
                                color={availabilityStatus?.color as any}
                                sx={{
                                  '& .MuiBadge-badge': {
                                    fontSize: { xs: '0.6rem', md: '0.75rem' },
                                    minWidth: { xs: 16, md: 20 },
                                    height: { xs: 16, md: 20 }
                                  }
                                }}
                              >
                                <Hotel sx={{ fontSize: { xs: 12, md: 16 }, color: getAvailabilityColor(
                                  Object.values(dayData.rooms).reduce((sum, room) => sum + room.available, 0),
                                  Object.values(dayData.rooms).reduce((sum, room) => sum + room.total, 0)
                                ) }} />
                              </Badge>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Tooltip>
                  </Grid>
                );
              })}
            </Grid>
          ))}
        </Paper>
        
        {/* Legend */}
        <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Legend:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Hotel sx={{ color: 'success.main', fontSize: 16 }} />
              <Typography variant="caption">High Availability</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Hotel sx={{ color: 'info.main', fontSize: 16 }} />
              <Typography variant="caption">Medium Availability</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Hotel sx={{ color: 'warning.main', fontSize: 16 }} />
              <Typography variant="caption">Limited Availability</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Hotel sx={{ color: 'error.main', fontSize: 16 }} />
              <Typography variant="caption">Fully Booked</Typography>
            </Box>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Click on any available date to select it for booking. Badge shows total available rooms.
          </Typography>
        </Paper>
      </Box>
    );
  };
  const filteredRooms = availableRooms.filter(room => {
    if (searchData.roomType) {
      return room.name.toLowerCase().includes(searchData.roomType.toLowerCase());
    }
    return true;
  });

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Hotel color="primary" />
            Room Availability
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
        
        {/* View Mode Tabs */}
        <Box sx={{ mt: 2 }}>
          <Tabs 
            value={viewMode} 
            onChange={(_, newValue) => setViewMode(newValue)}
            variant={isMobile ? 'fullWidth' : 'standard'}
          >
            <Tab 
              label="Search Rooms" 
              value="search" 
              icon={<ViewModule />} 
              iconPosition="start"
            />
            <Tab 
              label="Calendar View" 
              value="calendar" 
              icon={<CalendarMonth />} 
              iconPosition="start"
            />
          </Tabs>
        </Box>
      </DialogTitle>

      <DialogContent>
        {viewMode === 'search' ? (
          <>
            {/* Search Criteria */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarToday color="primary" />
                Search Criteria
              </Typography>
              
              {/* Voice Input */}
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <VoiceInput
                  onVoiceProcessed={handleVoiceProcessed}
                  currentStep="availability"
                  reservationData={searchData}
                  size="medium"
                  showTranscript={true}
                />
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Check-in Date"
                      value={searchData.checkInDate}
                      onChange={(newValue) => setSearchData({...searchData, checkInDate: newValue})}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          sx: { '& .MuiOutlinedInput-root': { backgroundColor: isVoiceFilled('checkInDate') ? 'success.light' : 'background.paper', '& fieldset': { borderColor: isVoiceFilled('checkInDate') ? 'success.main' : undefined } } },
                          helperText: isVoiceFilled('checkInDate') ? '✓ Filled by voice' : '',
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Check-out Date"
                      value={searchData.checkOutDate}
                      onChange={(newValue) => setSearchData({...searchData, checkOutDate: newValue})}
                      minDate={searchData.checkInDate ? searchData.checkInDate.add(1, 'day') : undefined}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          sx: { '& .MuiOutlinedInput-root': { backgroundColor: isVoiceFilled('checkOutDate') ? 'success.light' : 'background.paper', '& fieldset': { borderColor: isVoiceFilled('checkOutDate') ? 'success.main' : undefined } } },
                          helperText: isVoiceFilled('checkOutDate') ? '✓ Filled by voice' : '',
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Adults</InputLabel>
                    <Select
                      value={searchData.adults}
                      label="Adults"
                      onChange={(e) => setSearchData({...searchData, adults: Number(e.target.value)})}
                      sx={{ '& .MuiOutlinedInput-root': { backgroundColor: isVoiceFilled('adults') ? 'success.light' : 'background.paper', '& fieldset': { borderColor: isVoiceFilled('adults') ? 'success.main' : undefined } } }}
                    >
                      {[1,2,3,4,5,6].map(num => (
                        <MenuItem key={num} value={num}>{num} Adult{num > 1 ? 's' : ''}</MenuItem>
                      ))}
                    </Select>
                    {isVoiceFilled('adults') && (
                      <Typography variant="caption" color="success.main">
                        ✓ Filled by voice
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Children</InputLabel>
                    <Select
                      value={searchData.children}
                      label="Children"
                      onChange={(e) => setSearchData({...searchData, children: Number(e.target.value)})}
                      sx={{ '& .MuiOutlinedInput-root': { backgroundColor: isVoiceFilled('children') ? 'success.light' : 'background.paper', '& fieldset': { borderColor: isVoiceFilled('children') ? 'success.main' : undefined } } }}
                    >
                      {[0,1,2,3,4].map(num => (
                        <MenuItem key={num} value={num}>{num} {num === 1 ? 'Child' : 'Children'}</MenuItem>
                      ))}
                    </Select>
                    {isVoiceFilled('children') && (
                      <Typography variant="caption" color="success.main">
                        ✓ Filled by voice
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            {/* Available Rooms */}
            <Typography variant="h6" gutterBottom>
              Available Rooms ({filteredRooms.filter(r => r.available > 0).length} available)
            </Typography>
            
            <Grid container spacing={3}>
              {filteredRooms.map((room) => (
                <Grid item xs={12} md={6} key={room.id}>
                  <Card
                    sx={{
                      height: '100%',
                      border: room.available === 0 ? 1 : 0,
                      borderColor: 'error.light',
                      opacity: room.available === 0 ? 0.6 : 1,
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': room.available > 0 ? {
                        transform: 'translateY(-2px)',
                        boxShadow: 4,
                      } : {}
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {room.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {room.description}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="h5" color="primary.main" fontWeight="bold">
                            ${room.price}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            per night
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Chip
                          label={room.status}
                          color={getStatusColor(room.status) as any}
                          size="small"
                          icon={room.available > 0 ? <CheckCircle /> : <Cancel />}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {room.available > 0 ? `${room.available} rooms available` : 'Fully booked'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                          Amenities:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {room.amenities.slice(0, 4).map((amenity, index) => (
                            <Chip
                              key={index}
                              label={amenity}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                          ))}
                        </Box>
                      </Box>
                      
                      <Button
                        variant="contained"
                        fullWidth
                        disabled={room.available === 0}
                        onClick={() => handleBookRoom(room)}
                        sx={{ mt: 1 }}
                      >
                        {room.available > 0 ? 'Book This Room' : 'Fully Booked'}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        ) : (
          renderCalendarView()
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Button onClick={onClose}>
          Close
        </Button>
        {viewMode === 'search' && (
          <Button variant="contained" onClick={() => console.log('Search updated')}>
            Update Search
          </Button>
        )}
        {viewMode === 'calendar' && searchData.checkInDate && (
          <Button 
            variant="contained" 
            onClick={() => setViewMode('search')}
            startIcon={<ViewModule />}
          >
            View Available Rooms
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default RoomAvailabilityModal;