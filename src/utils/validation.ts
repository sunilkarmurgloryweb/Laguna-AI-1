import moment from "moment";
import { VoiceProcessedData } from "../types/gemini";

export interface ValidationResult {
  data: VoiceProcessedData;
  isValid: boolean;
  errors: string[];
}


export const validateReservationOrAvailabilityData = (data: VoiceProcessedData): ValidationResult  => {
  const errors: string[] = [];
  const updatedData = { ...data };

  // Check-in
  if (!updatedData.checkIn) {
    updatedData.checkIn = moment().format('YYYY-MM-DD');
  }

  if (!moment(updatedData.checkIn, 'YYYY-MM-DD', true).isValid()) {
    errors.push('Invalid check-in date format.');
  }

  // Check-out
  if (!updatedData.checkOut) {
    updatedData.checkOut = moment(updatedData.checkIn).add(1, 'day').format('YYYY-MM-DD');
  }

  if (!moment(updatedData.checkOut, 'YYYY-MM-DD', true).isValid()) {
    errors.push('Invalid check-out date format.');
  }

  if (
    updatedData.checkIn &&
    updatedData.checkOut &&
    moment(updatedData.checkIn).isSameOrAfter(updatedData.checkOut)
  ) {
    errors.push('Check-out must be after check-in.');
  }

  // Adults
  if (updatedData.adults === undefined || updatedData.adults <= 0) {
    errors.push('At least one adult must be specified.');
  }

  // Children (optional but should be non-negative)
  if (
    updatedData.children !== undefined &&
    (typeof updatedData.children !== 'number' || updatedData.children < 0)
  ) {
    errors.push('Children count must be a non-negative number.');
  }

  return {
    data: updatedData,
    isValid: errors.length === 0,
    errors
  };
}

export const validateCheckinData = (data: VoiceProcessedData): ValidationResult => {
  const errors: string[] = [];

  if (!data.confirmationNumber) {
    errors.push('Confirmation number is required for check-in.');
  }

  return {
    data,
    isValid: errors.length === 0,
    errors
  };
}

export const validateCheckoutData = (data: VoiceProcessedData): ValidationResult => {
  const errors: string[] = [];

  if (!data.confirmationNumber) {
    errors.push('Confirmation number is required for check-out.');
  }

  return {
    data,
    isValid: errors.length === 0,
    errors
  };
}

export const validateSearchReservationData = (data: VoiceProcessedData): ValidationResult => {
  const errors: string[] = [];

  if (!data.searchQuery && !data.confirmationNumber) {
    errors.push('Please provide a name, phone number, or confirmation number to search.');
  }

  return {
    data,
    isValid: errors.length === 0,
    errors
  };
}



