interface Room {
  number: string;
  floor: number;
  type: string;
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning';
  keyCards: number;
  amenities: string[];
  lastCleaned: string;
  maintenanceNotes?: string;
}

interface RoomAssignment {
  roomNumber: string;
  floor: number;
  roomType: string;
  keyCards: number;
  amenities: string[];
  checkInTime: string;
  checkOutTime: string;
  assignedAt: string;
  guestPreferences?: string[];
}

interface AssignmentPreferences {
  floorPreference?: 'low' | 'high' | 'middle';
  viewPreference?: 'ocean' | 'garden' | 'city';
  proximityToElevator?: 'near' | 'far';
  quietRoom?: boolean;
  accessibleRoom?: boolean;
  connectingRooms?: boolean;
  numberOfRooms?: number;
}

class RoomAssignmentService {
  private static instance: RoomAssignmentService;
  private rooms: Room[] = [];

  public static getInstance(): RoomAssignmentService {
    if (!RoomAssignmentService.instance) {
      RoomAssignmentService.instance = new RoomAssignmentService();
    }
    return RoomAssignmentService.instance;
  }

  constructor() {
    this.initializeRooms();
  }

  private initializeRooms() {
    // Initialize hotel room inventory
    this.rooms = [
      // Floor 1 - Standard Double Rooms
      { number: '101', floor: 1, type: 'Standard Double Room', status: 'available', keyCards: 2, amenities: ['City View', 'Double Bed', 'Work Desk', 'WiFi'], lastCleaned: '2024-01-15T10:00:00Z' },
      { number: '102', floor: 1, type: 'Standard Double Room', status: 'occupied', keyCards: 2, amenities: ['City View', 'Double Bed', 'Work Desk', 'WiFi'], lastCleaned: '2024-01-14T10:00:00Z' },
      { number: '103', floor: 1, type: 'Standard Double Room', status: 'available', keyCards: 2, amenities: ['City View', 'Double Bed', 'Work Desk', 'WiFi'], lastCleaned: '2024-01-15T11:00:00Z' },
      { number: '104', floor: 1, type: 'Standard Double Room', status: 'cleaning', keyCards: 2, amenities: ['City View', 'Double Bed', 'Work Desk', 'WiFi'], lastCleaned: '2024-01-15T09:00:00Z' },

      // Floor 2 - Deluxe Garden Rooms
      { number: '201', floor: 2, type: 'Deluxe Garden Room', status: 'available', keyCards: 2, amenities: ['Garden View', 'Queen Bed', 'Work Desk', 'Coffee Maker', 'WiFi'], lastCleaned: '2024-01-15T10:30:00Z' },
      { number: '202', floor: 2, type: 'Deluxe Garden Room', status: 'available', keyCards: 2, amenities: ['Garden View', 'Queen Bed', 'Work Desk', 'Coffee Maker', 'WiFi'], lastCleaned: '2024-01-15T11:30:00Z' },
      { number: '203', floor: 2, type: 'Deluxe Garden Room', status: 'occupied', keyCards: 2, amenities: ['Garden View', 'Queen Bed', 'Work Desk', 'Coffee Maker', 'WiFi'], lastCleaned: '2024-01-14T10:30:00Z' },

      // Floor 3 - Deluxe Garden Rooms
      { number: '301', floor: 3, type: 'Deluxe Garden Room', status: 'available', keyCards: 2, amenities: ['Garden View', 'Queen Bed', 'Work Desk', 'Coffee Maker', 'WiFi'], lastCleaned: '2024-01-15T12:00:00Z' },
      { number: '302', floor: 3, type: 'Deluxe Garden Room', status: 'maintenance', keyCards: 2, amenities: ['Garden View', 'Queen Bed', 'Work Desk', 'Coffee Maker', 'WiFi'], lastCleaned: '2024-01-14T12:00:00Z', maintenanceNotes: 'AC repair scheduled' },

      // Floor 4 - Luxury Spa Suites
      { number: '401', floor: 4, type: 'Luxury Spa Suite', status: 'available', keyCards: 2, amenities: ['Ocean View', 'Private Spa', 'Balcony', 'Kitchenette', 'WiFi', 'Massage Chair'], lastCleaned: '2024-01-15T13:00:00Z' },
      { number: '402', floor: 4, type: 'Luxury Spa Suite', status: 'available', keyCards: 2, amenities: ['Ocean View', 'Private Spa', 'Balcony', 'Kitchenette', 'WiFi', 'Massage Chair'], lastCleaned: '2024-01-15T14:00:00Z' },

      // Floor 5 - Ocean View King Suites
      { number: '501', floor: 5, type: 'Ocean View King Suite', status: 'available', keyCards: 2, amenities: ['Ocean View', 'King Bed', 'Balcony', 'Mini Bar', 'WiFi', 'Room Service'], lastCleaned: '2024-01-15T15:00:00Z' },
      { number: '502', floor: 5, type: 'Ocean View King Suite', status: 'available', keyCards: 2, amenities: ['Ocean View', 'King Bed', 'Balcony', 'Mini Bar', 'WiFi', 'Room Service'], lastCleaned: '2024-01-15T16:00:00Z' },
      { number: '503', floor: 5, type: 'Ocean View King Suite', status: 'occupied', keyCards: 2, amenities: ['Ocean View', 'King Bed', 'Balcony', 'Mini Bar', 'WiFi', 'Room Service'], lastCleaned: '2024-01-14T15:00:00Z' },

      // Floor 6 - Ocean View King Suites
      { number: '601', floor: 6, type: 'Ocean View King Suite', status: 'available', keyCards: 2, amenities: ['Ocean View', 'King Bed', 'Balcony', 'Mini Bar', 'WiFi', 'Room Service'], lastCleaned: '2024-01-15T17:00:00Z' },
      { number: '602', floor: 6, type: 'Ocean View King Suite', status: 'available', keyCards: 2, amenities: ['Ocean View', 'King Bed', 'Balcony', 'Mini Bar', 'WiFi', 'Room Service'], lastCleaned: '2024-01-15T18:00:00Z' },

      // Floor 7 - Family Oceanfront Suites
      { number: '701', floor: 7, type: 'Family Oceanfront Suite', status: 'available', keyCards: 3, amenities: ['Ocean View', '2 Queen Beds', 'Living Area', 'Kitchenette', 'WiFi', 'Balcony'], lastCleaned: '2024-01-15T19:00:00Z' },
      { number: '702', floor: 7, type: 'Family Oceanfront Suite', status: 'available', keyCards: 3, amenities: ['Ocean View', '2 Queen Beds', 'Living Area', 'Kitchenette', 'WiFi', 'Balcony'], lastCleaned: '2024-01-15T20:00:00Z' },

      // Floor 8 - Presidential Suite
      { number: '801', floor: 8, type: 'Presidential Suite', status: 'available', keyCards: 4, amenities: ['Panoramic View', 'King Bed', 'Private Terrace', 'Butler Service', 'WiFi', 'Jacuzzi'], lastCleaned: '2024-01-15T21:00:00Z' }
    ];
  }

