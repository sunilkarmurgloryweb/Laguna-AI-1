interface LanguageConfig {
  code: string;
  name: string;
  flag: string;
  speechCode: string;
  voiceNames: string[];
  greetings: {
    welcome: string;
    reservation: string;
    checkin: string;
    checkout: string;
    roomAvailability: string;
  };
  prompts: {
    dates: string;
    guests: string;
    roomType: string;
    guestInfo: string;
    payment: string;
    confirmation: string;
  };
  responses: {
    dateConfirm: string;
    roomSelected: string;
    infoReceived: string;
    paymentSet: string;
    bookingConfirmed: string;
    error: string;
    help: string;
  };
}

export const languageConfigs: Record<string, LanguageConfig> = {
  en: {
    code: 'en',
    name: 'English',
    flag: '🇺🇸',
    speechCode: 'en-US',
    voiceNames: ['Google US English', 'Microsoft Zira', 'Alex'],
    greetings: {
      welcome: 'Welcome to Lagunacreek Resort & Spa! I can help you with reservations, check-in, check-out, and room availability. How can I assist you today?',
      reservation: 'I\'ll help you make a reservation. Please tell me your check-in date, check-out date, and number of guests.',
      checkin: 'I\'ll help you check in. Please provide your confirmation number or name.',
      checkout: 'I\'ll help you check out. Let me review your folio and charges.',
      roomAvailability: 'I\'ll check room availability for you. What dates are you looking for?'
    },
    prompts: {
      dates: 'Please tell me your check-in and check-out dates.',
      guests: 'How many adults and children will be staying?',
      roomType: 'Which room type would you prefer? We have Ocean View King Suite, Deluxe Garden Room, or Family Oceanfront Suite.',
      guestInfo: 'Please provide your full name, phone number, and email address.',
      payment: 'How would you like to pay? Credit card, pay at hotel, or digital wallet?',
      confirmation: 'Please review your booking details and say "confirm" to complete your reservation.'
    },
    responses: {
      dateConfirm: 'Got it. Check-in: {checkin}, Check-out: {checkout}.',
      roomSelected: '{roomType} selected at ${price} per night.',
      infoReceived: 'Thank you. I have your information.',
      paymentSet: '{paymentMethod} selected.',
      bookingConfirmed: 'Your booking is confirmed! Confirmation number: {confirmationId}',
      error: 'I didn\'t understand that. Could you please repeat?',
      help: 'I can help you with reservations, check-in, check-out, and room availability. Just tell me what you need.'
    }
  },
  es: {
    code: 'es',
    name: 'Español',
    flag: '🇪🇸',
    speechCode: 'es-ES',
    voiceNames: ['Google español', 'Microsoft Helena', 'Mónica'],
    greetings: {
      welcome: '¡Bienvenido a Lagunacreek Resort & Spa! Puedo ayudarte con reservas, check-in, check-out y disponibilidad de habitaciones. ¿Cómo puedo asistirte hoy?',
      reservation: 'Te ayudaré a hacer una reserva. Por favor dime tu fecha de entrada, fecha de salida y número de huéspedes.',
      checkin: 'Te ayudaré con el check-in. Por favor proporciona tu número de confirmación o nombre.',
      checkout: 'Te ayudaré con el check-out. Déjame revisar tu cuenta y cargos.',
      roomAvailability: 'Verificaré la disponibilidad de habitaciones para ti. ¿Qué fechas buscas?'
    },
    prompts: {
      dates: 'Por favor dime tus fechas de entrada y salida.',
      guests: '¿Cuántos adultos y niños se hospedarán?',
      roomType: '¿Qué tipo de habitación prefieres? Tenemos Suite King Vista al Mar, Habitación Deluxe Garden, o Suite Familiar Frente al Mar.',
      guestInfo: 'Por favor proporciona tu nombre completo, número de teléfono y dirección de email.',
      payment: '¿Cómo te gustaría pagar? Tarjeta de crédito, pagar en el hotel, o billetera digital?',
      confirmation: 'Por favor revisa los detalles de tu reserva y di "confirmar" para completar tu reservación.'
    },
    responses: {
      dateConfirm: 'Entendido. Entrada: {checkin}, Salida: {checkout}.',
      roomSelected: '{roomType} seleccionada a ${price} por noche.',
      infoReceived: 'Gracias. Tengo tu información.',
      paymentSet: '{paymentMethod} seleccionado.',
      bookingConfirmed: '¡Tu reserva está confirmada! Número de confirmación: {confirmationId}',
      error: 'No entendí eso. ¿Podrías repetir por favor?',
      help: 'Puedo ayudarte con reservas, check-in, check-out y disponibilidad de habitaciones. Solo dime qué necesitas.'
    }
  },
  hi: {
    code: 'hi',
    name: 'हिंदी',
    flag: '🇮🇳',
    speechCode: 'hi-IN',
    voiceNames: ['Google हिन्दी', 'Microsoft Hemant', 'Kalpana'],
    greetings: {
      welcome: 'लगुनाक्रीक रिसॉर्ट एंड स्पा में आपका स्वागत है! मैं आपकी बुकिंग, चेक-इन, चेक-आउट और कमरों की उपलब्धता में मदद कर सकता हूं। आज मैं आपकी कैसे सहायता कर सकता हूं?',
      reservation: 'मैं आपकी बुकिंग में मदद करूंगा। कृपया अपनी चेक-इन तारीख, चेक-आउट तारीख और मेहमानों की संख्या बताएं।',
      checkin: 'मैं आपकी चेक-इन में मदद करूंगा। कृपया अपना कन्फर्मेशन नंबर या नाम बताएं।',
      checkout: 'मैं आपकी चेक-आउट में मदद करूंगा। मुझे आपका बिल और चार्जेस देखने दें।',
      roomAvailability: 'मैं आपके लिए कमरों की उपलब्धता चेक करूंगा। आप कौन सी तारीखें देख रहे हैं?'
    },
    prompts: {
      dates: 'कृपया अपनी चेक-इन और चेक-आउट तारीखें बताएं।',
      guests: 'कितने वयस्क और बच्चे रुकेंगे?',
      roomType: 'आप कौन सा कमरा पसंद करेंगे? हमारे पास ओशन व्यू किंग सूट, डीलक्स गार्डन रूम, या फैमिली ओशनफ्रंट सूट है।',
      guestInfo: 'कृपया अपना पूरा नाम, फोन नंबर और ईमेल पता बताएं।',
      payment: 'आप कैसे भुगतान करना चाहेंगे? क्रेडिट कार्ड, होटल में भुगतान, या डिजिटल वॉलेट?',
      confirmation: 'कृपया अपनी बुकिंग की जानकारी देखें और अपना आरक्षण पूरा करने के लिए "कन्फर्म" कहें।'
    },
    responses: {
      dateConfirm: 'समझ गया। चेक-इन: {checkin}, चेक-आउट: {checkout}।',
      roomSelected: '{roomType} चुना गया ${price} प्रति रात।',
      infoReceived: 'धन्यवाद। मेरे पास आपकी जानकारी है।',
      paymentSet: '{paymentMethod} चुना गया।',
      bookingConfirmed: 'आपकी बुकिंग कन्फर्म हो गई! कन्फर्मेशन नंबर: {confirmationId}',
      error: 'मैं समझ नहीं पाया। कृपया दोबारा कहें?',
      help: 'मैं बुकिंग, चेक-इन, चेक-आउट और कमरों की उपलब्धता में मदद कर सकता हूं। बस बताएं कि आपको क्या चाहिए।'
    }
  },
  fr: {
    code: 'fr',
    name: 'Français',
    flag: '🇫🇷',
    speechCode: 'fr-FR',
    voiceNames: ['Google français', 'Microsoft Julie', 'Amélie'],
    greetings: {
      welcome: 'Bienvenue au Lagunacreek Resort & Spa! Je peux vous aider avec les réservations, l\'enregistrement, le départ et la disponibilité des chambres. Comment puis-je vous aider aujourd\'hui?',
      reservation: 'Je vais vous aider à faire une réservation. Veuillez me dire votre date d\'arrivée, date de départ et nombre d\'invités.',
      checkin: 'Je vais vous aider avec l\'enregistrement. Veuillez fournir votre numéro de confirmation ou nom.',
      checkout: 'Je vais vous aider avec le départ. Laissez-moi examiner votre facture et frais.',
      roomAvailability: 'Je vais vérifier la disponibilité des chambres pour vous. Quelles dates recherchez-vous?'
    },
    prompts: {
      dates: 'Veuillez me dire vos dates d\'arrivée et de départ.',
      guests: 'Combien d\'adultes et d\'enfants séjourneront?',
      roomType: 'Quel type de chambre préférez-vous? Nous avons Suite King Vue Océan, Chambre Deluxe Garden, ou Suite Familiale Front de Mer.',
      guestInfo: 'Veuillez fournir votre nom complet, numéro de téléphone et adresse email.',
      payment: 'Comment souhaitez-vous payer? Carte de crédit, payer à l\'hôtel, ou portefeuille numérique?',
      confirmation: 'Veuillez examiner les détails de votre réservation et dire "confirmer" pour compléter votre réservation.'
    },
    responses: {
      dateConfirm: 'Compris. Arrivée: {checkin}, Départ: {checkout}.',
      roomSelected: '{roomType} sélectionnée à ${price} par nuit.',
      infoReceived: 'Merci. J\'ai vos informations.',
      paymentSet: '{paymentMethod} sélectionné.',
      bookingConfirmed: 'Votre réservation est confirmée! Numéro de confirmation: {confirmationId}',
      error: 'Je n\'ai pas compris. Pourriez-vous répéter s\'il vous plaît?',
      help: 'Je peux vous aider avec les réservations, l\'enregistrement, le départ et la disponibilité des chambres. Dites-moi simplement ce dont vous avez besoin.'
    }
  },
  de: {
    code: 'de',
    name: 'Deutsch',
    flag: '🇩🇪',
    speechCode: 'de-DE',
    voiceNames: ['Google Deutsch', 'Microsoft Katja', 'Anna'],
    greetings: {
      welcome: 'Willkommen im Lagunacreek Resort & Spa! Ich kann Ihnen bei Reservierungen, Check-in, Check-out und Zimmerverfügbarkeit helfen. Wie kann ich Ihnen heute helfen?',
      reservation: 'Ich helfe Ihnen bei einer Reservierung. Bitte teilen Sie mir Ihr Anreise-, Abreisedatum und die Anzahl der Gäste mit.',
      checkin: 'Ich helfe Ihnen beim Check-in. Bitte geben Sie Ihre Bestätigungsnummer oder Ihren Namen an.',
      checkout: 'Ich helfe Ihnen beim Check-out. Lassen Sie mich Ihre Rechnung und Gebühren überprüfen.',
      roomAvailability: 'Ich überprüfe die Zimmerverfügbarkeit für Sie. Welche Daten suchen Sie?'
    },
    prompts: {
      dates: 'Bitte teilen Sie mir Ihre Anreise- und Abreisedaten mit.',
      guests: 'Wie viele Erwachsene und Kinder werden übernachten?',
      roomType: 'Welchen Zimmertyp bevorzugen Sie? Wir haben Ocean View King Suite, Deluxe Garden Room oder Family Oceanfront Suite.',
      guestInfo: 'Bitte geben Sie Ihren vollständigen Namen, Telefonnummer und E-Mail-Adresse an.',
      payment: 'Wie möchten Sie bezahlen? Kreditkarte, im Hotel bezahlen oder digitale Geldbörse?',
      confirmation: 'Bitte überprüfen Sie Ihre Buchungsdetails und sagen Sie "bestätigen", um Ihre Reservierung abzuschließen.'
    },
    responses: {
      dateConfirm: 'Verstanden. Anreise: {checkin}, Abreise: {checkout}.',
      roomSelected: '{roomType} ausgewählt für ${price} pro Nacht.',
      infoReceived: 'Danke. Ich habe Ihre Informationen.',
      paymentSet: '{paymentMethod} ausgewählt.',
      bookingConfirmed: 'Ihre Buchung ist bestätigt! Bestätigungsnummer: {confirmationId}',
      error: 'Das habe ich nicht verstanden. Könnten Sie das bitte wiederholen?',
      help: 'Ich kann Ihnen bei Reservierungen, Check-in, Check-out und Zimmerverfügbarkeit helfen. Sagen Sie mir einfach, was Sie brauchen.'
    }
  }
};

class MultilingualAIService {
  private currentLanguage: string = 'en';
  private currentVoice: SpeechSynthesisVoice | null = null;
  private availableVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    this.initializeVoices();
  }

  private initializeVoices() {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        this.availableVoices = speechSynthesis.getVoices();
        this.setVoiceForLanguage(this.currentLanguage);
      };

      loadVoices();
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  public setLanguage(languageCode: string) {
    if (languageConfigs[languageCode]) {
      this.currentLanguage = languageCode;
      this.setVoiceForLanguage(languageCode);
    }
  }

  private setVoiceForLanguage(languageCode: string) {
    const config = languageConfigs[languageCode];
    if (!config) return;

    // Find the best voice for this language
    const preferredVoice = this.availableVoices.find(voice => 
      voice.lang.startsWith(config.speechCode) || 
      config.voiceNames.some(name => voice.name.includes(name))
    );

    if (preferredVoice) {
      this.currentVoice = preferredVoice;
    } else {
      // Fallback to any voice that matches the language code
      this.currentVoice = this.availableVoices.find(voice => 
        voice.lang.startsWith(languageCode)
      ) || null;
    }
  }

  public speak(text: string, languageCode?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      const lang = languageCode || this.currentLanguage;
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (this.currentVoice && this.currentVoice.lang.startsWith(lang)) {
        utterance.voice = this.currentVoice;
      }
      
      utterance.lang = languageConfigs[lang]?.speechCode || 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(event.error);

      speechSynthesis.speak(utterance);
    });
  }

  public getGreeting(type: keyof LanguageConfig['greetings']): string {
    const config = languageConfigs[this.currentLanguage];
    return config?.greetings[type] || languageConfigs.en.greetings[type];
  }

  public getPrompt(type: keyof LanguageConfig['prompts']): string {
    const config = languageConfigs[this.currentLanguage];
    return config?.prompts[type] || languageConfigs.en.prompts[type];
  }

  public getResponse(type: keyof LanguageConfig['responses'], variables?: Record<string, string>): string {
    const config = languageConfigs[this.currentLanguage];
    let response = config?.responses[type] || languageConfigs.en.responses[type];
    
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        response = response.replace(`{${key}}`, value);
      });
    }
    
    return response;
  }

  public getSpeechRecognitionLanguage(): string {
    const config = languageConfigs[this.currentLanguage];
    return config?.speechCode || 'en-US';
  }

  public getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  public getAvailableLanguages(): Array<{code: string, name: string, flag: string}> {
    return Object.values(languageConfigs).map(config => ({
      code: config.code,
      name: config.name,
      flag: config.flag
    }));
  }

  public getLanguageInfo(code: string): {code: string, name: string, flag: string, nativeName?: string} {
    const config = languageConfigs[code];
    const nativeNames: Record<string, string> = {
      'en': 'English',
      'es': 'Español', 
      'hi': 'हिंदी',
      'fr': 'Français',
      'de': 'Deutsch'
    };
    
    return {
      code: config?.code || 'en',
      name: config?.name || 'English',
      flag: config?.flag || '🇺🇸',
      nativeName: nativeNames[code] || 'English'
    };
  }

  public detectLanguageFromText(text: string): string {
    // Simple language detection based on common words/patterns
    const lowerText = text.toLowerCase();
    
    if (/\b(hola|gracias|por favor|habitación|reserva)\b/.test(lowerText)) return 'es';
    if (/\b(नमस्ते|धन्यवाद|कमरा|बुकिंग)\b/.test(lowerText)) return 'hi';
    if (/\b(bonjour|merci|chambre|réservation)\b/.test(lowerText)) return 'fr';
    if (/\b(hallo|danke|zimmer|reservierung)\b/.test(lowerText)) return 'de';
    
    return 'en'; // Default to English
  }
}

export const multilingualAI = new MultilingualAIService();