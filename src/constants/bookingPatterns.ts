import { IntentType } from '../types/reservation';

export const MULTILINGUAL_BOOKING_PATTERNS: Record<IntentType, Record<string, string[]>> = {
  reservation: {
    en: ['book', 'make reservation', 'reserve'],
    es: ['reservar', 'hacer una reserva'],
    fr: ['réserver', 'faire une réservation'],
    de: ['buchen', 'reservieren'],
    it: ['prenotare', 'fare una prenotazione'],
    pt: ['reservar', 'fazer uma reserva'],
    hi: ['बुक करना', 'आरक्षण करना'],
    ja: ['予約する', '予約したい'],
    ko: ['예약하다', '예약하고 싶어요'],
    zh: ['预订', '想预订']
  },
  availability: {
    en: ['check availability', 'show availability', 'available rooms'],
    es: ['ver disponibilidad', 'habitaciones disponibles'],
    fr: ['vérifier la disponibilité', 'chambres disponibles'],
    de: ['verfügbarkeit prüfen', 'verfügbare zimmer'],
    it: ['verificare disponibilità', 'camere disponibili'],
    pt: ['verificar disponibilidade', 'quartos disponíveis'],
    hi: ['उपलब्धता जांचें', 'खाली कमरे'],
    ja: ['空き状況を確認する', '利用可能な部屋'],
    ko: ['가능 여부 확인', '빈 방'],
    zh: ['查询空房', '可用房间']
  },
  checkin: {
    en: ['check in', 'i am checking in', 'check into hotel'],
    es: ['registrar entrada', 'hacer check-in'],
    fr: ['faire le check-in', 'm\'enregistrer'],
    de: ['einchecken', 'check-in machen'],
    it: ['fare il check-in', 'registrare l\'ingresso'],
    pt: ['fazer check-in', 'entrar no hotel'],
    hi: ['चेक-इन करना'],
    ja: ['チェックインする'],
    ko: ['체크인하다'],
    zh: ['办理入住']
  },
  checkout: {
    en: ['check out', 'i am checking out', 'check out from hotel'],
    es: ['registrar salida', 'hacer check-out'],
    fr: ['faire le check-out', 'quitter l\'hôtel'],
    de: ['auschecken', 'check-out machen'],
    it: ['fare il check-out', 'registrare l\'uscita'],
    pt: ['fazer check-out', 'sair do hotel'],
    hi: ['चेक-आउट करना'],
    ja: ['チェックアウトする'],
    ko: ['체크아웃하다'],
    zh: ['办理退房']
  },
  search_reservation: {
    en: ['find my reservation', 'what is my booking', 'check my booking'],
    es: ['encontrar mi reserva', 'cuál es mi reserva'],
    fr: ['trouver ma réservation', 'quelle est ma réservation'],
    de: ['meine reservierung finden', 'was ist meine buchung'],
    it: ['trova la mia prenotazione', 'qual è la mia prenotazione'],
    pt: ['encontrar minha reserva', 'qual é a minha reserva'],
    hi: ['मेरी बुकिंग ढूंढें', 'मेरा आरक्षण क्या है'],
    ja: ['予約を見つける', '私の予約は何ですか'],
    ko: ['예약 찾기', '내 예약이 뭐죠'],
    zh: ['查找我的预订', '我的预订是什么']
  },
  reservation_list: {
    en: ['show reservation list', 'my reservations list', 'all my bookings'],
    es: ['mostrar lista de reservas', 'mis reservas'],
    fr: ['afficher la liste des réservations', 'mes réservations'],
    de: ['reservierungsliste anzeigen', 'meine reservierungen'],
    it: ['mostra elenco prenotazioni', 'le mie prenotazioni'],
    pt: ['mostrar lista de reservas', 'minhas reservas'],
    hi: ['आरक्षण सूची दिखाएँ', 'मेरी सभी बुकिंग्स'],
    ja: ['予約リストを表示', '私の予約一覧'],
    ko: ['예약 목록 보기', '내 예약 내역'],
    zh: ['显示预订列表', '我的所有预订']
  },
  inquiry: {
    en: ['tell me about', 'what is', 'information about'],
    es: ['dime sobre', 'qué es', 'información sobre'],
    fr: ['parle-moi de', 'qu\'est-ce que', 'informations sur'],
    de: ['erzähl mir von', 'was ist', 'informationen über'],
    it: ['dimmi di', 'cos\'è', 'informazioni su'],
    pt: ['me diga sobre', 'o que é', 'informações sobre'],
    hi: ['बताओ', 'क्या है', 'के बारे में जानकारी'],
    ja: ['教えて', '何ですか', 'に関する情報'],
    ko: ['~에 대해 알려줘', '무엇인가요', '~에 대한 정보'],
    zh: ['告诉我关于', '什么', '关于...的信息']
  },
  help: {
    en: ['help', 'assist me', 'can you help'],
    es: ['ayuda', 'asístame', 'puedes ayudarme'],
    fr: ['aide', 'aidez-moi', 'pouvez-vous m\'aider'],
    de: ['hilfe', 'helfen sie mir', 'können sie helfen'],
    it: ['aiuto', 'aiutami', 'puoi aiutarmi'],
    pt: ['ajuda', 'ajude-me', 'pode ajudar'],
    hi: ['मदद', 'मेरी मदद करें'],
    ja: ['ヘルプ', '助けてください'],
    ko: ['도움', '도와주세요'],
    zh: ['帮助', '请帮助我']
  },
  error: { en: ['error'] }, // Should generally not be directly detected from user input
  unknown: { en: [''] } // Default if nothing matches
};