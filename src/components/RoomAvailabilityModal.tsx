import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid2 as Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Paper,
  Tooltip,
  useTheme,
  useMediaQuery,
  Avatar
} from '@mui/material';
import {
  Close,
  Hotel,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';
import { DayAvailability, RoomAvailabilityInfo, VoiceProcessedData } from '../types/reservation';

interface RoomAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  availabilityData?: VoiceProcessedData;
  onBookRoom?: (roomData: VoiceProcessedData) => void;
}

const RoomAvailabilityModal: React.FC<RoomAvailabilityModalProps> = ({ 
  isOpen, 
  onClose,
  availabilityData = {},
  onBookRoom
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [calendarData, setCalendarData] = useState<DayAvailability[]>([]);

  const availableRooms = [
    {
      id: 'ocean-view-king',
      name: 'Ocean View King Suite',
      basePrice: 299,
      description: 'Luxurious suite with panoramic ocean views',
      amenities: ['Ocean View', 'King Bed', 'Balcony', 'Mini Bar', 'WiFi'],
      baseAvailable: 3
    },
    {
      id: 'deluxe-garden',
      name: 'Deluxe Garden Room',
      basePrice: 199,
      description: 'Comfortable room overlooking beautiful gardens',
      amenities: ['Garden View', 'Queen Bed', 'Work Desk', 'Coffee Maker', 'WiFi'],
      baseAvailable: 5
    },
    {
      id: 'family-oceanfront',
      name: 'Family Oceanfront Suite',
      basePrice: 399,
      description: 'Spacious suite perfect for families',
      amenities: ['Ocean View', '2 Queen Beds', 'Living Area', 'Kitchenette', 'WiFi'],
      baseAvailable: 2
    },
    {
      id: 'presidential',
      name: 'Presidential Suite',
      basePrice: 599,
      description: 'Ultimate luxury with premium amenities',
      amenities: ['Panoramic View', 'King Bed', 'Private Terrace', 'Butler Service', 'WiFi'],
      baseAvailable: 1
    },
    {
      id: 'standard-double',
      name: 'Standard Double Room',
      basePrice: 149,
      description: 'Comfortable standard accommodation',
      amenities: ['City View', 'Double Bed', 'Work Desk', 'WiFi'],
      baseAvailable: 4
    },
    {
      id: 'luxury-spa',
      name: 'Luxury Spa Suite',
      basePrice: 449,
      description: 'Relaxation suite with spa amenities',
      amenities: ['Ocean View', 'Private Spa', 'Balcony', 'Kitchenette', 'WiFi'],
      baseAvailable: 1
    }
  ];

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
      
      const rooms: Record<string, RoomAvailabilityInfo> = {};
      
      availableRooms.forEach(room => {
        const baseAvailable = room.baseAvailable;
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
        let price = room.basePrice;
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

  const getAvailabilityColor = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (percentage === 0) return 'error.main';
    if (percentage <= 25) return 'warning.main';
    if (percentage <= 50) return 'info.main';
    return 'success.main';
  };

  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date);
  };

  const handlePrevMonth = () => {
    setSelectedMonth(prev => prev.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setSelectedMonth(prev => prev.add(1, 'month'));
  };

  const getSelectedDateRooms = () => {
    if (!selectedDate) return [];
    
    const dateStr = selectedDate.format('YYYY-MM-DD');
    const dayData = calendarData.find(d => d.date === dateStr);
    
    if (!dayData) return [];
    
    return availableRooms.map(room => {
      const roomData = dayData.rooms[room.name];
      return {
        ...room,
        available: roomData?.available || 0,
        price: roomData?.price || room.basePrice,
        status: roomData?.available > 0 ? 'Available' : 'Fully Booked'
      };
    });
  };

  const handleBookRoom = (room: RoomTypeWithAvailability): void => {
    if (onBookRoom) {
      onBookRoom({
        checkIn: selectedDate?.format('YYYY-MM-DD'),
        roomType: room.name,
      });
    }
    onClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'success';
      case 'Fully Booked': return 'error';
      case 'Limited': return 'warning';
      default: return 'default';
    }
  };

  const renderCalendar = () => {
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
      <Paper sx={{ p: 2, height: 'fit-content' }}>
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
              const isSelected = selectedDate && day.isSame(selectedDate, 'day');
              
              const totalAvailable = dayData ? Object.values(dayData.rooms).reduce((sum, room) => sum + room.available, 0) : 0;
              const totalRooms = dayData ? Object.values(dayData.rooms).reduce((sum, room) => sum + room.total, 0) : 0;
              
              return (
                <Grid item xs key={day.format('YYYY-MM-DD')}>
                  <Tooltip
                    title={
                      dayData && isCurrentMonth ? (
                        <Box>
                          <Typography variant="caption" fontWeight="bold">
                            {day.format('MMM DD, YYYY')}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                            {totalAvailable}/{totalRooms} rooms available
                          </Typography>
                        </Box>
                      ) : ''
                    }
                    arrow
                  >
                    <Card
                      sx={{
                        minHeight: { xs: 40, md: 50 },
                        cursor: isCurrentMonth && !isPast ? 'pointer' : 'default',
                        opacity: isCurrentMonth ? 1 : 0.3,
                        bgcolor: isSelected ? 'primary.main' : isToday ? 'primary.light' : 'background.paper',
                        border: isSelected ? 2 : isToday ? 2 : 1,
                        borderColor: isSelected ? 'primary.main' : isToday ? 'primary.main' : 'divider',
                        color: isSelected ? 'primary.contrastText' : 'text.primary',
                        '&:hover': isCurrentMonth && !isPast ? {
                          boxShadow: 2,
                          transform: 'translateY(-1px)'
                        } : {}
                      }}
                      onClick={() => {
                        if (isCurrentMonth && !isPast) {
                          handleDateSelect(day);
                        }
                      }}
                    >
                      <CardContent sx={{ p: { xs: 0.5, md: 1 }, '&:last-child': { pb: { xs: 0.5, md: 1 } } }}>
                        <Typography 
                          variant="body2" 
                          fontWeight={isToday || isSelected ? 'bold' : 'normal'}
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
                            <Box
                              sx={{
                                width: { xs: 8, md: 12 },
                                height: { xs: 8, md: 12 },
                                borderRadius: '50%',
                                bgcolor: getAvailabilityColor(totalAvailable, totalRooms)
                              }}
                            />
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
        
        {/* Legend */}
        <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" fontWeight="bold" gutterBottom sx={{ display: 'block' }}>
            Availability:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
              <Typography variant="caption">High</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'info.main' }} />
              <Typography variant="caption">Medium</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
              <Typography variant="caption">Limited</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
              <Typography variant="caption">Full</Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    );
  };

  const renderRoomAvailability = () => {
    const rooms = getSelectedDateRooms();
    
    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Hotel color="primary" />
          Rooms for {selectedDate?.format('MMM DD, YYYY')}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {rooms.filter(r => r.available > 0).length} of {rooms.length} room types available
        </Typography>
        
        <Grid container spacing={2}>
          {rooms.map((room) => (
            <Grid item xs={12} key={room.id}>
              <Card
                sx={{
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
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1rem' }}>
                        {room.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {room.description}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right', ml: 2 }}>
                      <Typography variant="h5" color="primary.main" fontWeight="bold" sx={{ fontSize: '1.25rem' }}>
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
                    size="small"
                  >
                    {room.available > 0 ? 'Book This Room' : 'Fully Booked'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="xl" fullWidth fullScreen={isMobile}>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Hotel color="primary" />
            Room Availability
          </Typography>
          
          {/* Month Navigation */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={handlePrevMonth} size="small">
              <ChevronLeft />
            </IconButton>
            <Typography variant="h6" fontWeight="bold" sx={{ minWidth: 150, textAlign: 'center' }}>
              {selectedMonth.format('MMMM YYYY')}
            </Typography>
            <IconButton onClick={handleNextMonth} size="small">
              <ChevronRight />
            </IconButton>
          </Box>
          
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 1, md: 3 } }}>
        <Grid container spacing={3}>
          {/* Left Side - Calendar */}
          <Grid item xs={12} md={5}>
            {renderCalendar()}
          </Grid>
          
          {/* Right Side - Room Availability */}
          <Grid item xs={12} md={7}>
            {selectedDate ? (
              renderRoomAvailability()
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Avatar sx={{ bgcolor: 'primary.light', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                  <Hotel sx={{ fontSize: 32 }} />
                </Avatar>
                <Typography variant="h6" color="text.secondary">
                  Select a date to view room availability
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoomAvailabilityModal;