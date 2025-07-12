import { GoogleGenerativeAI, GenerativeModel, ChatSession } from '@google/generative-ai';
import { 
  GeminiResponse, 
  ChatMessage, 
  IntentType, 
  VoiceProcessedData,
  MultilingualBookingPatterns 
} from '../types/reservation';

// Multilingual booking patterns for enhanced intent detection
const MULTILINGUAL_BOOKING_PATTERNS: MultilingualBookingPatterns = {
  reservation: {
    en: [
      'book.*room', 'book.*hotel', 'want.*book', 'need.*book', 'make.*booking', 
      'new.*booking', 'reserve.*room', 'reserve.*hotel', 'make.*reservation', 
      'new.*reservation', 'want.*reserve', 'need.*reserve', 'book.*stay', 'reserve.*stay'
    ],
    es: [
      'hacer.*reserva', 'reservar.*habitación', 'reservar.*hotel', 'quiero.*reservar',
      'necesito.*reservar', 'hacer.*booking', 'nueva.*reserva', 'reservar.*cuarto'
    ],
    fr: [
      'faire.*réservation', 'réserver.*chambre', 'réserver.*hôtel', 'veux.*réserver',
      'besoin.*réserver', 'nouvelle.*réservation', 'faire.*booking'
    ],
    de: [
      'reservierung.*machen', 'zimmer.*buchen', 'hotel.*buchen', 'möchte.*buchen',
      'brauche.*reservierung', 'neue.*reservierung', 'zimmer.*reservieren'
    ],
    it: [
      'fare.*prenotazione', 'prenotare.*camera', 'prenotare.*hotel', 'voglio.*prenotare',
      'bisogno.*prenotare', 'nuova.*prenotazione', 'prenotare.*stanza'
    ],
    pt: [
      'fazer.*reserva', 'reservar.*quarto', 'reservar.*hotel', 'quero.*reservar',
      'preciso.*reservar', 'nova.*reserva', 'fazer.*booking'
    ],
    hi: [
      'कमरा.*बुक', 'होटल.*बुक', 'आरक्षण.*करना', 'बुकिंग.*करना', 'रूम.*बुक',
      'होटल.*आरक्षण', 'कमरा.*आरक्षण'
    ],
    ja: [
      '部屋.*予約', 'ホテル.*予約', '予約.*したい', '部屋.*取りたい', 'ルーム.*予約',
      '宿泊.*予約', 'ホテル.*ブッキング'
    ],
    ko: [
      '방.*예약', '호텔.*예약', '예약.*하고싶어', '룸.*예약', '숙박.*예약',
      '호텔.*방.*예약', '객실.*예약'
    ],
    zh: [
      '订房', '预订.*房间', '酒店.*预订', '想.*订房', '需要.*预订', '房间.*预订',
      '酒店.*房间.*预订', '预定.*客房'
    ]
  },
  checkin: {
    en: ['check.?in', 'checking.?in', 'want.*check.?in', 'guest.*check.?in', 'arrival', 'arrive'],
    es: ['check.?in', 'registrarse', 'entrada', 'llegar', 'registro.*hotel'],
    fr: ['check.?in', 'enregistrement', 'arrivée', 'arriver', 's\'enregistrer'],
    de: ['check.?in', 'einchecken', 'ankunft', 'ankommen', 'hotel.*anmeldung'],
    it: ['check.?in', 'registrazione', 'arrivo', 'arrivare', 'fare.*check.?in'],
    pt: ['check.?in', 'fazer.*check.?in', 'chegada', 'chegar', 'registro.*hotel'],
    hi: ['चेक.*इन', 'होटल.*में.*आना', 'पहुंचना', 'रजिस्ट्रेशन'],
    ja: ['チェックイン', 'ホテル.*到着', '宿泊.*手続き', 'フロント.*手続き'],
    ko: ['체크인', '호텔.*도착', '숙박.*수속', '프론트.*접수'],
    zh: ['入住', '办理.*入住', '酒店.*登记', '到达.*酒店']
  },
  checkout: {
    en: ['check.?out', 'checking.?out', 'want.*check.?out', 'guest.*check.?out', 'departure', 'leave'],
    es: ['check.?out', 'salir', 'salida', 'dejar.*hotel', 'checkout'],
    fr: ['check.?out', 'départ', 'partir', 'quitter.*hôtel', 'libérer.*chambre'],
    de: ['check.?out', 'auschecken', 'abreise', 'hotel.*verlassen', 'zimmer.*räumen'],
    it: ['check.?out', 'partenza', 'partire', 'lasciare.*hotel', 'liberare.*camera'],
    pt: ['check.?out', 'saída', 'sair', 'deixar.*hotel', 'fazer.*checkout'],
    hi: ['चेक.*आउट', 'होटल.*छोड़ना', 'जाना', 'निकलना'],
    ja: ['チェックアウト', 'ホテル.*出発', '宿泊.*終了', 'フロント.*精算'],
    ko: ['체크아웃', '호텔.*출발', '숙박.*종료', '계산.*하기'],
    zh: ['退房', '办理.*退房', '离开.*酒店', '结账']
  },
  availability: {
    en: [
      'show.*availability', 'check.*availability', 'room.*availability', 'display.*availability',
      'view.*availability', 'calendar.*view', 'availability.*calendar', 'show.*vacant',
      'show.*free.*rooms', 'available.*rooms'
    ],
    es: [
      'mostrar.*disponibilidad', 'ver.*disponibilidad', 'disponibilidad.*habitaciones',
      'habitaciones.*disponibles', 'calendario.*disponibilidad'
    ],
    fr: [
      'voir.*disponibilité', 'afficher.*disponibilité', 'disponibilité.*chambres',
      'chambres.*disponibles', 'calendrier.*disponibilité'
    ],
    de: [
      'verfügbarkeit.*zeigen', 'verfügbarkeit.*prüfen', 'zimmer.*verfügbarkeit',
      'verfügbare.*zimmer', 'kalender.*verfügbarkeit'
    ],
    it: [
      'mostra.*disponibilità', 'vedere.*disponibilità', 'disponibilità.*camere',
      'camere.*disponibili', 'calendario.*disponibilità'
    ],
    pt: [
      'mostrar.*disponibilidade', 'ver.*disponibilidade', 'disponibilidade.*quartos',
      'quartos.*disponíveis', 'calendário.*disponibilidade'
    ],
    hi: [
      'उपलब्धता.*देखना', 'कमरे.*उपलब्ध', 'खाली.*कमरे', 'उपलब्ध.*कमरे.*दिखाना'
    ],
    ja: [
      '空室.*確認', '利用可能.*部屋', '空いている.*部屋', 'カレンダー.*確認'
    ],
    ko: [
      '객실.*현황.*보기', '이용가능.*객실', '빈.*방.*보기', '예약.*현황'
    ],
    zh: [
      '查看.*房间.*状况', '可用.*房间', '空房.*查询', '房间.*可用性'
    ]
  }
};

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private chatSession: ChatSession | null = null;
  private currentContext: string = '';

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_GEMINI_API_KEY is required');
    }

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

  public async startChat(context: string = 'hotel_reservation'): Promise<void> {
    this.currentContext = context;
    const systemPrompt = this.getSystemPrompt(context);
    
    this.chatSession = this.model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }]
        },
        {
          role: 'model',
          parts: [{ text: 'I understand. I\'m ready to assist with hotel reservations, check-ins, check-outs, and general inquiries. I\'ll provide helpful responses and extract relevant data when appropriate.' }]
        }
      ]
    });
  }

  public async sendMessage(message: string, currentFormData?: VoiceProcessedData): Promise<GeminiResponse> {
    if (!this.chatSession) {
      await this.startChat();
    }

    try {
      const enhancedPrompt = this.buildEnhancedPrompt(message, currentFormData);
      const result = await this.chatSession!.sendMessage(enhancedPrompt);
      const response = await result.response;
      const text = response.text();

      return this.parseGeminiResponse(text, message);
    } catch (error) {
      console.error('Gemini API error:', error);
      return {
        text: "I'm having trouble processing your request. Could you please try again?",
        intent: 'error',
        confidence: 0,
        extractedData: {},
        shouldFillForm: false,
        validationErrors: ['API communication error'],
        suggestions: ['Try rephrasing your request', 'Check your internet connection']
      };
    }
  }

  private getSystemPrompt(context: string): string {
    const basePrompt = `
You are an AI assistant for Lagunacreek Hotels. You help guests with:
1. Hotel reservations
2. Check-in processes  
3. Check-out processes
4. General hotel inquiries
5. Room availability
6. Guest services
7. Find reservations by guest name or phone

MULTILINGUAL SUPPORT:
- Detect the language of user input automatically
- Respond in the same language as the user
- Support: English, Spanish, French, German, Italian, Portuguese, Hindi, Japanese, Korean, Chinese
- Use appropriate cultural context and politeness levels
- For non-English languages, include English translation in parentheses when needed

IMPORTANT INSTRUCTIONS:
- Always respond in a friendly, professional manner
- Match the user's language and cultural context
- Extract relevant data from user messages when possible
- Provide helpful suggestions and next steps
- If user input relates to form filling, indicate this clearly
- Validate extracted data before suggesting form fills
- Respond naturally as if having a conversation
- For check-in requests, always open check-in modal
- For check-out requests, always open check-out modal
- For room availability requests, open availability modal
- For reservation searches, display reservation details in chat

LANGUAGE-SPECIFIC RESPONSES:
- Spanish: Use formal "usted" for politeness, include "por favor" and "gracias"
- French: Use polite forms, "s'il vous plaît" and "merci"
- German: Use formal "Sie", include "bitte" and "danke"
- Italian: Use polite forms, "per favore" and "grazie"
- Portuguese: Use formal address, "por favor" and "obrigado/a"
- Hindi: Use respectful forms, "कृपया" and "धन्यवाद"
- Japanese: Use polite forms (です/ます), "お願いします" and "ありがとうございます"
- Korean: Use formal speech levels, "주세요" and "감사합니다"
- Chinese: Use polite forms, "请" and "谢谢"

Available Room Types:
- Ocean View King Suite ($299/night) - Luxurious suite with panoramic ocean views
- Deluxe Garden Room ($199/night) - Comfortable room overlooking beautiful gardens
- Family Oceanfront Suite ($399/night) - Spacious suite perfect for families
- Presidential Suite ($599/night) - Ultimate luxury with premium amenities
- Standard Double Room ($149/night) - Comfortable standard accommodation
- Luxury Spa Suite ($449/night) - Relaxation suite with spa amenities

Payment Methods:
- Credit Card
- Pay at Hotel
- UPI or Digital Wallet

BOOKING/RESERVATION Voice Command Examples (Multilingual):
English: "I want to book a room" / "Book a hotel room" / "Make a reservation" / "Need to book a stay"
Spanish: "Hacer una reserva" / "Reservar una habitación" / "Registrarse" / "Salir" / "Disponibilidad"
French: "Faire une réservation" / "Réserver une chambre" / "Enregistrement" / "Départ" / "Disponibilité"
German: "Reservierung machen" / "Zimmer buchen" / "Einchecken" / "Auschecken" / "Verfügbarkeit"
Italian: "Fare una prenotazione" / "Prenotare una camera" / "Check-in" / "Check-out" / "Disponibilità"
Portuguese: "Fazer uma reserva" / "Reservar um quarto" / "Check-in" / "Check-out" / "Disponibilidade"
Hindi: "आरक्षण करना" / "कमरा बुक करना" / "चेक इन" / "चेक आउट" / "उपलब्धता"
Japanese: "予約する" / "部屋を予約" / "チェックイン" / "チェックアウト" / "空室状況"
Korean: "예약하기" / "방 예약" / "체크인" / "체크아웃" / "객실 현황"
Chinese: "预订" / "订房间" / "入住" / "退房" / "房间状况"

CRITICAL INTENT MAPPING:
- "book room", "book hotel", "want to book", "make reservation" → ALWAYS use intent: "reservation"
- "check availability", "show availability", "room availability" → ALWAYS use intent: "availability"  
- "check in", "guest check in" → ALWAYS use intent: "checkin"
- "check out", "guest check out" → ALWAYS use intent: "checkout"

IMPORTANT: When user says anything about BOOKING or RESERVING a room/hotel, ALWAYS set intent to "reservation" and open the reservation modal, NOT the availability modal.

For each response, provide:
1. A natural, conversational response
2. Any extracted data in structured format
3. Whether the data should fill form fields
4. Validation status of extracted data
5. Helpful suggestions for next steps

Format your response as JSON:
{
  "text": "conversational response",
  "intent": "reservation|checkin|checkout|availability|search_reservation|inquiry|help",
  "confidence": 0.0-1.0,
  "extractedData": {
    "checkIn": "YYYY-MM-DD",
    "checkOut": "YYYY-MM-DD", 
    "adults": number,
    "children": number,
    "roomType": "exact room name",
    "guestName": "full name",
    "phone": "phone number",
    "email": "email address",
    "paymentMethod": "payment method",
    "confirmationNumber": "booking reference",
    "searchQuery": "guest name or phone for reservation search"
  },
  "shouldFillForm": boolean,
  "validationErrors": ["list of validation issues"],
  "suggestions": ["helpful next steps"]
}
`;

    return basePrompt;
  }

  private buildEnhancedPrompt(message: string, currentFormData?: VoiceProcessedData): string {
    let prompt = `User message: "${message}"`;
    
    if (currentFormData && Object.keys(currentFormData).length > 0) {
      prompt += `\n\nCurrent form data: ${JSON.stringify(currentFormData, null, 2)}`;
    }

    prompt += `\n\nContext: ${this.currentContext}`;
    prompt += `\n\nPlease analyze this message and provide a helpful response with any extractable data.`;

    return prompt;
  }

  private parseGeminiResponse(text: string, originalMessage: string): GeminiResponse {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate and clean the extracted data
        const validatedData = this.validateExtractedData(parsed.extractedData || {});
        
        return {
          text: parsed.text || text,
          intent: this.validateIntent(parsed.intent) || 'inquiry',
          confidence: parsed.confidence || 0.7,
          extractedData: validatedData.data,
          shouldFillForm: validatedData.isValid,
          validationErrors: validatedData.errors,
          suggestions: parsed.suggestions || []
        };
      }
    } catch (error) {
      console.warn('Failed to parse JSON response, using fallback:', error);
    }

    // Fallback: extract data using regex patterns
    const fallbackData = this.extractDataWithRegex(originalMessage);
    
    return {
      text: text,
      intent: this.detectIntent(originalMessage),
      confidence: 0.6,
      extractedData: fallbackData.data,
      shouldFillForm: fallbackData.hasValidData,
      validationErrors: fallbackData.errors,
      suggestions: ['Try being more specific', 'Provide complete information']
    };
  }

  private validateIntent(intent: string): IntentType {
    const validIntents: IntentType[] = [
      'reservation', 'checkin', 'checkout', 'availability', 
      'search_reservation', 'inquiry', 'help', 'error', 'unknown'
    ];
    return validIntents.includes(intent as IntentType) ? intent as IntentType : 'unknown';
  }

  private validateExtractedData(data: VoiceProcessedData): {
    data: VoiceProcessedData;
    isValid: boolean;
    errors: string[];
  } {
    const validatedData: VoiceProcessedData = {};
    const errors: string[] = [];

    // Validate dates
    if (data.checkIn) {
      const checkInDate = new Date(data.checkIn as string);
      if (isNaN(checkInDate.getTime())) {
        errors.push('Invalid check-in date format');
      } else if (checkInDate < new Date()) {
        errors.push('Check-in date cannot be in the past');
      } else {
        validatedData.checkIn = data.checkIn;
      }
    }

    if (data.checkOut) {
      const checkOutDate = new Date(data.checkOut as string);
      if (isNaN(checkOutDate.getTime())) {
        errors.push('Invalid check-out date format');
      } else if (data.checkIn && checkOutDate <= new Date(data.checkIn as string)) {
        errors.push('Check-out date must be after check-in date');
      } else {
        validatedData.checkOut = data.checkOut;
      }
    }

    // Validate guest counts
    if (data.adults !== undefined) {
      const adults = typeof data.adults === 'number' ? data.adults : parseInt(String(data.adults));
      if (isNaN(adults) || adults < 1 || adults > 10) {
        errors.push('Adults must be between 1 and 10');
      } else {
        validatedData.adults = adults;
      }
    }

    if (data.children !== undefined) {
      const children = typeof data.children === 'number' ? data.children : parseInt(String(data.children));
      if (isNaN(children) || children < 0 || children > 8) {
        errors.push('Children must be between 0 and 8');
      } else {
        validatedData.children = children;
      }
    }

    // Validate room type
    if (data.roomType) {
      const validRooms = [
        'Ocean View King Suite',
        'Deluxe Garden Room',
        'Family Oceanfront Suite',
        'Presidential Suite',
        'Standard Double Room',
        'Luxury Spa Suite'
      ];
      
      const matchedRoom = validRooms.find(room => 
        room.toLowerCase().includes(data.roomType.toLowerCase()) ||
        data.roomType.toLowerCase().includes(room.toLowerCase())
      );
      
      if (matchedRoom) {
        validatedData.roomType = matchedRoom;
      } else {
        errors.push('Invalid room type specified');
      }
    }

    // Validate email
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(String(data.email))) {
        validatedData.email = data.email;
      } else {
        errors.push('Invalid email format');
      }
    }

    // Validate phone
    if (data.phone) {
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
      if (phoneRegex.test(String(data.phone))) {
        validatedData.phone = String(data.phone).replace(/\D/g, '');
      } else {
        errors.push('Invalid phone number format');
      }
    }

    // Validate guest name
    if (data.guestName) {
      if (String(data.guestName).trim().length >= 2) {
        validatedData.guestName = String(data.guestName).trim();
      } else {
        errors.push('Guest name must be at least 2 characters');
      }
    }

    // Validate payment method
    if (data.paymentMethod) {
      const validMethods = ['Credit Card', 'Pay at Hotel', 'UPI or Digital Wallet'];
      const matchedMethod = validMethods.find(method =>
        method.toLowerCase().includes(String(data.paymentMethod).toLowerCase()) ||
        String(data.paymentMethod).toLowerCase().includes(method.toLowerCase())
      );
      
      if (matchedMethod) {
        validatedData.paymentMethod = matchedMethod;
      } else {
        errors.push('Invalid payment method');
      }
    }

    return {
      data: validatedData,
      isValid: errors.length === 0 && Object.keys(validatedData).length > 0,
      errors
    };
  }

  private extractDataWithRegex(text: string): {
    data: VoiceProcessedData;
    hasValidData: boolean;
    errors: string[];
  } {
    const data: VoiceProcessedData = {};
    const errors: string[] = [];

    // Extract dates
    const datePattern = /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\d{4}-\d{2}-\d{2}|(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:,?\s*\d{4})?)/gi;
    const dates = text.match(datePattern);
    if (dates && dates.length >= 1) {
      data.checkIn = this.parseDate(dates[0]);
      if (dates.length >= 2) {
        data.checkOut = this.parseDate(dates[1]);
      }
    }

    // Extract guest counts
    const adultPattern = /(\d+)\s*(?:adult|adults|guest|guests|people|person)/i;
    const adultMatch = text.match(adultPattern);
    if (adultMatch) {
      data.adults = parseInt(adultMatch[1]);
    }

    const childPattern = /(\d+)\s*(?:child|children|kid|kids)/i;
    const childMatch = text.match(childPattern);
    if (childMatch) {
      data.children = parseInt(childMatch[1]);
    }

    // Extract email
    const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    const emailMatch = text.match(emailPattern);
    if (emailMatch) {
      data.email = emailMatch[1];
    }

    // Extract phone
    const phonePattern = /(\+?[\d\s\-\(\)]{10,})/;
    const phoneMatch = text.match(phonePattern);
    if (phoneMatch) {
      data.phone = phoneMatch[1];
    }

    return {
      data,
      hasValidData: Object.keys(data).length > 0,
      errors
    };
  }

  private parseDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (error) {
      console.warn('Failed to parse date:', dateStr);
    }
    return dateStr;
  }

  private detectIntent(message: string): IntentType {
    const lowerMessage = message.toLowerCase();
    
    // Detect language first
    const detectedLanguage = this.detectLanguage(lowerMessage);
    
    // Check multilingual patterns for each intent
    for (const [intentType, patterns] of Object.entries(MULTILINGUAL_BOOKING_PATTERNS)) {
      const languagePatterns = patterns[detectedLanguage] || patterns['en'];
      
      for (const pattern of languagePatterns) {
        const regex = new RegExp(`\\b${pattern}\\b`, 'i');
        if (regex.test(lowerMessage)) {
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
    if (lowerMessage.match(/\b(help|assist|ayuda|aide|hilfe|aiuto|ajuda|मदद|ヘルプ|도움|帮助)\b/)) {
      return 'help';
    }
    
    return 'inquiry';
  }
  
  private detectLanguage(text: string): string {
    // Simple language detection based on common words/patterns
    const lowerText = text.toLowerCase();
    
    // Script-based detection
    if (/[\u0900-\u097F]/.test(text)) return 'hi'; // Devanagari script
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh'; // Chinese characters
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja'; // Japanese hiragana/katakana
    if (/[\uac00-\ud7af]/.test(text)) return 'ko'; // Korean hangul
    
    // Word-based detection with more comprehensive patterns
    const languagePatterns: Record<string, RegExp> = {
      'es': /\b(hola|gracias|por favor|habitación|reserva|español|quiero|necesito|hotel|cuarto|hacer|reservar)\b/,
      'fr': /\b(bonjour|merci|chambre|réservation|français|voudrais|besoin|hôtel|faire|réserver)\b/,
      'de': /\b(hallo|danke|zimmer|reservierung|deutsch|möchte|brauche|hotel|buchen|machen)\b/,
      'it': /\b(ciao|grazie|camera|prenotazione|italiano|vorrei|bisogno|albergo|prenotare|fare)\b/,
      'pt': /\b(olá|obrigado|quarto|reserva|português|quero|preciso|hotel|reservar|fazer)\b/,
      'hi': /\b(नमस्ते|धन्यवाद|कमरा|बुकिंग|होटल|आरक्षण|चाहिए|करना|बुक)\b/,
      'ja': /\b(こんにちは|ありがとう|部屋|予約|ホテル|したい|お願い)\b/,
      'ko': /\b(안녕하세요|감사합니다|방|예약|호텔|하고싶어요|주세요)\b/,
      'zh': /\b(你好|谢谢|房间|预订|酒店|想要|请)\b/
    };
    
    for (const [lang, pattern] of Object.entries(languagePatterns)) {
      if (pattern.test(lowerText)) {
        return lang;
      }
    }
    
    return 'en'; // Default to English
  }

  public async speak(text: string, language: string = 'en-US'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(event.error);

      speechSynthesis.speak(utterance);
    });
  }

  public setContext(context: string): void {
    this.currentContext = context;
  }

  public async resetChat(): Promise<void> {
    this.chatSession = null;
    await this.startChat(this.currentContext);
  }
}

export const geminiService = new GeminiService();

// Export processVoiceCommand function for backward compatibility
export const processVoiceCommand = async (message: string, language: string = 'en') => {
  try {
    const response = await geminiService.sendMessage(message);
    return {
      response: {
        text: response.text
      },
      intent: response.intent,
      extractedData: response.extractedData
    };
  } catch (error) {
    console.error('Voice command processing error:', error);
    return {
      response: {
        text: "I'm sorry, I couldn't process that request. Please try again."
      },
      intent: 'error',
      extractedData: {}
    };
  }
};