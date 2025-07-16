// src/services/GeminiService.ts

import { GoogleGenerativeAI, GenerativeModel, ChatSession } from '@google/generative-ai';
import {
  GeminiResponse,
  ChatMessage,
  IntentType,
  VoiceProcessedData,
  MultilingualBookingPatterns
} from '../types/reservation';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import localizedFormat from 'dayjs/plugin/localizedFormat'; // For better date formatting in responses

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(localizedFormat);


// Multilingual booking patterns for enhanced intent detection
const MULTILINGUAL_BOOKING_PATTERNS: MultilingualBookingPatterns = {
  reservation: {
    en: [
      'book.*room', 'book.*hotel', 'want.*book', 'need.*book', 'make.*booking',
      'new.*booking', 'reserve.*room', 'reserve.*hotel', 'make.*reservation',
      'new.*reservation', 'want.*reserve', 'need.*reserve', 'book.*stay', 'reserve.*stay',
      'i would like to book', 'can i book'
    ],
    es: [
      'hacer.*reserva', 'reservar.*habitación', 'reservar.*hotel', 'quiero.*reservar',
      'necesito.*reservar', 'hacer.*booking', 'nueva.*reserva', 'reservar.*cuarto',
      'quisiera.*reservar', 'puedo.*reservar'
    ],
    fr: [
      'faire.*réservation', 'réserver.*chambre', 'réserver.*hôtel', 'veux.*réserver',
      'besoin.*réserver', 'nouvelle.*réservation', 'faire.*booking',
      'j\'aimerais.*réserver', 'puis-je.*réserver'
    ],
    de: [
      'reservierung.*machen', 'zimmer.*buchen', 'hotel.*buchen', 'möchte.*buchen',
      'brauche.*reservierung', 'neue.*reservierung', 'zimmer.*reservieren',
      'ich möchte.*buchen', 'kann ich.*buchen'
    ],
    it: [
      'fare.*prenotazione', 'prenotare.*camera', 'prenotare.*hotel', 'voglio.*prenotare',
      'bisogno.*prenotare', 'nuova.*prenotazione', 'prenotare.*stanza',
      'vorrei.*prenotare', 'posso.*prenotare'
    ],
    pt: [
      'fazer.*reserva', 'reservar.*quarto', 'reservar.*hotel', 'quero.*reservar',
      'preciso.*reservar', 'nova.*reserva', 'fazer.*booking',
      'gostaria.*de.*reservar', 'posso.*reservar'
    ],
    hi: [
      'कमरा.*बुक', 'होटल.*बुक', 'आरक्षण.*करना', 'बुकिंग.*करना', 'रूम.*बुक',
      'होटल.*आरक्षण', 'कमरा.*आरक्षण', 'मैं.*बुक.*करना.*चाहता.*हूँ'
    ],
    ja: [
      '部屋.*予約', 'ホテル.*予約', '予約.*したい', '部屋.*取りたい', 'ルーム.*予約',
      '宿泊.*予約', 'ホテル.*ブッキング', '予約.*お願い'
    ],
    ko: [
      '방.*예약', '호텔.*예약', '예약.*하고싶어', '룸.*예약', '숙박.*예약',
      '호텔.*방.*예약', '객실.*예약', '예약.*해주세요'
    ],
    zh: [
      '订房', '预订.*房间', '酒店.*预订', '想.*订房', '需要.*预订', '房间.*预订',
      '酒店.*房间.*预订', '预定.*客房', '我要.*订房'
    ]
  },
  checkin: {
    en: ['check.?in', 'checking.?in', 'want.*check.?in', 'guest.*check.?in', 'arrival', 'arrive', 'i am here'],
    es: ['check.?in', 'registrarse', 'entrada', 'llegar', 'registro.*hotel', 'he.*llegado'],
    fr: ['check.?in', 'enregistrement', 'arrivée', 'arriver', 's\'enregistrer', 'je suis.*là'],
    de: ['check.?in', 'einchecken', 'ankunft', 'ankommen', 'hotel.*anmeldung', 'ich bin.*hier'],
    it: ['check.?in', 'registrazione', 'arrivo', 'arrivare', 'fare.*check.?in', 'sono.*qui'],
    pt: ['check.?in', 'fazer.*check.?in', 'chegada', 'chegar', 'registro.*hotel', 'estou.*aqui'],
    hi: ['चेक.*इन', 'होटल.*में.*आना', 'पहुंचना', 'रजिस्ट्रेशन', 'मैं.*आ.*गया.*हूँ'],
    ja: ['チェックイン', 'ホテル.*到着', '宿泊.*手続き', 'フロント.*手続き', '来ました'],
    ko: ['체크인', '호텔.*도착', '숙박.*수속', '프론트.*접수', '왔습니다'],
    zh: ['入住', '办理.*入住', '酒店.*登记', '到达.*酒店', '我.*到了']
  },
  checkout: {
    en: ['check.?out', 'checking.?out', 'want.*check.?out', 'guest.*check.?out', 'departure', 'leave', 'i am leaving'],
    es: ['check.?out', 'salir', 'salida', 'dejar.*hotel', 'checkout', 'me.*voy'],
    fr: ['check.?out', 'départ', 'partir', 'quitter.*hôtel', 'libérer.*chambre', 'je.*pars'],
    de: ['check.?out', 'auschecken', 'abreise', 'hotel.*verlassen', 'zimmer.*räumen', 'ich.*gehe'],
    it: ['check.?out', 'partenza', 'partire', 'lasciare.*hotel', 'liberare.*camera', 'parto'],
    pt: ['check.?out', 'saída', 'sair', 'deixar.*hotel', 'fazer.*checkout', 'estou.*de.*saída'],
    hi: ['चेक.*आउट', 'होटल.*छोड़ना', 'जाना', 'निकलना', 'मैं.*जा.*रहा.*हूँ'],
    ja: ['チェックアウト', 'ホテル.*出発', '宿泊.*終了', 'フロント.*精算', '帰ります'],
    ko: ['체크아웃', '호텔.*출발', '숙박.*종료', '계산.*하기', '갑니다'],
    zh: ['退房', '办理.*退房', '离开.*酒店', '结账', '我要.*退房']
  },
  availability: {
    en: [
      'show.*availability', 'check.*availability', 'room.*availability', 'display.*availability',
      'view.*availability', 'calendar.*view', 'availability.*calendar', 'show.*vacant',
      'show.*free.*rooms', 'available.*rooms', 'is.*room.*available'
    ],
    es: [
      'mostrar.*disponibilidad', 'ver.*disponibilidad', 'disponibilidad.*habitaciones',
      'habitaciones.*disponibles', 'calendario.*disponibilidad', 'hay.*habitaciones.*disponibles'
    ],
    fr: [
      'voir.*disponibilité', 'afficher.*disponibilité', 'disponibilité.*chambres',
      'chambres.*disponibles', 'calendrier.*disponibilité', 'y.*a-t-il.*chambres.*disponibles'
    ],
    de: [
      'verfügbarkeit.*zeigen', 'verfügbarkeit.*prüfen', 'zimmer.*verfügbarkeit',
      'verfügbare.*zimmer', 'kalender.*verfügbarkeit', 'ist.*zimmer.*verfügbar'
    ],
    it: [
      'mostra.*disponibilità', 'vedere.*disponibilità', 'disponibilità.*camere',
      'camere.*disponibili', 'calendario.*disponibilità', 'ci.*sono.*camere.*disponibili'
    ],
    pt: [
      'mostrar.*disponibilidade', 'ver.*disponibilidade', 'disponibilidade.*quartos',
      'quartos.*disponíveis', 'calendário.*disponibilidade', 'há.*quartos.*disponíveis'
    ],
    hi: [
      'उपलब्धता.*देखना', 'कमरे.*उपलब्ध', 'खाली.*कमरे', 'उपलब्ध.*कमरे.*दिखाना', 'क्या.*कमरा.*उपलब्ध.*है'
    ],
    ja: [
      '空室.*確認', '利用可能.*部屋', '空いている.*部屋', 'カレンダー.*確認', '部屋.*ありますか'
    ],
    ko: [
      '객실.*현황.*보기', '이용가능.*객실', '빈.*방.*보기', '예약.*현황', '방.*있나요'
    ],
    zh: [
      '查看.*房间.*状况', '可用.*房间', '空房.*查询', '房间.*可用性', '有.*房间.*吗'
    ]
  }
};

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private chatSession: ChatSession | null = null;
  private currentContext: string = '';
  // NEW: Property to store sticky guest details
  private currentGuestDetails: { guestName?: string; email?: string; phone?: string } = {};

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_GEMINI_API_KEY is required. Please set it in your .env file.');
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
    // Reset guest details when starting a new chat session to ensure a clean slate
    this.currentGuestDetails = {};
    const systemPrompt = this.getSystemPrompt(context);

    this.chatSession = this.model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }]
        },
        {
          role: 'model',
          parts: [{ text: 'I understand. I\'m ready to assist with hotel reservations, check-ins, check-outs, and general inquiries. How can I help you today?' }]
        }
      ]
    });
    console.log("Gemini chat session started with system prompt.");
  }

  public async sendMessage(message: string, currentFormData?: VoiceProcessedData): Promise<GeminiResponse> {
    if (!this.chatSession) {
      console.warn("Chat session not started. Starting a new one.");
      await this.startChat();
    }

    try {
      // NEW: Pass currentGuestDetails to the prompt builder
      const enhancedPrompt = this.buildEnhancedPrompt(message, currentFormData, this.currentGuestDetails);
      const result = await this.chatSession!.sendMessage(enhancedPrompt);
      const response = await result.response;
      const text = response.text();

      const geminiResponse = this.parseGeminiResponse(text, message);

      // NEW: Update currentGuestDetails with any newly extracted and valid guest info
      // Only update if a valid name, email, or phone is extracted in the current turn
      if (geminiResponse.extractedData.guestName) {
        this.currentGuestDetails.guestName = geminiResponse.extractedData.guestName;
      }
      if (geminiResponse.extractedData.email) {
        this.currentGuestDetails.email = geminiResponse.extractedData.email;
      }
      if (geminiResponse.extractedData.phone) {
        this.currentGuestDetails.phone = geminiResponse.extractedData.phone;
      }

      console.log("Gemini Response:", JSON.stringify(geminiResponse, null, 2));
      return geminiResponse;
    } catch (error) {
      console.error('Gemini API error during sendMessage:', error);
      return {
        text: "I'm having trouble processing your request right now. Please try again in a moment.",
        intent: 'error',
        confidence: 0,
        extractedData: {},
        shouldFillForm: false,
        validationErrors: ['API communication error or malformed response'],
        suggestions: ['Please try rephrasing your request', 'Check your internet connection']
      };
    }
  }

  private getSystemPrompt(context: string): string {
    // Current date and time for dynamic prompt
    const now = dayjs();
    const todayFormatted = now.format('YYYY-MM-DD');
    const tomorrowFormatted = now.add(1, 'day').format('YYYY-MM-DD');
    // Calculate a date 3 days from now for example
    const threeDaysFromNowFormatted = now.add(3, 'day').format('YYYY-MM-DD');

    const basePrompt = `
You are an AI assistant for Lagunacreek Hotels. You help guests with:
1. Hotel reservations
2. Check-in processes
3. Check-out processes
4. General hotel inquiries
5. Room availability
6. Guest services
7. Find reservations by guest name or phone

---

### Multilingual Support

- Detect the **language of user input automatically**.
- **Respond in the same language as the user**.
- Support: English, Spanish, French, German, Italian, Portuguese, Hindi, Japanese, Korean, Chinese.
- Use appropriate cultural context and politeness levels.
- For non-English languages, include **English translation in parentheses** when needed, especially for key extracted data or complex phrases.

---

### Core Instructions & Conversational Flow

- Always respond in a **friendly, professional manner**.
- Match the user's language and cultural context.
- **Extract all relevant data** from user messages when possible.
- Provide helpful suggestions and clear next steps.
- If user input relates to form filling, indicate this clearly.
- **Validate extracted data immediately** and report any issues before suggesting form fills.
- Respond naturally as if having a fluid conversation.
- For **check-in requests**, always indicate the opening of the check-in modal.
- For **check-out requests**, always indicate the opening of the check-out modal.
- For **room availability requests**, indicate the display of the availability modal.
- For **reservation searches**, confirm the search criteria and indicate the display of reservation details in the chat.
- **When a user provides partial information for a booking (e.g., just dates, or just guest count), acknowledge the received information and *concisely* ask only for the missing essential details required to complete the booking. Do not repeat information already extracted unless absolutely necessary for clarification.**
- **If a user provides enough information for a specific action (e.g., all details for a reservation), proactively confirm the details and ask for confirmation to proceed.**
- **Aim for a natural, flowing conversation, focusing on what's next rather than what's already known.**

---

### Handling Guest Details (Name, Email, Phone)

- **Prioritize extracting guest name, email, and phone number** when provided by the user.
- If a guest provides these details, acknowledge them and consider them "remembered" for the ongoing conversation.
- **When forming a reservation or check-in/check-out summary, intelligently use any remembered guest details (name, email, phone) to pre-fill or confirm information, even if not explicitly stated in the current turn.**
- **If a reservation intent is detected but guest name, email, or phone are still missing, politely ask for them.**
- If a user changes their guest details, update the remembered information accordingly.

---

### Date Interpretation Rules

- **Current Date: ${todayFormatted}**
- If user says "today", interpret as **${todayFormatted}**.
- If user says "tomorrow", interpret as **${tomorrowFormatted}**.
- If user says "today and tomorrow", set:
  - \`checkIn\`: ${todayFormatted}
  - \`checkOut\`: ${tomorrowFormatted}
- If user says "for X days" or "for 3 days", assume:
  - \`checkIn\`: ${todayFormatted}
  - \`checkOut\`: ${threeDaysFromNowFormatted} (adjust X accordingly, for example, 3 days from now)
- Ensure correct date arithmetic and formatting ("YYYY-MM-DD").

---

### Language-Specific Responses

- Spanish: Use formal "usted" for politeness, include "por favor" and "gracias".
- French: Use polite forms, "s'il vous plaît" and "merci".
- German: Use formal "Sie", include "bitte" and "danke".
- Italian: Use polite forms, "per favore" and "grazie".
- Portuguese: Use formal address, "por favor" and "obrigado/a".
- Hindi: Use respectful forms, "कृपया" and "धन्यवाद".
- Japanese: Use polite forms (です/ます), "お願いします" and "ありがとうございます".
- Korean: Use formal speech levels, "주세요" and "감사합니다".
- Chinese: Use polite forms, "请" and "谢谢".

---

### Hotel Information

**Available Room Types:**
- Ocean View King Suite ($299/night) - Luxurious suite with panoramic ocean views
- Deluxe Garden Room ($199/night) - Comfortable room overlooking beautiful gardens
- Family Oceanfront Suite ($399/night) - Spacious suite perfect for families
- Presidential Suite ($599/night) - Ultimate luxury with premium amenities
- Standard Double Room ($149/night) - Comfortable standard accommodation
- Luxury Spa Suite ($449/night) - Relaxation suite with spa amenities

**Payment Methods:**
- Credit Card
- Pay at Hotel
- UPI or Digital Wallet

---

### Critical Intent Mapping (DO NOT DEVIATE)

- "book room", "book hotel", "want to book", "make reservation" → ALWAYS use intent: **"reservation"**.
- "check availability", "show availability", "room availability" → ALWAYS use intent: **"availability"**.
- "check in", "guest check in" → ALWAYS use intent: **"checkin"**.
- "check out", "guest check out" → ALWAYS use intent: **"checkout"**.
- **CRITICAL:** When user says anything about BOOKING or RESERVING a room/hotel, **ALWAYS set intent to "reservation"**.
- **NEVER use "availability" intent for booking requests**. "availability" is ONLY for checking room status/calendar.

**Examples:**
- "I want to book a room" → intent: "reservation"
- "Book a hotel room" → intent: "reservation"
- "Reserve a room for July 15" → intent: "reservation"
- "Show room availability" → intent: "availability"
- "Check room calendar" → intent: "availability"
- "Book for today and tomorrow" → checkIn: ${todayFormatted}, checkOut: ${tomorrowFormatted}
- "Make a reservation for 3 days" → checkIn: ${todayFormatted}, checkOut: ${threeDaysFromNowFormatted}

---

### Response Format (JSON)

For each response, provide:
1. A natural, conversational response.
2. Any extracted data in structured format.
3. Whether the data should fill form fields (\${shouldFillForm}).
4. Validation status of extracted data (\`validationErrors\`).
5. Helpful suggestions for next steps.

---

**Intent-Specific Data Extraction Guidelines:**

- **For 'checkin' intent:**
  - Prioritize extracting: \`guestName\`, \`confirmationNumber\`, \`phone\`.
  - User phrases like: "I'm checking in now", "Check in guest John Doe", "Check in for reservation 12345", "My phone number is 123-456-7890, checking in".
  - If multiple identifiers are provided, extract all. If none, ask politely.

- **For 'checkout' intent:**
  - Prioritize extracting: \`guestName\`, \`confirmationNumber\`, \`phone\`.
  - User phrases like: "I want to check out", "Check out guest Jane Smith", "Checking out room 205", "My confirmation is 67890, I'm checking out".
  - If multiple identifiers are provided, extract all. If none, ask politely.

- **For 'availability' intent:**
  - Prioritize extracting: \`checkIn\`, \`checkOut\`, \`roomType\`, \`adults\`, \`children\`.
  - User phrases like: "Is the Presidential Suite available for next week?", "Check availability for 2 adults for 3 nights", "Are there any rooms for today and tomorrow?".
  - If specific dates or room types are mentioned, extract them. If not, ask for preferred dates/room types.

- **For 'search_reservation' intent:**
  - Prioritize extracting: \`guestName\`, \`phone\`, \`confirmationNumber\`.
  - User phrases like: "Find my reservation", "What's my booking?", "My name is Alice Wonderland, do I have a reservation?", "Can you find a booking for phone number 987-654-3210?", "Look up confirmation 54321".
  - Extract the search query (\`searchQuery\`) as the raw input for search if it contains a name, phone, or confirmation number that doesn't fit specific fields.

\`\`\`json
{
  "text": "conversational response",
  "intent": "reservation|checkin|checkout|availability|search_reservation|inquiry|help|reservation_list|error|unknown",
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
\`\`\`
`;

    return basePrompt;
  }


  private buildEnhancedPrompt(message: string, currentFormData?: VoiceProcessedData, currentGuestDetails?: { guestName?: string; email?: string; phone?: string }): string {
    const today = dayjs().format('YYYY-MM-DD');

    let prompt = `User message: "${message}"`;

    if (currentFormData && Object.keys(currentFormData).length > 0) {
      prompt += `\n\nCurrent form data (from UI, if any): ${JSON.stringify(currentFormData, null, 2)}`;
    }

    // Include sticky guest details in the prompt for Gemini to consider
    if (currentGuestDetails && Object.keys(currentGuestDetails).length > 0) {
      prompt += `\n\nRemembered Guest Details (from previous turns): ${JSON.stringify(currentGuestDetails, null, 2)}`;
    }

    prompt += `\n\nContext: ${this.currentContext}`;
    prompt += `\n\nToday's date is: ${today}`;
    prompt += `\n\nPlease analyze this message and provide a helpful response with any extractable data.`;

    // Instruct Gemini to use remembered details if new ones aren't provided
    prompt += `
If the user explicitly provides new guest name, email, or phone, prioritize those over "Remembered Guest Details".
Otherwise, if "Remembered Guest Details" are available and relevant to the current intent (e.g., reservation, check-in), use them to complete extractedData.
Do NOT include "Remembered Guest Details" in extractedData if they are not relevant or if the user explicitly provided new ones.
`;

    return prompt;
  }


  private parseGeminiResponse(text: string, originalMessage: string): GeminiResponse {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Merge currentGuestDetails into parsed.extractedData BEFORE validation
        // This ensures that the validation logic checks against the most complete set of data
        const mergedExtractedData: VoiceProcessedData = { ...this.currentGuestDetails, ...parsed.extractedData };

        const validatedResult = this.validateExtractedData(mergedExtractedData || {});

        return {
          text: parsed.text || text,
          intent: this.validateIntent(parsed.intent) || 'inquiry',
          confidence: parsed.confidence || 0.7,
          extractedData: validatedResult.data, // This will be the validated and potentially merged data
          shouldFillForm: validatedResult.isValid,
          validationErrors: validatedResult.errors,
          suggestions: parsed.suggestions || []
        };
      }
    } catch (error) {
      console.warn('Failed to parse JSON response from Gemini, using fallback:', error);
      console.warn('Original Gemini text response:', text);
    }

    const fallbackData = this.extractDataWithRegex(originalMessage);

    return {
      text: "I didn't quite understand that. Could you please rephrase or provide more details?",
      intent: this.detectIntent(originalMessage), // Try to detect intent even on parse failure
      confidence: 0.5,
      extractedData: fallbackData.data,
      shouldFillForm: fallbackData.hasValidData,
      validationErrors: fallbackData.errors.length > 0 ? fallbackData.errors : ['Could not parse Gemini JSON response'],
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

  private validateExtractedData(data: VoiceProcessedData): {
    data: VoiceProcessedData;
    isValid: boolean;
    errors: string[];
  } {
    const validatedData: VoiceProcessedData = {};
    const errors: string[] = [];

    const today = dayjs().startOf('day'); // Start of current day

    // Validate check-in date
    if (data.checkIn) {
      const checkInDayjs = dayjs(data.checkIn);
      if (!checkInDayjs.isValid()) {
        errors.push('Invalid check-in date format. Please use YYYY-MM-DD.');
      } else if (checkInDayjs.isBefore(today, 'day')) {
        errors.push('Check-in date cannot be in the past.');
      } else {
        validatedData.checkIn = checkInDayjs.format('YYYY-MM-DD');
      }
    }

    // Validate check-out date
    if (data.checkOut) {
      const checkOutDayjs = dayjs(data.checkOut);
      if (!checkOutDayjs.isValid()) {
        errors.push('Invalid check-out date format. Please use YYYY-MM-DD.');
      } else if (data.checkIn) {
        const checkInDayjs = dayjs(data.checkIn);
        if (!checkOutDayjs.isAfter(checkInDayjs, 'day')) { // Ensure it's strictly after check-in
          errors.push('Check-out date must be after check-in date.');
        } else {
          validatedData.checkOut = checkOutDayjs.format('YYYY-MM-DD');
        }
      } else {
        // If no check-in, just ensure it's not in the past
        if (checkOutDayjs.isBefore(today, 'day')) {
          errors.push('Check-out date cannot be in the past without a check-in date.');
        }
        validatedData.checkOut = checkOutDayjs.format('YYYY-MM-DD');
      }
    }

    // Validate guest counts
    if (data.adults !== undefined) {
      const adults = typeof data.adults === 'number' ? data.adults : parseInt(String(data.adults));
      if (isNaN(adults) || adults < 1 || adults > 10) { // Assuming min 1 adult
        errors.push('Number of adults must be between 1 and 10.');
      } else {
        validatedData.adults = adults;
      }
    }

    if (data.children !== undefined) {
      const children = typeof data.children === 'number' ? children : parseInt(String(data.children));
      if (isNaN(children) || children < 0 || children > 8) {
        errors.push('Number of children must be between 0 and 8.');
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
      // Perform a case-insensitive, partial match
      const matchedRoom = validRooms.find(room =>
        room.toLowerCase().includes(data.roomType!.toLowerCase())
      );

      if (matchedRoom) {
        validatedData.roomType = matchedRoom;
      } else {
        errors.push(`Invalid room type specified: "${data.roomType}". Please choose from available options.`);
      }
    }

    // Validate email
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(String(data.email))) {
        validatedData.email = data.email;
      } else {
        errors.push('Invalid email format. Please provide a valid email address.');
      }
    }

    // Validate phone
    if (data.phone) {
      // Allow for common phone formats, but clean to digits for validation and storage
      const cleanedPhone = String(data.phone).replace(/\D/g, ''); // Remove all non-digits
      if (cleanedPhone.length >= 8 && cleanedPhone.length <= 15) { // Common phone length range
        validatedData.phone = cleanedPhone;
      } else {
        errors.push('Invalid phone number format. Please provide at least 8 digits.');
      }
    }

    // Validate guest name
    if (data.guestName) {
      const name = String(data.guestName).trim();
      if (name.length >= 2 && name.split(' ').filter(n => n.length > 0).length >= 1) { // At least one non-empty word
        validatedData.guestName = name;
      } else {
        errors.push('Guest name must be at least 2 characters and contain a valid name.');
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
        errors.push('Invalid payment method. Please choose from Credit Card, Pay at Hotel, or UPI/Digital Wallet.');
      }
    }

    // Validate confirmation number for search
    if (data.confirmationNumber) {
      // Example validation: simple alphanumeric, adjust as per your system's format
      if (String(data.confirmationNumber).length > 3 && String(data.confirmationNumber).match(/^[a-zA-Z0-9]+$/)) {
        validatedData.confirmationNumber = data.confirmationNumber;
      } else {
        errors.push('Invalid confirmation number. Please provide a valid booking reference.');
      }
    }

    // Validate search query (if applicable for search_reservation intent)
    if (data.searchQuery) {
        if (String(data.searchQuery).trim().length > 2) {
            validatedData.searchQuery = String(data.searchQuery).trim();
        } else {
            errors.push('Search query must be at least 3 characters long.');
        }
    }


    // Determine if all necessary fields for a core action are present AND valid
    let isValidForm = errors.length === 0;

    // Additional check for 'reservation' intent: ensure all core fields are present
    // You can customize this based on what fields are *absolutely required* for your booking form
    // For a reservation, usually checkIn, checkOut, adults, roomType, guestName, email, phone are critical
    if (data.checkIn && data.checkOut && data.adults && data.roomType && data.guestName && data.email && data.phone && isValidForm) {
      // If all these critical fields are present AND valid, then the form should be filled
      isValidForm = true;
    } else if (data.checkIn || data.checkOut || data.adults || data.children || data.roomType || data.guestName || data.email || data.phone || data.paymentMethod) {
        // If some data is present, but not all critical fields are there/valid, don't auto-fill form
        // This means it's a partial input, so `shouldFillForm` will be false for now.
        isValidForm = false;
    } else {
        // If no relevant data at all, then definitely not filling a form
        isValidForm = false;
    }


    return {
      data: validatedData,
      isValid: isValidForm,
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

  private parseDate(dateStr: string): string {
    try {
      // Try multiple common formats
      let date = dayjs(dateStr, ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD-MM-YYYY', 'MMM D, YYYY', 'D MMM, YYYY', dayjs.ISO_8601]);
      if (date.isValid()) {
        return date.format('YYYY-MM-DD');
      }
    } catch (error) {
      console.warn('Failed to parse date with Day.js:', dateStr, error);
    }
    return ''; // Return empty string for invalid dates
  }

  private detectIntent(message: string): IntentType {
    const lowerMessage = message.toLowerCase();

    const detectedLanguage = this.detectLanguage(lowerMessage);
    console.log(`Detected language: ${detectedLanguage} for message: "${message}"`);

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

  public async speak(text: string, language: string = 'en-US'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported in this browser.'));
        return;
      }

      // Stop any current speech to avoid overlap
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.9; // Slightly slower for better comprehension
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onend = () => {
        console.log('Speech synthesis finished.');
        resolve();
      };
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        reject(event.error);
      };

      speechSynthesis.speak(utterance);
    });
  }

  public setContext(context: string): void {
    this.currentContext = context;
    console.log(`Context set to: ${context}`);
  }

  // Method to clear remembered guest details
  public clearGuestDetails(): void {
    this.currentGuestDetails = {};
    console.log("Guest details cleared.");
  }

  public async resetChat(): Promise<void> {
    this.chatSession = null;
    this.currentGuestDetails = {}; // Also clear guest details on full chat reset
    await this.startChat(this.currentContext);
    console.log("Gemini chat session reset.");
  }
}

