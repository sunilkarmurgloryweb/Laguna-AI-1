export interface LanguageConfig {
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
  },
  it: {
    code: 'it',
    name: 'Italiano',
    flag: '🇮🇹',
    speechCode: 'it-IT',
    voiceNames: ['Google italiano', 'Microsoft Cosimo', 'Alice'],
    greetings: {
      welcome: 'Benvenuti al Lagunacreek Resort & Spa! Posso aiutarvi con prenotazioni, check-in, check-out e disponibilità camere. Come posso assistervi oggi?',
      reservation: 'Vi aiuterò a fare una prenotazione. Per favore ditemi la vostra data di arrivo, partenza e numero di ospiti.',
      checkin: 'Vi aiuterò con il check-in. Per favore fornite il vostro numero di conferma o nome.',
      checkout: 'Vi aiuterò con il check-out. Lasciatemi rivedere il vostro conto e le spese.',
      roomAvailability: 'Controllerò la disponibilità delle camere per voi. Quali date state cercando?'
    },
    prompts: {
      dates: 'Per favore ditemi le vostre date di arrivo e partenza.',
      guests: 'Quanti adulti e bambini soggiorneranno?',
      roomType: 'Che tipo di camera preferite? Abbiamo Suite King Vista Mare, Camera Deluxe Garden, o Suite Familiare Fronte Mare.',
      guestInfo: 'Per favore fornite il vostro nome completo, numero di telefono e indirizzo email.',
      payment: 'Come vorreste pagare? Carta di credito, pagare in hotel, o portafoglio digitale?',
      confirmation: 'Per favore rivedete i dettagli della vostra prenotazione e dite "conferma" per completare la vostra prenotazione.'
    },
    responses: {
      dateConfirm: 'Capito. Arrivo: {checkin}, Partenza: {checkout}.',
      roomSelected: '{roomType} selezionata a ${price} per notte.',
      infoReceived: 'Grazie. Ho le vostre informazioni.',
      paymentSet: '{paymentMethod} selezionato.',
      bookingConfirmed: 'La vostra prenotazione è confermata! Numero di conferma: {confirmationId}',
      error: 'Non ho capito. Potreste ripetere per favore?',
      help: 'Posso aiutarvi con prenotazioni, check-in, check-out e disponibilità camere. Ditemi semplicemente di cosa avete bisogno.'
    }
  },
  pt: {
    code: 'pt',
    name: 'Português',
    flag: '🇵🇹',
    speechCode: 'pt-PT',
    voiceNames: ['Google português', 'Microsoft Helia', 'Joana'],
    greetings: {
      welcome: 'Bem-vindos ao Lagunacreek Resort & Spa! Posso ajudá-los com reservas, check-in, check-out e disponibilidade de quartos. Como posso assistir hoje?',
      reservation: 'Vou ajudá-los a fazer uma reserva. Por favor digam-me a vossa data de chegada, partida e número de hóspedes.',
      checkin: 'Vou ajudá-los com o check-in. Por favor forneçam o vosso número de confirmação ou nome.',
      checkout: 'Vou ajudá-los com o check-out. Deixem-me rever a vossa conta e despesas.',
      roomAvailability: 'Vou verificar a disponibilidade de quartos para vocês. Que datas procuram?'
    },
    prompts: {
      dates: 'Por favor digam-me as vossas datas de chegada e partida.',
      guests: 'Quantos adultos e crianças ficarão?',
      roomType: 'Que tipo de quarto preferem? Temos Suite King Vista Mar, Quarto Deluxe Garden, ou Suite Familiar Frente Mar.',
      guestInfo: 'Por favor forneçam o vosso nome completo, número de telefone e endereço de email.',
      payment: 'Como gostariam de pagar? Cartão de crédito, pagar no hotel, ou carteira digital?',
      confirmation: 'Por favor revejam os detalhes da vossa reserva e digam "confirmar" para completar a vossa reserva.'
    },
    responses: {
      dateConfirm: 'Entendido. Chegada: {checkin}, Partida: {checkout}.',
      roomSelected: '{roomType} selecionado a ${price} por noite.',
      infoReceived: 'Obrigado. Tenho as vossas informações.',
      paymentSet: '{paymentMethod} selecionado.',
      bookingConfirmed: 'A vossa reserva está confirmada! Número de confirmação: {confirmationId}',
      error: 'Não entendi isso. Poderiam repetir por favor?',
      help: 'Posso ajudá-los com reservas, check-in, check-out e disponibilidade de quartos. Digam-me simplesmente o que precisam.'
    }
  },
  ja: {
    code: 'ja',
    name: '日本語',
    flag: '🇯🇵',
    speechCode: 'ja-JP',
    voiceNames: ['Google 日本語', 'Microsoft Ayumi', 'Kyoko'],
    greetings: {
      welcome: 'ラグナクリークリゾート＆スパへようこそ！予約、チェックイン、チェックアウト、お部屋の空室状況についてお手伝いできます。本日はいかがお手伝いしましょうか？',
      reservation: 'ご予約のお手伝いをいたします。チェックイン日、チェックアウト日、ゲスト数をお教えください。',
      checkin: 'チェックインのお手伝いをいたします。確認番号またはお名前をお教えください。',
      checkout: 'チェックアウトのお手伝いをいたします。お会計と料金を確認させていただきます。',
      roomAvailability: 'お部屋の空室状況を確認いたします。どちらの日程をお探しですか？'
    },
    prompts: {
      dates: 'チェックイン日とチェックアウト日をお教えください。',
      guests: '大人と子供は何名様でしょうか？',
      roomType: 'どちらのお部屋タイプをご希望ですか？オーシャンビューキングスイート、デラックスガーデンルーム、ファミリーオーシャンフロントスイートがございます。',
      guestInfo: 'お名前、電話番号、メールアドレスをお教えください。',
      payment: 'お支払い方法はいかがいたしますか？クレジットカード、ホテルでのお支払い、デジタルウォレット？',
      confirmation: 'ご予約内容をご確認いただき、「確認」とおっしゃってご予約を完了してください。'
    },
    responses: {
      dateConfirm: '承知いたしました。チェックイン：{checkin}、チェックアウト：{checkout}。',
      roomSelected: '{roomType}を1泊${price}で選択されました。',
      infoReceived: 'ありがとうございます。お客様の情報を承りました。',
      paymentSet: '{paymentMethod}を選択されました。',
      bookingConfirmed: 'ご予約が確定いたしました！確認番号：{confirmationId}',
      error: '申し訳ございませんが、理解できませんでした。もう一度おっしゃっていただけますか？',
      help: '予約、チェックイン、チェックアウト、お部屋の空室状況についてお手伝いできます。ご用件をお聞かせください。'
    }
  },
  ko: {
    code: 'ko',
    name: '한국어',
    flag: '🇰🇷',
    speechCode: 'ko-KR',
    voiceNames: ['Google 한국어', 'Microsoft Heami', 'Seoyeon'],
    greetings: {
      welcome: '라구나크릭 리조트 앤 스파에 오신 것을 환영합니다! 예약, 체크인, 체크아웃, 객실 이용 가능 여부에 대해 도움을 드릴 수 있습니다. 오늘 어떻게 도와드릴까요?',
      reservation: '예약을 도와드리겠습니다. 체크인 날짜, 체크아웃 날짜, 투숙객 수를 알려주세요.',
      checkin: '체크인을 도와드리겠습니다. 확인 번호나 성함을 알려주세요.',
      checkout: '체크아웃을 도와드리겠습니다. 계산서와 요금을 확인해보겠습니다.',
      roomAvailability: '객실 이용 가능 여부를 확인해드리겠습니다. 어떤 날짜를 찾고 계신가요?'
    },
    prompts: {
      dates: '체크인 날짜와 체크아웃 날짜를 알려주세요.',
      guests: '성인과 어린이는 몇 명인가요?',
      roomType: '어떤 객실 유형을 원하시나요? 오션뷰 킹 스위트, 디럭스 가든 룸, 패밀리 오션프론트 스위트가 있습니다.',
      guestInfo: '성함, 전화번호, 이메일 주소를 알려주세요.',
      payment: '어떻게 결제하시겠습니까? 신용카드, 호텔에서 결제, 디지털 지갑?',
      confirmation: '예약 내용을 확인하시고 "확인"이라고 말씀해주시면 예약이 완료됩니다.'
    },
    responses: {
      dateConfirm: '알겠습니다. 체크인: {checkin}, 체크아웃: {checkout}.',
      roomSelected: '{roomType}이 1박당 ${price}로 선택되었습니다.',
      infoReceived: '감사합니다. 고객님의 정보를 받았습니다.',
      paymentSet: '{paymentMethod}이 선택되었습니다.',
      bookingConfirmed: '예약이 확정되었습니다! 확인 번호: {confirmationId}',
      error: '죄송합니다. 이해하지 못했습니다. 다시 말씀해 주시겠어요?',
      help: '예약, 체크인, 체크아웃, 객실 이용 가능 여부에 대해 도움을 드릴 수 있습니다. 무엇이 필요한지 말씀해 주세요.'
    }
  },
  zh: {
    code: 'zh',
    name: '中文',
    flag: '🇨🇳',
    speechCode: 'zh-CN',
    voiceNames: ['Google 中文', 'Microsoft Xiaoxiao', 'Xiaoyu'],
    greetings: {
      welcome: '欢迎来到拉古纳克里克度假村及水疗中心！我可以帮助您预订、办理入住、退房和查询客房可用性。今天我可以为您做些什么？',
      reservation: '我来帮您预订。请告诉我您的入住日期、退房日期和客人数量。',
      checkin: '我来帮您办理入住。请提供您的确认号码或姓名。',
      checkout: '我来帮您办理退房。让我查看您的账单和费用。',
      roomAvailability: '我来为您查询客房可用性。您在寻找哪些日期？'
    },
    prompts: {
      dates: '请告诉我您的入住和退房日期。',
      guests: '有多少成人和儿童入住？',
      roomType: '您希望哪种房型？我们有海景大床套房、豪华花园房或家庭海景套房。',
      guestInfo: '请提供您的全名、电话号码和电子邮件地址。',
      payment: '您希望如何付款？信用卡、到店付款还是数字钱包？',
      confirmation: '请查看您的预订详情并说"确认"来完成您的预订。'
    },
    responses: {
      dateConfirm: '明白了。入住：{checkin}，退房：{checkout}。',
      roomSelected: '已选择{roomType}，每晚${price}。',
      infoReceived: '谢谢。我已收到您的信息。',
      paymentSet: '已选择{paymentMethod}。',
      bookingConfirmed: '您的预订已确认！确认号码：{confirmationId}',
      error: '抱歉，我没有理解。您能再说一遍吗？',
      help: '我可以帮助您预订、办理入住、退房和查询客房可用性。请告诉我您需要什么。'
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

      try {
        // Stop any currently speaking utterance
        speechSynthesis.cancel();

        const lang = languageCode || this.currentLanguage;
        const utterance = new SpeechSynthesisUtterance(text);
        
        if (this.currentVoice && this.currentVoice.lang.startsWith(lang)) {
          utterance.voice = this.currentVoice;
        }
        
        utterance.lang = languageConfigs[lang]?.speechCode || 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onend = () => {
          console.log('Speech synthesis completed');
          resolve();
        };
        
        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
          reject(event.error);
        };
        
        utterance.onstart = () => {
          console.log('Speech synthesis started');
        };

        // Small delay to ensure previous speech is cancelled
        setTimeout(() => {
          if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
            setTimeout(() => {
              speechSynthesis.speak(utterance);
            }, 50);
          } else {
            speechSynthesis.speak(utterance);
          }
        }, 100);
      } catch (error) {
        console.error('Speech synthesis setup error:', error);
        reject(error);
      }
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

  public getResponse(type: keyof LanguageConfig['responses'], variables?: Record<string, string>, languageCode?: string): string {
    const lang = languageCode || this.currentLanguage;
    const config = languageConfigs[lang];
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
      'de': 'Deutsch',
      'it': 'Italiano',
      'pt': 'Português',
      'ja': '日本語',
      'ko': '한국어',
      'zh': '中文'
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
    
    // Enhanced detection with more patterns
    if (/[\u0900-\u097F]/.test(text)) return 'hi'; // Devanagari script
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh'; // Chinese characters
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja'; // Japanese hiragana/katakana
    if (/[\uac00-\ud7af]/.test(text)) return 'ko'; // Korean hangul
    
    // Word-based detection
    // Spanish detection
    if (/\b(hola|gracias|por favor|habitación|reserva|español|quiero|necesito|hotel|cuarto)\b/.test(lowerText)) return 'es';
    
    // French detection  
    if (/\b(bonjour|merci|chambre|réservation|français|voudrais|besoin|hôtel)\b/.test(lowerText)) return 'fr';
    
    // German detection
    if (/\b(hallo|danke|zimmer|reservierung|deutsch|möchte|brauche|hotel)\b/.test(lowerText)) return 'de';
    
    // Italian detection
    if (/\b(ciao|grazie|camera|prenotazione|italiano|vorrei|bisogno|albergo)\b/.test(lowerText)) return 'it';
    
    // Portuguese detection
    if (/\b(olá|obrigado|quarto|reserva|português|quero|preciso|hotel)\b/.test(lowerText)) return 'pt';
    
    // Hindi detection
    if (/\b(नमस्ते|धन्यवाद|कमरा|बुकिंग|होटल|आरक्षण|चाहिए|करना)\b/.test(lowerText)) return 'hi';
    
    // Japanese detection
    if (/\b(こんにちは|ありがとう|部屋|予約|ホテル|したい)\b/.test(lowerText)) return 'ja';
    
    // Korean detection
    if (/\b(안녕하세요|감사합니다|방|예약|호텔|하고싶어요)\b/.test(lowerText)) return 'ko';
    
    // Chinese detection
    if (/\b(你好|谢谢|房间|预订|酒店|想要)\b/.test(lowerText)) return 'zh';
    
    return 'en'; // Default to English
  }

  public translateText(text: string, targetLanguage: string): string {
    // This is a simplified translation service
    // In production, you would integrate with Google Translate API or similar
    const translations: Record<string, Record<string, string>> = {
      'hello': {
        'es': 'hola',
        'hi': 'नमस्ते',
        'fr': 'bonjour',
        'de': 'hallo',
        'it': 'ciao',
        'pt': 'olá',
        'ja': 'こんにちは',
        'ko': '안녕하세요',
        'zh': '你好'
      },
      'thank you': {
        'es': 'gracias',
        'hi': 'धन्यवाद',
        'fr': 'merci',
        'de': 'danke',
        'it': 'grazie',
        'pt': 'obrigado',
        'ja': 'ありがとう',
        'ko': '감사합니다',
        'zh': '谢谢'
      }
    };

    const lowerText = text.toLowerCase();
    for (const [english, translations_map] of Object.entries(translations)) {
      if (lowerText.includes(english)) {
        return translations_map[targetLanguage] || text;
      }
    }

    return text; // Return original if no translation found
  }
}

export const multilingualAI = new MultilingualAIService();