  // Assign room based on type and preferences
  public assignRoom(
    roomType: string, 
    preferences: AssignmentPreferences = {}
  ): RoomAssignment | null {
    const availableRooms = this.getAvailableRoomsByType(roomType);
    
    if (availableRooms.length === 0) {
      return null;
    }

    // Score rooms based on preferences
    const scoredRooms = availableRooms.map(room => ({
      room,
      score: this.calculateRoomScore(room, preferences)
    }));

    // Sort by score (highest first)
    scoredRooms.sort((a, b) => b.score - a.score);
    
    const selectedRoom = scoredRooms[0].room;
    
    // Mark room as occupied
    selectedRoom.status = 'occupied';
    
    // Create assignment
    const assignment: RoomAssignment = {
      roomNumber: selectedRoom.number,
      floor: selectedRoom.floor,
      roomType: selectedRoom.type,
      keyCards: selectedRoom.keyCards,
      amenities: selectedRoom.amenities,
      checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      checkOutTime: 'Flexible',
      assignedAt: new Date().toISOString(),
      guestPreferences: this.formatPreferences(preferences)
    };

    return assignment;
  }

  private getAvailableRoomsByType(roomType: string): Room[] {
    return this.rooms.filter(room => 
      room.type === roomType && room.status === 'available'
    );
  }

