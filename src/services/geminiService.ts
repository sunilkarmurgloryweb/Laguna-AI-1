import { GoogleGenerativeAI, GenerativeModel, ChatSession } from '@google/generative-ai';
import {
  IntentType,
  VoiceProcessedData,
} from '../types/reservation';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';

import { getSystemPrompt } from '../constants/geminiPrompts';
import { GetOrgResponse, RateCode, RoomTypeItem } from '../types/otaReservationApi';
import { GeminiResponse } from '../types/gemini';
import { MULTILINGUAL_BOOKING_PATTERNS } from '../constants/bookingPatterns';
import { validateCheckinData, validateCheckoutData, validateReservationOrAvailabilityData, validateSearchReservationData, ValidationResult } from '../utils/validation';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(localizedFormat);
dayjs.extend(customParseFormat);
dayjs.extend(utc);



export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private chatSession: ChatSession | null = null;
  private currentContext = '';
  private currentGuestDetails: { guestName?: string; email?: string; phone?: string } = {};
  private roomTypes: RoomTypeItem[];
  private rateCodes: RateCode[];
  private initialData: {
      roomTypes: RoomTypeItem[],
      rateCodes: RateCode[],
      properties: GetOrgResponse | null
    };
  private supportedLanguages: string[];

  constructor(
    initialData: {
      roomTypes: RoomTypeItem[],
      rateCodes: RateCode[],
      properties: GetOrgResponse | null
    },
    supportedLanguages: string[] = ['en']
  ) {
    this.roomTypes = initialData.roomTypes;
    this.rateCodes = initialData.rateCodes;
    this.initialData = initialData;
    this.supportedLanguages = supportedLanguages;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error('VITE_GEMINI_API_KEY not provided');

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });
  }

  public async setContext(context: string): Promise<void> {
    if (this.currentContext !== context) {
      this.currentContext = context;
      await this.startChat(context);
    }
  }

  public async startChat(context = 'hotel_reservation', initialIntent = 'help'): Promise<void> {
    this.currentContext = context;
    this.currentGuestDetails = {};

    const gramPrompt = this.getSystemGrampPrompt(context);
    const intentPrompt = getSystemPrompt(context, this.initialData);

    const combined = `
${gramPrompt}

Initial Intent Instructions:
${intentPrompt}
`;

    this.chatSession = this.model.startChat({
      history: [
        { role: 'user', parts: [{ text: combined }] },
        { role: 'model', parts: [{ text: "I’m ready to assist with hotel requests. How can I help?" }] }
      ]
    });
  }

  public async sendMessage(
    message: string,
    currentFormData?: VoiceProcessedData
  ): Promise<GeminiResponse> {
    if (!this.chatSession) await this.startChat();

    // Prepare prompt
    const enhancedPrompt = this.buildEnhancedPrompt(
      message,
      currentFormData,
      this.currentGuestDetails
    );

    const result = await this.chatSession!.sendMessage(enhancedPrompt);
    const response = await result.response;
    const text = response.text();
    console.log(text, "text=====>");

    const gemResp = await this.parseGeminiResponse(text, message);

    // Save guest name/email/phone if found
    ['guestName', 'email', 'phone'].forEach((k) => {
      if (gemResp.extractedData[k]) {
        (this.currentGuestDetails as any)[k] = gemResp.extractedData[k];
      }
    });

    // Extract room type, rate code, dates, guests from message
    const roomType = this.extractRoomTypeFromMessage(message);
    if (roomType) gemResp.extractedData.roomTypeId = roomType;

    const rateCode = this.extractRateCodeFromMessage(message);
    if (rateCode) gemResp.extractedData.rateCodeId = rateCode;
    return gemResp;
  }

  private buildEnhancedPrompt(
    message: string,
    currentFormData: VoiceProcessedData | undefined,
    guestDetails: { guestName?: string; email?: string; phone?: string }
  ): string {
    const lines = [`User: "${message}"`];
    if (guestDetails.guestName) lines.push(`Guest Name: ${guestDetails.guestName}`);
    if (guestDetails.email) lines.push(`Email: ${guestDetails.email}`);
    if (guestDetails.phone) lines.push(`Phone: ${guestDetails.phone}`);
    if (currentFormData) lines.push(`Form Data: ${JSON.stringify(currentFormData)}`);
    return lines.join('\n') + '\n\nPlease respond with intent, extracted data in JSON, suggestions, and next steps.';
  }

  private async parseGeminiResponse(text: string, originalMessage: string): Promise<GeminiResponse> {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log(parsed.extractedData, "parsed.extractedData");

        const mergedExtractedData: VoiceProcessedData = {
          ...this.currentGuestDetails,
          ...parsed.extractedData
        };

        const result = await this.validateExtractedDataByIntent(
          parsed.intent || 'inquiry',
          mergedExtractedData
        );

        console.log(parsed.extractedData, 'result.data');

        return {
          text: parsed.text || text,
          intent: this.validateIntent(parsed.intent) || 'inquiry',
          confidence: parsed.confidence || 0.7,
          extractedData: result.data,
          shouldFillForm: result.isValid,
          validationErrors: result.errors,
          suggestions: parsed.suggestions || []
        };
      }
    } catch (error) {
      console.warn('Failed to parse JSON response from Gemini, using fallback:', error);
      console.warn('Original Gemini text response:', text);
    }

    const fallbackData = await this.extractDataWithRegex(originalMessage); // Make sure this returns a Promise

    return {
      text: "I didn't quite understand that. Could you please rephrase or provide more details?",
      intent: this.detectIntent(originalMessage),
      confidence: 0.5,
      extractedData: fallbackData.data,
      shouldFillForm: fallbackData.hasValidData,
      validationErrors:
        fallbackData.errors.length > 0
          ? fallbackData.errors
          : ['Could not parse Gemini JSON response'],
      suggestions: ['Try being more specific', 'Provide complete information']
    };
  }


  private validateIntent(intent: string): IntentType {
    const validIntents: IntentType[] = [
      'reservation', 'checkin', 'checkout', 'availability',
      'search_reservation', 'inquiry', 'help', 'error', 'unknown', 'reservation_list'
    ];
    return validIntents.includes(intent as IntentType) ? intent as IntentType : 'unknown';
  }

  public validateExtractedDataByIntent(
    intent: IntentType,
    data: VoiceProcessedData
  ): ValidationResult {
    switch (intent) {
      case 'reservation':
      case 'availability':
        return validateReservationOrAvailabilityData(data);
      case 'checkin':
        return validateCheckinData(data);
      case 'checkout':
        return validateCheckoutData(data);
      case 'search_reservation':
        return validateSearchReservationData(data);
      default:
        return {
          data,
          isValid: true,
          errors: []
        };
    }
  }

  private extractDataWithRegex(text: string): {
    data: VoiceProcessedData;
    hasValidData: boolean;
    errors: string[];
  } {
    const data: VoiceProcessedData = {};
    const errors: string[] = [];

    // Merge currentGuestDetails into data first, so new regex matches can override or supplement
    Object.assign(data, this.currentGuestDetails);

    const lowerText = text.toLowerCase();
    const today = dayjs(); // Get current date

    // Date extraction (improved with specific keywords and relative dates)
    let checkInDate: dayjs.Dayjs | null = null;
    let checkOutDate: dayjs.Dayjs | null = null;

    // "today"
    if (lowerText.includes('today')) {
      checkInDate = today;
    }

    // "tomorrow"
    if (lowerText.includes('tomorrow')) {
      // If checkInDate is already set to today, then tomorrow is checkout.
      // Otherwise, tomorrow is checkin.
      if (checkInDate && checkInDate.isSame(today, 'day')) checkOutDate = today.add(1, 'day');
      else if (!checkInDate) checkInDate = today.add(1, 'day');
    }

    // "day after tomorrow"
    if (lowerText.includes('day after tomorrow')) {
      if (!checkInDate) checkInDate = today.add(2, 'day');
      else if (!checkOutDate) checkOutDate = today.add(2, 'day');
    }

    // "for X days"
    const forXDaysMatch = lowerText.match(/for (\d+)\s*days/);
    if (forXDaysMatch && forXDaysMatch[1]) {
      const days = parseInt(forXDaysMatch[1]);
      if (isNaN(days) || days <= 0) {
        errors.push('Invalid number of days for booking.');
      } else {
        if (!checkInDate) checkInDate = today; // Assume check-in is today if not specified
        checkOutDate = checkInDate.add(days, 'day');
      }
    }

    // Specific date formats (YYYY-MM-DD, MM/DD/YYYY, DD-MM-YYYY, Month DD, YYYY)
    // This regex looks for common date patterns. Day.js's parsing is more robust.
    const dateRegex = /(\d{4}-\d{2}-\d{2})|(\d{1,2}\/\d{1,2}\/\d{4})|(\d{1,2}-\d{1,2}-\d{4})|((?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}(?:,\s*\d{4})?)/gi;
    const matches = [...text.matchAll(dateRegex)];

    // Prioritize explicit dates over relative if both are present in the same message.
    if (matches.length > 0) {
      const parsedDates = matches.map(match => dayjs(match[0])).filter(d => d.isValid());
      if (parsedDates.length > 0) {
        checkInDate = parsedDates[0];
        if (parsedDates.length > 1) {
          checkOutDate = parsedDates[1];
        } else if (lowerText.includes('to') || lowerText.includes('until')) {
          // Heuristic: if only one date but "to/until" present, it might be checkIn
          // and expecting checkout. Leave checkout null for now.
        } else {
          // If only one date, assume it's checkIn for 1 day or until clarified
          checkOutDate = checkInDate.add(1, 'day');
        }
      }
    }


    if (checkInDate && checkInDate.isValid()) {
      data.checkIn = checkInDate.format('YYYY-MM-DD');
    }
    if (checkOutDate && checkOutDate.isValid()) {
      data.checkOut = checkOutDate.format('YYYY-MM-DD');
    }

    // Ensure checkOut is after checkIn if both are present
    if (data.checkIn && data.checkOut) {
      const ci = dayjs(data.checkIn);
      const co = dayjs(data.checkOut);
      if (co.isSameOrBefore(ci, 'day')) {
        errors.push('Check-out date must be after check-in date (regex parsing issue).');
        delete data.checkOut; // Invalidate checkout if it's illogical
      }
    }


    // Extract guest counts
    const adultPattern = /(\d+)\s*(?:adult|adults|guest|guests|people|person|व्यासक|वयस्क|व्यक्ति|사람|大人|成人)/i; // Added multilingual terms
    const adultMatch = lowerText.match(adultPattern);
    if (adultMatch) {
      data.adults = parseInt(adultMatch[1]);
    }

    const childPattern = /(\d+)\s*(?:child|children|kid|kids|बच्चे|बच्चा|어린이|子供|儿童)/i; // Added multilingual terms
    const childMatch = lowerText.match(childPattern);
    if (childMatch) {
      data.children = parseInt(childMatch[1]);
    }

    // Extract email
    const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    const emailMatch = text.match(emailPattern); // Use original text for case-sensitivity
    if (emailMatch) {
      data.email = emailMatch[1];
    }

    // Extract phone (relaxed regex for capture, then clean)
    const phonePattern = /(\+?\d{1,3}[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{4,5}|\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4})/; // More robust phone patterns
    const phoneMatch = text.match(phonePattern);
    if (phoneMatch) {
      data.phone = phoneMatch[0].replace(/\D/g, ''); // Clean phone number: remove non-digits
    }

    // Extract guest name (improved with common phrases)
    const namePattern = /(?:my name is|i am|this is|name is|i'm|मेरा नाम|je m'appelle|me llamo|mein name ist|il mio nome è|o meu nome é|私の名前は|내 이름은|我的名字是)\s+([A-Z][a-z]+(?: [A-Z][a-z]+){0,3})/i; // Capitalized words for names
    const nameMatch = text.match(namePattern);
    if (nameMatch && nameMatch[1]) {
      // Simple heuristic: ensure at least two words for a full name, or one if it looks like a valid single name
      const parts = nameMatch[1].trim().split(/\s+/);
      if (parts.length >= 2 || (parts.length === 1 && parts[0].length > 2)) {
        data.guestName = nameMatch[1].trim();
      }
    }

    // Extract room type
    const roomTypePatterns = {
      'Ocean View King Suite': /ocean view king suite|king suite ocean|समुद्र दृश्य राजा सुइट|ओशन व्यू किंग सुइट/i,
      'Deluxe Garden Room': /deluxe garden room|garden room deluxe|डीलक्स गार्डन रूम/i,
      'Family Oceanfront Suite': /family oceanfront suite|oceanfront family suite|परिवार सागर-सामने सुइट|फैमिली ओशनफ्रंट सुइट/i,
      'Presidential Suite': /presidential suite|प्रेसिडेंशियल सुइट/i,
      'Standard Double Room': /standard double room|double standard room|मानक डबल रूम|स्टैंडर्ड डबल रूम/i,
      'Luxury Spa Suite': /luxury spa suite|spa luxury suite|लक्जरी स्पा सुइट|लक्ज़री स्पा सुइट/i,
    };
    for (const room in roomTypePatterns) {
      if (lowerText.match(roomTypePatterns[room as keyof typeof roomTypePatterns])) {
        data.roomType = room;
        break;
      }
    }

    // Extract payment method
    const paymentMethodPatterns = {
      'Credit Card': /credit card|क्रेडिट कार्ड/i,
      'Pay at Hotel': /pay at hotel|होटल पर भुगतान/i,
      'UPI or Digital Wallet': /upi|digital wallet|डिजिटल वॉलेट/i
    };
    for (const method in paymentMethodPatterns) {
      if (lowerText.match(paymentMethodPatterns[method as keyof typeof paymentMethodPatterns])) {
        data.paymentMethod = method;
        break;
      }
    }

    // Extract confirmation number (simple alphanumeric)
    const confirmationNumberPattern = /(?:confirmation number|booking reference|booking id|पुष्टि संख्या|बुकिंग संदर्भ|बुकिंग आईडी)\s*[:#]?\s*([a-zA-Z0-9]{4,15})/;
    const confirmationMatch = lowerText.match(confirmationNumberPattern);
    if (confirmationMatch) {
      data.confirmationNumber = confirmationMatch[1].toUpperCase(); // Often uppercase
    }

    // Determine if any valid data was extracted
    let hasValidData = false;
    for (const key in data) {
      if (data[key as keyof VoiceProcessedData] !== undefined) {
        hasValidData = true;
        break;
      }
    }

    return {
      data,
      hasValidData,
      errors
    };
  }

  private detectIntent(message: string): IntentType {
    const lowerMessage = message.toLowerCase();

    const detectedLanguage = this.detectLanguage(lowerMessage);

    for (const [intentType, patterns] of Object.entries(MULTILINGUAL_BOOKING_PATTERNS)) {
      const languagePatterns = patterns[detectedLanguage] || patterns['en']; // Fallback to English

      for (const pattern of languagePatterns) {
        const regex = new RegExp(`\\b${pattern}\\b`, 'i'); // \b for whole word matching
        if (regex.test(lowerMessage)) {
          console.log(`🎯 Detected intent: "${intentType}" from pattern: "${pattern}" in language: "${detectedLanguage}"`);
          return intentType as IntentType;
        }
      }
    }

    // Search reservation (multilingual)
    if (lowerMessage.match(/\b(find.*reservation|search.*reservation|find.*booking|check.*reservation|reservation.*status|buscar.*reserva|chercher.*réservation|reservierung.*suchen|cercare.*prenotazione|procurar.*reserva|आरक्षण.*खोजना|予約.*検索|예약.*찾기|查找.*预订)\b/)) {
      return 'search_reservation';
    }

    // Reservation list (multilingual)
    if (lowerMessage.match(/\b(show.*reservation.*list|reservation.*list|all.*reservations|list.*reservations|lista.*reservas|liste.*réservations|reservierungsliste|elenco.*prenotazioni|lista.*reservas|आरक्षण.*सूची|予約.*リスト|예약.*목록|预订.*列表)\b/)) {
      return 'reservation_list';
    }

    // Help (multilingual)
    if (lowerMessage.match(/\b(help|assist|ayuda|aide|hilfe|aiuto|ajuda|मदद|ヘルプ|도움|帮助|how can i help|can you help)\b/)) {
      return 'help';
    }

    // General inquiry if nothing specific matches
    return 'inquiry';
  }

  private detectLanguage(text: string): string {
    const lowerText = text.toLowerCase();

    // Script-based detection (more reliable for some languages)
    if (/[\u0900-\u097F]/.test(text)) return 'hi'; // Devanagari (Hindi)
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh'; // CJK Unified Ideographs (Chinese)
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja'; // Hiragana/Katakana (Japanese)
    if (/[\uac00-\ud7af]/.test(text)) return 'ko'; // Hangul (Korean)

    // Word-based detection with more comprehensive patterns
    const languagePatterns: Record<string, RegExp> = {
      'es': /\b(hola|gracias|por favor|habitación|reserva|español|quiero|necesito|hotel|cuarto|hacer|reservar|usted)\b/,
      'fr': /\b(bonjour|merci|chambre|réservation|français|voudrais|besoin|hôtel|faire|réserver|s'il vous plaît)\b/,
      'de': /\b(hallo|danke|zimmer|reservierung|deutsch|möchte|brauche|hotel|buchen|machen|bitte|sie)\b/,
      'it': /\b(ciao|grazie|camera|prenotazione|italiano|vorrei|bisogno|albergo|prenotare|fare|per favore)\b/,
      'pt': /\b(olá|obrigado|quarto|reserva|português|quero|preciso|hotel|reservar|fazer|por favor)\b/,
      'hi': /\b(नमस्ते|धन्यवाद|कमरा|बुकिंग|होटल|आरक्षण|चाहिए|करना|बुक|कृपया)\b/,
      'ja': /\b(こんにちは|ありがとう|部屋|予約|ホテル|したい|お願いします|です|ます)\b/,
      'ko': /\b(안녕하세요|감사합니다|방|예약|호텔|하고싶어요|주세요|합니다)\b/,
      'zh': /\b(你好|谢谢|房间|预订|酒店|想要|请)\b/
    };

    for (const [lang, pattern] of Object.entries(languagePatterns)) {
      if (pattern.test(lowerText)) {
        return lang;
      }
    }

    return 'en'; // Default to English if no specific patterns match
  }

  private extractRoomTypeFromMessage(message: string): RoomTypeItem | null {
    const normalizedText = message.toLowerCase().replace(/[^a-z0-9]/gi, '');
    console.log(normalizedText, "normalized input text for roomType =========>");

    // Check explicit id mention
    const idExplicit = message.match(/\broom type id[: ]?(\d+)\b/i);
    if (idExplicit) {
      const id = +idExplicit[1];
      const matchById = this.roomTypes.find(rt => rt.id === id);
      if (matchById) return matchById;
    }

    for (const rt of this.roomTypes) {
      const typeCode = rt.type?.toLowerCase().replace(/[^a-z0-9]/gi, '');
      const name = rt.name?.toLowerCase().replace(/[^a-z0-9]/gi, '');
      const description = rt.type_description?.toLowerCase().replace(/[^a-z0-9]/gi, '');

      if (typeCode && normalizedText.includes(typeCode)) return rt;
      if (name && normalizedText.includes(name)) return rt;
      if (description && normalizedText.includes(description)) return rt;
    }

    return null;
  }

  private extractRateCodeFromMessage(message: string): RateCode | null {
    const normalizedText = message.toLowerCase().replace(/[^a-z0-9]/gi, '');
    console.log(normalizedText, "normalized input text for rateCode =========>");

    // Check explicit id mention
    const idExp = message.match(/\brate code id[: ]?(\d+)\b/i);
    if (idExp) {
      const id = +idExp[1];
      const matchById = this.rateCodes.find(rc => rc.id === id);
      if (matchById) return matchById;
    }

    for (const rc of this.rateCodes) {
      const name = rc.name?.toLowerCase().replace(/[^a-z0-9]/gi, '');
      const description = rc.description?.toLowerCase().replace(/[^a-z0-9]/gi, '');

      if (name && normalizedText.includes(name)) return rc;
      if (description && normalizedText.includes(description)) return rc;
    }

    return null;
  }

  private extractDatesFromMessage(message: string): { checkIn?: string; checkOut?: string } {
    const lower = message.toLowerCase();

    // Date regex patterns
    const dateRegexes = [
      /\b(\d{4}-\d{2}-\d{2})\b/g,              // 2025-07-23
      /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/g,     // 7/23/2025 or 07/23/25
      /\b(\d{1,2} [a-z]{3,9} \d{4})\b/g,      // 23 July 2025
      /\b([a-z]{3,9} \d{1,2}(?:st|nd|rd|th)?,? \d{4})\b/g, // July 23rd, 2025
    ];

    let foundDates: dayjs.Dayjs[] = [];

    for (const regex of dateRegexes) {
      let match;
      while ((match = regex.exec(message)) !== null) {
        const d = dayjs(match[1], ['YYYY-MM-DD', 'M/D/YYYY', 'D MMMM YYYY', 'MMMM D, YYYY'], true);
        if (d.isValid()) {
          foundDates.push(d);
        }
      }
      if (foundDates.length >= 2) break;
    }

    // Support basic natural language terms
    if (foundDates.length < 2) {
      if (lower.includes('tomorrow')) foundDates.push(dayjs().add(1, 'day'));
      if (lower.includes('today')) foundDates.push(dayjs());
    }

    if (foundDates.length >= 2) {
      foundDates = foundDates.sort((a, b) => a.valueOf() - b.valueOf());
      return {
        checkIn: foundDates[0].format('YYYY-MM-DD'),
        checkOut: foundDates[1].format('YYYY-MM-DD'),
      };
    }

    return {};
  }

  private extractGuestsFromMessage(message: string): { adults?: number; children?: number } {
    const lower = message.toLowerCase();

    const adultsMatch = lower.match(/(\d+)\s*(adults?|grown-ups?|persons?)/);
    const childrenMatch = lower.match(/(\d+)\s*(children|kids|child)/);

    const adults = adultsMatch ? parseInt(adultsMatch[1], 10) : undefined;
    const children = childrenMatch ? parseInt(childrenMatch[1], 10) : undefined;

    if (adults === undefined) {
      // fallback: any number mentioned?
      const anyNum = lower.match(/\b(\d+)\b/);
      if (anyNum) {
        return { adults: parseInt(anyNum[1], 10), children };
      }
    }

    return { adults, children };
  }

  private getSystemGrampPrompt(context: string): string {
    return `Grammar prompt for context: ${context}`;
  }
}

let geminiServiceInstance: GeminiService;

export function initializeGeminiService(
  initialData: {
      roomTypes: RoomTypeItem[],
      rateCodes: RateCode[],
      properties: GetOrgResponse | null
    },
  supportedLanguages: string[] = ['en']
) {
  geminiServiceInstance = new GeminiService(initialData, supportedLanguages);
}

export function getGeminiService(): GeminiService {
  if (!geminiServiceInstance) {
    throw new Error('GeminiService not initialized. Call initializeGeminiService first.');
  }
  return geminiServiceInstance;
}
