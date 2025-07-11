import { Language } from '../types/reservation';

export const extractDatesAndGuests = (text: string) => {
  const result = {
    checkIn: '',
    checkOut: '',
    adults: 0,
    children: 0
  };

  // Enhanced date extraction with more flexible patterns
  const datePatterns = [
    // "from July 15 to July 18" or "July 15 to July 18"
    /(?:from\s+)?(\w+\s+\d{1,2})(?:\s+to\s+|\s+until\s+|\s+through\s+)(\w+\s+\d{1,2})/i,
    // "check in July 15 check out July 18"
    /check.?in\s+(\w+\s+\d{1,2}).*check.?out\s+(\w+\s+\d{1,2})/i,
    // "July 15 through July 18"
    /(\w+\s+\d{1,2})\s+(?:through|until)\s+(\w+\s+\d{1,2})/i,
    // Date formats like "7/15 to 7/18"
    /(\d{1,2}\/\d{1,2}(?:\/\d{4})?)\s+(?:to|through|until)\s+(\d{1,2}\/\d{1,2}(?:\/\d{4})?)/i,
    // "15th July to 18th July"
    /(\d{1,2}(?:st|nd|rd|th)?\s+\w+)\s+(?:to|through|until)\s+(\d{1,2}(?:st|nd|rd|th)?\s+\w+)/i
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match && match.length >= 3) {
      result.checkIn = match[1].trim();
      result.checkOut = match[2].trim();
      break;
    }
  }

  // Enhanced single date patterns - more flexible and user-friendly
  if (!result.checkIn && !result.checkOut) {
    const singleDatePatterns = [
      // "check in July 18" or "check-in July 18"
      /check.?in\s+(?:date\s+)?(?:is\s+)?(\w+\s+\d{1,2})/i,
      // "check in 18 July" or "check-in 18 July" (day before month)
      /check.?in\s+(?:date\s+)?(?:is\s+)?(\d{1,2}\s+\w+)/i,
      // "checking date July 22" - NEW PATTERN
      /checking\s+(?:date\s+)?(\w+\s+\d{1,2})/i,
      // "checking date 22 July" - NEW PATTERN
      /checking\s+(?:date\s+)?(\d{1,2}\s+\w+)/i,
      // "check out July 20" or "check-out July 20"
      /check.?out\s+(?:date\s+)?(?:is\s+)?(\w+\s+\d{1,2})/i,
      // "check out 20 July" or "check-out 20 July" (day before month)
      /check.?out\s+(?:date\s+)?(?:is\s+)?(\d{1,2}\s+\w+)/i,
      // "checkout date July 20" - NEW PATTERN
      /checkout\s+(?:date\s+)?(\w+\s+\d{1,2})/i,
      // "checkout date 20 July" - NEW PATTERN
      /checkout\s+(?:date\s+)?(\d{1,2}\s+\w+)/i,
      // "arriving July 18"
      /arriving\s+(?:on\s+)?(\w+\s+\d{1,2})/i,
      // "arriving 18 July"
      /arriving\s+(?:on\s+)?(\d{1,2}\s+\w+)/i,
      // "departing July 20"
      /departing\s+(?:on\s+)?(\w+\s+\d{1,2})/i,
      // "departing 20 July"
      /departing\s+(?:on\s+)?(\d{1,2}\s+\w+)/i,
      // "arrival date July 18" - NEW PATTERN
      /arrival\s+(?:date\s+)?(\w+\s+\d{1,2})/i,
      // "arrival date 18 July" - NEW PATTERN
      /arrival\s+(?:date\s+)?(\d{1,2}\s+\w+)/i,
      // "departure date July 20" - NEW PATTERN
      /departure\s+(?:date\s+)?(\w+\s+\d{1,2})/i,
      // "departure date 20 July" - NEW PATTERN
      /departure\s+(?:date\s+)?(\d{1,2}\s+\w+)/i,
      // "start date July 18" - NEW PATTERN
      /start\s+(?:date\s+)?(\w+\s+\d{1,2})/i,
      // "end date July 20" - NEW PATTERN
      /end\s+(?:date\s+)?(\w+\s+\d{1,2})/i,
      // "from July 18" - NEW PATTERN
      /from\s+(\w+\s+\d{1,2})/i,
      // "until July 20" - NEW PATTERN
      /until\s+(\w+\s+\d{1,2})/i,
      // "on July 18" - NEW PATTERN
      /on\s+(\w+\s+\d{1,2})/i,
      // "July 18" - standalone date - NEW PATTERN
      /(?:^|\s)(\w+\s+\d{1,2})(?:\s|$)/i,
      // "18 July" - standalone date - NEW PATTERN
      /(?:^|\s)(\d{1,2}\s+\w+)(?:\s|$)/i,
      // Date formats like "check in 7/18"
      /check.?in\s+(?:date\s+)?(\d{1,2}\/\d{1,2}(?:\/\d{4})?)/i,
      /check.?out\s+(?:date\s+)?(\d{1,2}\/\d{1,2}(?:\/\d{4})?)/i,
      // "7/18" - standalone date format
      /(?:^|\s)(\d{1,2}\/\d{1,2}(?:\/\d{4})?)(?:\s|$)/i
    ];

    for (const pattern of singleDatePatterns) {
      const match = text.match(pattern);
      if (match) {
        const dateValue = match[1].trim();
        
        // Smart date assignment based on context
        if (/check.?in|arriving|arrival|start|from|checking/i.test(match[0])) {
          result.checkIn = dateValue;
        } else if (/check.?out|departing|departure|end|until|checkout/i.test(match[0])) {
          result.checkOut = dateValue;
        } else {
          // For standalone dates, assume check-in if no check-in date exists
          if (!result.checkIn) {
            result.checkIn = dateValue;
          } else {
            result.checkOut = dateValue;
          }
        }
        break;
      }
    }
  }

  // Enhanced guest extraction with more natural patterns
  const adultPatterns = [
    /(?:I\s+have\s+)?(?:a\s+)?(\w+|\d+)\s+adults?/i,
    /(?:I\s+have\s+)?(?:a\s+)?(\w+|\d+)\s+adult/i,
    /(\d+)\s+people/i,
    /for\s+(\d+)\s+(?:people|adults?)/i,
    /(\w+|\d+)\s+(?:person|people)/i,
    /party\s+of\s+(\d+)/i,
    /group\s+of\s+(\d+)/i
  ];

  for (const pattern of adultPatterns) {
    const match = text.match(pattern);
    if (match) {
      const value = match[1];
      result.adults = convertWordToNumber(value);
      if (result.adults > 0) break;
    }
  }

  // Enhanced children extraction
  const childPatterns = [
    /(?:I\s+have\s+)?(?:a\s+)?(\w+|\d+)\s+(?:child|children|kids?)/i,
    /(?:and\s+)?(?:a\s+)?(\w+|\d+)\s+(?:child|children|kids?)/i,
    /with\s+(\w+|\d+)\s+(?:child|children|kids?)/i,
    /plus\s+(\w+|\d+)\s+(?:child|children|kids?)/i
  ];

  for (const pattern of childPatterns) {
    const match = text.match(pattern);
    if (match) {
      const value = match[1];
      result.children = convertWordToNumber(value);
      if (result.children > 0) break;
    }
  }

  return result;
};

// Helper function to convert word numbers to digits
const convertWordToNumber = (value: string): number => {
  const numberWords: { [key: string]: number } = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
    'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20
  };
  
  const lowerValue = value.toLowerCase();
  return numberWords[lowerValue] || parseInt(value) || 0;
};

export const extractRoomType = (text: string) => {
  const roomTypes = [
    { keywords: ['deluxe', 'king'], type: 'deluxe' },
    { keywords: ['family', 'suite'], type: 'family' },
    { keywords: ['ocean', 'view'], type: 'ocean' },
    { keywords: ['standard'], type: 'standard' }
  ];

  const lowerText = text.toLowerCase();
  
  for (const room of roomTypes) {
    if (room.keywords.every(keyword => lowerText.includes(keyword))) {
      return room.type;
    }
  }

  // Fallback to single keyword matching
  for (const room of roomTypes) {
    if (room.keywords.some(keyword => lowerText.includes(keyword))) {
      return room.type;
    }
  }

  return null;
};

export const extractGuestInfo = (text: string) => {
  const result = {
    name: '',
    phone: '',
    email: ''
  };

  // Extract name with various patterns
  const namePatterns = [
    /(?:my name is|i'm|i am|name is)\s+([a-zA-Z\s]+?)(?:\s*,|\s+and|\s+my|\s+phone|\s+email|$)/i,
    /(?:this is|speaking is)\s+([a-zA-Z\s]+?)(?:\s*,|\s+and|\s+my|\s+phone|\s+email|$)/i
  ];

  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.name = match[1].trim();
      break;
    }
  }

  // Extract phone number (10 digits)
  const phoneMatch = text.match(/(?:phone|number|contact).*?(\d{10})/i) || text.match(/(\d{10})/);
  if (phoneMatch) {
    result.phone = phoneMatch[1];
  }

  // Extract email
  const emailMatch = text.match(/(?:email|mail).*?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i) || 
                    text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    result.email = emailMatch[1];
  }

  return result;
};

export const extractPaymentMethod = (text: string) => {
  const methods = [
    { keywords: ['credit', 'card'], method: 'credit card' },
    { keywords: ['pay', 'hotel'], method: 'pay at hotel' },
    { keywords: ['upi'], method: 'upi' },
    { keywords: ['digital', 'wallet'], method: 'upi' },
    { keywords: ['cash'], method: 'pay at hotel' }
  ];

  const lowerText = text.toLowerCase();
  
  for (const methodObj of methods) {
    if (methodObj.keywords.every(keyword => lowerText.includes(keyword))) {
      return methodObj.method;
    }
  }

  // Fallback to single keyword matching
  for (const methodObj of methods) {
    if (methodObj.keywords.some(keyword => lowerText.includes(keyword))) {
      return methodObj.method;
    }
  }

  return null;
};

export const isConfirmationIntent = (text: string) => {
  const confirmPatterns = [
    /yes.*confirm/i,
    /confirm.*booking/i,
    /book.*it/i,
    /proceed/i,
    /^yes$/i,
    /that's correct/i,
    /looks good/i
  ];
  
  return confirmPatterns.some(pattern => pattern.test(text));
};

export const isReservationIntent = (text: string) => {
  const reservationPatterns = [
    /(?:make|book|create).*(?:reservation|booking)/i,
    /(?:book|reserve).*room/i,
    /need.*(?:room|hotel|stay)/i,
    /want.*(?:book|reserve|stay)/i,
    /looking for.*room/i,
    /check.*availability/i
  ];
  
  return reservationPatterns.some(pattern => pattern.test(text));
};

export const getLanguageCode = (language: Language): string => {
  const codes = {
    'en': 'en-US',
    'es': 'es-ES',
    'hi': 'hi-IN',
    'en-uk': 'en-GB'
  };
  return codes[language];
};

export const isMissingInfoQuery = (text: string): boolean => {
  const missingInfoPatterns = [
    /what.*(?:missing|need|required)/i,
    /which.*(?:information|details|data).*(?:missing|need)/i,
    /what.*(?:information|details|data).*(?:missing|need)/i,
    /missing.*(?:information|details|data)/i,
    /what.*(?:else|more).*need/i,
    /what.*still.*need/i,
    /what.*left/i,
    /incomplete/i,
    /what.*remaining/i,
    /help.*complete/i,
    /status/i,
    /progress/i
  ];
  
  return missingInfoPatterns.some(pattern => pattern.test(text));
};