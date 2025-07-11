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
  MenuItem
} from '@mui/material';
import {
  Close,
  Hotel,
  CalendarToday,
  People,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import VoiceInput from './VoiceInput';
import type { ProcessedVoiceResponse } from '../store/api/geminiApi';

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
  const [searchData, setSearchData] = useState({
    checkInDate: availabilityData.checkInDate ? dayjs(availabilityData.checkInDate) : null,
    checkOutDate: availabilityData.checkOutDate ? dayjs(availabilityData.checkOutDate) : null,
    adults: availabilityData.adults || 1,
    children: availabilityData.children || 0,
    roomType: availabilityData.roomType || ''
  });
  const [voiceFilledFields, setVoiceFilledFields] = useState<Set<string>>(new Set());

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
  }, [availabilityData]);

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
      </DialogTitle>

      <DialogContent>
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
                      sx: getFieldSx('checkInDate'),
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
                      sx: getFieldSx('checkOutDate'),
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
                  sx={getFieldSx('adults')}
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
                  sx={getFieldSx('children')}
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
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Button onClick={onClose}>
          Close
        </Button>
        <Button variant="contained" onClick={() => console.log('Search updated')}>
          Update Search
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoomAvailabilityModal;