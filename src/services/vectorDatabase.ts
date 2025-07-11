// Vector Database Service for Natural Language Processing
// This simulates a vector database for intent recognition and entity extraction

interface VectorEmbedding {
  text: string;
  vector: number[];
  intent: string;
  entities?: Record<string, any>;
  confidence: number;
}

interface IntentPattern {
  intent: string;
  patterns: string[];
  entities: string[];
  examples: string[];
}

class VectorDatabaseService {
  private embeddings: VectorEmbedding[] = [];
  private intentPatterns: IntentPattern[] = [
    {
      intent: 'check_in_date',
      patterns: [
        'check in', 'checking date', 'arrival date', 'start date', 'from',
        'arriving', 'check-in', 'checkin', 'arrive on', 'coming on'
      ],
      entities: ['date'],
      examples: [
        'check in July 18',
        'checking date July 22',
        'arrival date 18 July',
        'arriving July 15'
      ]
    },
    {
      intent: 'check_out_date',
      patterns: [
        'check out', 'checkout date', 'departure date', 'end date', 'until',
        'departing', 'check-out', 'checkout', 'leaving on', 'depart on'
      ],
      entities: ['date'],
      examples: [
        'check out July 20',
        'checkout date July 25',
        'departure date 20 July',
        'departing July 18'
      ]
    },
    {
      intent: 'guest_count',
      patterns: [
        'adults', 'adult', 'people', 'person', 'guests', 'party of', 'group of',
        'children', 'child', 'kids', 'kid', 'have', 'with'
      ],
      entities: ['number', 'guest_type'],
      examples: [
        'I have two adults and one child',
        'party of four',
        'three adults',
        'with two kids'
      ]
    },
    {
      intent: 'room_selection',
      patterns: [
        'deluxe', 'king', 'family', 'suite', 'ocean', 'view', 'standard',
        'room', 'book', 'select', 'choose'
      ],
      entities: ['room_type'],
      examples: [
        'deluxe king room',
        'family suite',
        'ocean view room'
      ]
    },
    {
      intent: 'guest_info',
      patterns: [
        'name is', 'my name', 'i am', 'this is', 'speaking',
        'phone', 'number', 'contact', 'email', 'mail'
      ],
      entities: ['name', 'phone', 'email'],
      examples: [
        'my name is John Smith',
        'phone number 1234567890',
        'email john@example.com'
      ]
    },
    {
      intent: 'payment_method',
      patterns: [
        'credit card', 'pay at hotel', 'upi', 'digital wallet',
        'cash', 'payment', 'pay with'
      ],
      entities: ['payment_type'],
      examples: [
        'credit card',
        'pay at hotel',
        'upi payment'
      ]
    },
    {
      intent: 'missing_info_query',
      patterns: [
        'what missing', 'which information', 'what need', 'what required',
        'what else', 'what remaining', 'status', 'progress', 'incomplete',
        'help complete', 'what left'
      ],
      entities: [],
      examples: [
        'which information missing',
        'what do you need',
        'what else is required'
      ]
    },
    {
      intent: 'confirmation',
      patterns: [
        'yes confirm', 'confirm booking', 'book it', 'proceed',
        'yes', 'correct', 'looks good', 'that\'s right'
      ],
      entities: [],
      examples: [
        'yes confirm the booking',
        'proceed with booking',
        'that looks correct'
      ]
    },
    {
      intent: 'reservation_request',
      patterns: [
        'make reservation', 'book room', 'need room', 'want to book',
        'reserve', 'booking', 'availability', 'stay'
      ],
      entities: [],
      examples: [
        'make a reservation',
        'book a room',
        'need a hotel room'
      ]
    }
  ];

  constructor() {
    this.initializeEmbeddings();
  }

  // Simple text to vector conversion (in production, use actual embedding models)
  private textToVector(text: string): number[] {
    const words = text.toLowerCase().split(/\s+/);
    const vector = new Array(100).fill(0);
    
    words.forEach((word, index) => {
      const hash = this.simpleHash(word);
      vector[hash % 100] += 1;
    });
    
    // Normalize vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private initializeEmbeddings(): void {
    this.intentPatterns.forEach(pattern => {
      pattern.examples.forEach(example => {
        const embedding: VectorEmbedding = {
          text: example,
          vector: this.textToVector(example),
          intent: pattern.intent,
          confidence: 1.0
        };
        this.embeddings.push(embedding);
      });

      // Add pattern variations
      pattern.patterns.forEach(patternText => {
        const embedding: VectorEmbedding = {
          text: patternText,
          vector: this.textToVector(patternText),
          intent: pattern.intent,
          confidence: 0.8
        };
        this.embeddings.push(embedding);
      });
    });
  }

  // Calculate cosine similarity between two vectors
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  // Find the best matching intent for given text
  public findIntent(text: string, threshold: number = 0.3): {
    intent: string;
    confidence: number;
    entities: Record<string, any>;
  } | null {
    const inputVector = this.textToVector(text);
    let bestMatch: VectorEmbedding | null = null;
    let bestSimilarity = 0;

    this.embeddings.forEach(embedding => {
      const similarity = this.cosineSimilarity(inputVector, embedding.vector);
      if (similarity > bestSimilarity && similarity > threshold) {
        bestSimilarity = similarity;
        bestMatch = embedding;
      }
    });

    if (!bestMatch) return null;

    // Extract entities based on intent
    const entities = this.extractEntities(text, bestMatch.intent);

    return {
      intent: bestMatch.intent,
      confidence: bestSimilarity * bestMatch.confidence,
      entities
    };
  }

  // Extract entities from text based on intent
  private extractEntities(text: string, intent: string): Record<string, any> {
    const entities: Record<string, any> = {};
    const lowerText = text.toLowerCase();

    switch (intent) {
      case 'check_in_date':
      case 'check_out_date':
        entities.date = this.extractDate(text);
        break;

      case 'guest_count':
        const guestInfo = this.extractGuestCount(text);
        entities.adults = guestInfo.adults;
        entities.children = guestInfo.children;
        break;

      case 'room_selection':
        entities.room_type = this.extractRoomType(text);
        break;

      case 'guest_info':
        const personalInfo = this.extractPersonalInfo(text);
        entities.name = personalInfo.name;
        entities.phone = personalInfo.phone;
        entities.email = personalInfo.email;
        break;

      case 'payment_method':
        entities.payment_type = this.extractPaymentMethod(text);
        break;
    }

    return entities;
  }

  private extractDate(text: string): string | null {
    // Enhanced date extraction patterns
    const datePatterns = [
      // Month Day format
      /(\w+\s+\d{1,2})/i,
      // Day Month format
      /(\d{1,2}\s+\w+)/i,
      // Numeric formats
      /(\d{1,2}\/\d{1,2}(?:\/\d{4})?)/i,
      // With ordinals
      /(\d{1,2}(?:st|nd|rd|th)?\s+\w+)/i
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  private extractGuestCount(text: string): { adults: number; children: number } {
    const result = { adults: 0, children: 0 };

    // Number word to digit mapping
    const numberWords: Record<string, number> = {
      'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
      'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20
    };

    // Extract adults
    const adultPatterns = [
      /(?:a\s+)?(\w+|\d+)\s+adults?/i,
      /(\d+)\s+people/i,
      /party\s+of\s+(\d+)/i,
      /group\s+of\s+(\d+)/i
    ];

    for (const pattern of adultPatterns) {
      const match = text.match(pattern);
      if (match) {
        const value = match[1].toLowerCase();
        result.adults = numberWords[value] || parseInt(value) || 0;
        break;
      }
    }

    // Extract children
    const childPatterns = [
      /(?:a\s+)?(\w+|\d+)\s+(?:child|children|kids?)/i,
      /with\s+(\w+|\d+)\s+(?:child|children|kids?)/i,
      /plus\s+(\w+|\d+)\s+(?:child|children|kids?)/i
    ];

    for (const pattern of childPatterns) {
      const match = text.match(pattern);
      if (match) {
        const value = match[1].toLowerCase();
        result.children = numberWords[value] || parseInt(value) || 0;
        break;
      }
    }

    return result;
  }

  private extractRoomType(text: string): string | null {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('deluxe') && lowerText.includes('king')) {
      return 'Deluxe King Room';
    }
    if (lowerText.includes('family') && lowerText.includes('suite')) {
      return 'Family Suite';
    }
    if (lowerText.includes('ocean') && lowerText.includes('view')) {
      return 'Ocean View Room';
    }
    
    return null;
  }

  private extractPersonalInfo(text: string): { name: string; phone: string; email: string } {
    const result = { name: '', phone: '', email: '' };

    // Extract name
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

    // Extract phone
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
  }

  private extractPaymentMethod(text: string): string | null {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('credit') && lowerText.includes('card')) {
      return 'Credit Card';
    }
    if (lowerText.includes('pay') && lowerText.includes('hotel')) {
      return 'Pay at Hotel';
    }
    if (lowerText.includes('upi') || (lowerText.includes('digital') && lowerText.includes('wallet'))) {
      return 'UPI or Digital Wallet';
    }
    
    return null;
  }

  // Add new training data dynamically
  public addTrainingData(text: string, intent: string, entities: Record<string, any> = {}): void {
    const embedding: VectorEmbedding = {
      text,
      vector: this.textToVector(text),
      intent,
      entities,
      confidence: 1.0
    };
    this.embeddings.push(embedding);
  }

  // Get similar texts for a given input
  public findSimilarTexts(text: string, limit: number = 5): VectorEmbedding[] {
    const inputVector = this.textToVector(text);
    
    return this.embeddings
      .map(embedding => ({
        ...embedding,
        similarity: this.cosineSimilarity(inputVector, embedding.vector)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }
}

export const vectorDB = new VectorDatabaseService();