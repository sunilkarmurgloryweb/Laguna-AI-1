export interface GoogleGenerativeAI {
  getGenerativeModel(config: any): GenerativeModel;
}
export interface GenerativeModel {
  startChat(params: any): ChatSession;
}
export interface ChatSession {
  sendMessage(prompt: string): Promise<{ response: { text(): Promise<string> } }>;
}

export interface GeminiResponse {
  text: string;
  intent: string;
  confidence: number;
  extractedData: VoiceProcessedData;
  shouldFillForm: boolean;
  validationErrors: string[];
  suggestions: string[];
}

export interface VoiceProcessedData {
  [key: string]: any;
}

export interface SendMessageRequest {
  message: string;
  currentFormData?: VoiceProcessedData;
  context?: string;
}

export interface SendMessageResponse {
  response: GeminiResponse;
  chatMessage: ChatMessage;
}