export const geminiService = new GeminiService();

// Export processVoiceCommand function. This function handles the interaction flow
// from receiving a voice command to sending it to Gemini and then speaking the response.
// This is typically called from your UI's voice input handler.
export const processVoiceCommand = async (message: string, language: string = 'en') => {
  try {
    const response = await geminiService.sendMessage(message);

    // --- Frontend Logic for Speaking (Example of how you'd use GeminiResponse) ---
    let textToSpeak = response.text; // Start with Gemini's primary conversational response

    // If there are validation errors, explicitly mention them to the user.
    if (response.validationErrors && response.validationErrors.length > 0) {
        textToSpeak += ` Also, I noticed a few issues: ${response.validationErrors.join('. ')}. Could you please clarify?`;
    } else if (response.intent === 'reservation' && response.shouldFillForm && Object.keys(response.extractedData).length > 0) {
        // If it's a reservation intent, and the form should be filled (i.e., data is complete and valid)
        // You can customize the confirmation message here based on extractedData
        const { checkIn, checkOut, adults, children, roomType, guestName } = response.extractedData;
        let confirmationPart = `So, you'd like to book a ${roomType || 'room'} `;
        if (checkIn && checkOut) {
            confirmationPart += `from ${dayjs(checkIn).format('LL')} to ${dayjs(checkOut).format('LL')} `;
        } else if (checkIn) {
            confirmationPart += `starting on ${dayjs(checkIn).format('LL')} `;
        }
        if (adults !== undefined) {
            confirmationPart += `for ${adults} adult${adults > 1 ? 's' : ''} `;
            if (children !== undefined && children > 0) {
                confirmationPart += `and ${children} child${children > 1 ? 'ren' : ''} `;
            }
        }
        if (guestName) {
            confirmationPart += `under the name ${guestName}. `;
        }
        textToSpeak = `${response.text} ${confirmationPart} Does that sound correct?`;

    } else if (response.intent === 'reservation' && !response.shouldFillForm && Object.keys(response.extractedData).length > 0) {
        // If it's a reservation intent, but not enough data to fill the form (missing fields)
        const missingFields: string[] = [];
        if (!response.extractedData.checkIn || !response.extractedData.checkOut) missingFields.push('dates');
        if (response.extractedData.adults === undefined) missingFields.push('number of adults');
        if (!response.extractedData.roomType) missingFields.push('room type');
        // Add more critical fields as needed for your reservation
        if (missingFields.length > 0) {
            textToSpeak = `${response.text} I still need the ${missingFields.join(' and ')} to complete your booking.`;
        }
    }
    // You can add more specific speaking logic for other intents (checkin, checkout, etc.) here

    await geminiService.speak(textToSpeak, language);
    // --- End Frontend Logic for Speaking ---

    return {
      response: {
        text: response.text // The original conversational text from Gemini
      },
      intent: response.intent,
      extractedData: response.extractedData
    };
  } catch (error) {
    console.error('Voice command processing error:', error);
    // Optionally speak an error message if the entire process fails
    await geminiService.speak("I'm very sorry, but I encountered an error. Please try again or contact support.", language);
    return {
      response: {
        text: "I'm very sorry, but I encountered an error. Please try again or contact support."
      },
      intent: 'error',
      extractedData: {}
    };
  }
};