  private calculateRoomScore(room: Room, preferences: AssignmentPreferences): number {
    let score = 100; // Base score

    // Floor preference
    if (preferences.floorPreference) {
      switch (preferences.floorPreference) {
        case 'low':
          score += (10 - room.floor) * 5; // Lower floors get higher score
          break;
        case 'high':
          score += room.floor * 5; // Higher floors get higher score
          break;
        case 'middle':
          const middleFloor = 4;
          score += (10 - Math.abs(room.floor - middleFloor)) * 3;
          break;
      }
    }

    // View preference
    if (preferences.viewPreference) {
      const hasPreferredView = room.amenities.some(amenity => 
        amenity.toLowerCase().includes(preferences.viewPreference!)
      );
      if (hasPreferredView) {
        score += 20;
      }
    }

    // Proximity to elevator (rooms ending in 01, 02 are closer)
    if (preferences.proximityToElevator) {
      const roomNumber = parseInt(room.number.slice(-2));
      if (preferences.proximityToElevator === 'near' && roomNumber <= 2) {
        score += 10;
      } else if (preferences.proximityToElevator === 'far' && roomNumber > 2) {
        score += 10;
      }
    }

    // Quiet room preference (higher floors are typically quieter)
    if (preferences.quietRoom && room.floor > 3) {
      score += 15;
    }

    // Recently cleaned rooms get bonus points
    const lastCleaned = new Date(room.lastCleaned);
    const hoursSinceCleaned = (Date.now() - lastCleaned.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCleaned < 6) {
      score += 10;
    }

    return score;
  }

  private formatPreferences(preferences: AssignmentPreferences): string[] {
    const formatted: string[] = [];
    
    if (preferences.floorPreference) {
      formatted.push(`${preferences.floorPreference} floor preference`);
    }
    if (preferences.viewPreference) {
      formatted.push(`${preferences.viewPreference} view preference`);
    }
    if (preferences.quietRoom) {
      formatted.push('quiet room requested');
    }
    if (preferences.accessibleRoom) {
      formatted.push('accessible room required');
    }
    if (preferences.connectingRooms) {
      formatted.push('connecting rooms requested');
    }

    return formatted;
  }

  // Get room availability by type
  public getRoomAvailability(): Record<string, { available: number; total: number; occupied: number }> {
    const availability: Record<string, { available: number; total: number; occupied: number }> = {};

    this.rooms.forEach(room => {
      if (!availability[room.type]) {
        availability[room.type] = { available: 0, total: 0, occupied: 0 };
      }
      
      availability[room.type].total++;
      
      if (room.status === 'available') {
        availability[room.type].available++;
      } else if (room.status === 'occupied') {
        availability[room.type].occupied++;
      }
    });

    return availability;
  }

  // Get room details by number
  public getRoomDetails(roomNumber: string): Room | null {
    return this.rooms.find(room => room.number === roomNumber) || null;
  }

  // Update room status
  public updateRoomStatus(roomNumber: string, status: Room['status']): boolean {
    const room = this.rooms.find(r => r.number === roomNumber);
    if (room) {
      room.status = status;
      if (status === 'available') {
        room.lastCleaned = new Date().toISOString();
      }
      return true;
    }
    return false;
  }

  // Get rooms by floor
  public getRoomsByFloor(floor: number): Room[] {
    return this.rooms.filter(room => room.floor === floor);
  }

  // Get maintenance rooms
  public getMaintenanceRooms(): Room[] {
    return this.rooms.filter(room => room.status === 'maintenance');
  }

  // Check room availability for specific dates
  public checkAvailability(
    roomType: string, 
    checkIn: Date, 
    checkOut: Date
  ): { available: boolean; rooms: Room[] } {
    // In a real system, this would check against booking database
    const availableRooms = this.getAvailableRoomsByType(roomType);
    
    return {
      available: availableRooms.length > 0,
      rooms: availableRooms
    };
  }

  // Get room recommendations based on guest profile
  public getRecommendations(
    guestProfile: {
      previousStays?: string[];
      preferences?: AssignmentPreferences;
      vipStatus?: boolean;
      specialRequests?: string[];
    }
  ): Room[] {
    let recommendations = this.rooms.filter(room => room.status === 'available');

    // VIP guests get premium rooms
    if (guestProfile.vipStatus) {
      recommendations = recommendations.filter(room => 
        room.type.includes('Suite') || room.floor > 5
      );
    }

    // Consider previous stays
    if (guestProfile.previousStays && guestProfile.previousStays.length > 0) {
      const preferredTypes = [...new Set(guestProfile.previousStays)];
      recommendations = recommendations.filter(room =>
        preferredTypes.includes(room.type)
      );
    }

    // Apply preferences
    if (guestProfile.preferences) {
      recommendations = recommendations.map(room => ({
        ...room,
        score: this.calculateRoomScore(room, guestProfile.preferences!)
      })).sort((a, b) => (b as any).score - (a as any).score);
    }

    return recommendations.slice(0, 3); // Return top 3 recommendations
  }
}

export const roomAssignmentService = RoomAssignmentService.getInstance();
export type { Room, RoomAssignment, AssignmentPreferences };