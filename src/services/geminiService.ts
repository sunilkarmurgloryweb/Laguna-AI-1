import { GoogleGenerativeAI, GenerativeModel, ChatSession } from '@google/generative-ai';

export interface GeminiResponse {
  text: string;
  intent: string;
  confidence: number;
  extractedData: Record<string, unknown>;
  shouldFillForm: boolean;
  validationErrors: string[];
  suggestions: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date | string;
  extractedData?: Record<string, unknown>;
  formFilled?: boolean;
}

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

  public async sendMessage(message: string, currentFormData?: Record<string, unknown>): Promise<GeminiResponse> {
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
- Ocean View King Suite ($299/night)
- Deluxe Garden Room ($199/night)  
- Family Oceanfront Suite ($399/night)
- Presidential Suite ($599/night)
- Standard Double Room ($149/night)
- Luxury Spa Suite ($449/night)

Payment Methods:
- Credit Card
- Pay at Hotel
- UPI or Digital Wallet

Voice Command Examples (Multilingual):
English: "Make a reservation" / "Book a room" / "Check in" / "Check out" / "Room availability"
Spanish: "Hacer una reserva" / "Reservar una habitación" / "Registrarse" / "Salir" / "Disponibilidad"
French: "Faire une réservation" / "Réserver une chambre" / "Enregistrement" / "Départ" / "Disponibilité"
German: "Reservierung machen" / "Zimmer buchen" / "Einchecken" / "Auschecken" / "Verfügbarkeit"
Italian: "Fare una prenotazione" / "Prenotare una camera" / "Check-in" / "Check-out" / "Disponibilità"
Portuguese: "Fazer uma reserva" / "Reservar um quarto" / "Check-in" / "Check-out" / "Disponibilidade"
Hindi: "आरक्षण करना" / "कमरा बुक करना" / "चेक इन" / "चेक आउट" / "उपलब्धता"
Japanese: "予約する" / "部屋を予約" / "チェックイン" / "チェックアウト" / "空室状況"
Korean: "예약하기" / "방 예약" / "체크인" / "체크아웃" / "객실 현황"
Chinese: "预订" / "订房间" / "入住" / "退房" / "房间状况"

IMPORTANT: When user expresses intent to book, check-in, check-out, or check availability, 
ALWAYS set the correct intent in your response and provide a helpful message about opening the modal.

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

  private buildEnhancedPrompt(message: string, currentFormData?: Record<string, unknown>): string {
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
          intent: parsed.intent || 'inquiry',
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

  private validateExtractedData(data: Record<string, unknown>): {
    data: Record<string, unknown>;
    isValid: boolean;
    errors: string[];
  } {
    const validatedData: Record<string, unknown> = {};
    const errors: string[] = [];

    // Validate dates
    if (data.checkIn) {
      const checkInDate = new Date(data.checkIn);
      if (isNaN(checkInDate.getTime())) {
        errors.push('Invalid check-in date format');
      } else if (checkInDate < new Date()) {
        errors.push('Check-in date cannot be in the past');
      } else {
        validatedData.checkIn = data.checkIn;
      }
    }

    if (data.checkOut) {
      const checkOutDate = new Date(data.checkOut);
      if (isNaN(checkOutDate.getTime())) {
        errors.push('Invalid check-out date format');
      } else if (data.checkIn && checkOutDate <= new Date(data.checkIn)) {
        errors.push('Check-out date must be after check-in date');
      } else {
        validatedData.checkOut = data.checkOut;
      }
    }

    // Validate guest counts
    if (data.adults !== undefined) {
      const adults = parseInt(data.adults);
      if (isNaN(adults) || adults < 1 || adults > 10) {
        errors.push('Adults must be between 1 and 10');
      } else {
        validatedData.adults = adults;
      }
    }

    if (data.children !== undefined) {
      const children = parseInt(data.children);
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
      if (emailRegex.test(data.email)) {
        validatedData.email = data.email;
      } else {
        errors.push('Invalid email format');
      }
    }

    // Validate phone
    if (data.phone) {
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
      if (phoneRegex.test(data.phone)) {
        validatedData.phone = data.phone.replace(/\D/g, '');
      } else {
        errors.push('Invalid phone number format');
      }
    }

    // Validate guest name
    if (data.guestName) {
      if (data.guestName.trim().length >= 2) {
        validatedData.guestName = data.guestName.trim();
      } else {
        errors.push('Guest name must be at least 2 characters');
      }
    }

    // Validate payment method
    if (data.paymentMethod) {
      const validMethods = ['Credit Card', 'Pay at Hotel', 'UPI or Digital Wallet'];
      const matchedMethod = validMethods.find(method =>
        method.toLowerCase().includes(data.paymentMethod.toLowerCase()) ||
        data.paymentMethod.toLowerCase().includes(method.toLowerCase())
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
    data: Record<string, unknown>;
    hasValidData: boolean;
    errors: string[];
  } {
    const data: Record<string, unknown> = {};
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

  private detectIntent(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Enhanced reservation detection (multilingual)
    if (lowerMessage.match(/\b(book|reserve|reservation|make.*booking|want.*book|book.*room|new.*reservation|make.*reservation|hacer.*reserva|reservar|réserver|buchen|prenotare|reservar|आरक्षण|बुकिंग|予約|예약|预订)\b/)) {
      return 'reservation';
    }
    
    // Enhanced check-in detection (multilingual)
    if (lowerMessage.match(/\b(check.?in|checking.?in|want.*check.?in|guest.*check.?in|arrival|arrive|registrarse|enregistrement|einchecken|check.?in|चेक.*इन|チェックイン|체크인|入住)\b/)) {
      return 'checkin';
    }
    
    // Enhanced check-out detection (multilingual)
    if (lowerMessage.match(/\b(check.?out|checking.?out|want.*check.?out|guest.*check.?out|departure|leave|salir|départ|auschecken|check.?out|चेक.*आउट|チェックアウト|체크아웃|退房)\b/)) {
      return 'checkout';
    }
    
    // Enhanced availability detection (multilingual)
    if (lowerMessage.match(/\b(available|availability|rooms.*available|display.*room|show.*room|room.*availability|check.*availability|vacant.*rooms|free.*rooms|calendar|disponibilidad|disponible|disponibilité|verfügbarkeit|disponibilità|उपलब्धता|空室|객실.*현황|房间.*状况)\b/)) {
      return 'availability';
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