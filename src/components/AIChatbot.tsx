import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Mic, MicOff, Volume2, Globe, X, Minimize2, Send } from 'lucide-react';
import { multilingualAI } from '../services/multilingualAIService';
import voiceReservationService from '../services/voiceReservationService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  language?: string;
  data?: any;
}

interface AIChatbotProps {
  onOpenModal: (modalType: 'reservation' | 'checkin' | 'checkout' | 'availability', data?: any) => void;
}

const AIChatbot: React.FC<AIChatbotProps> = ({ onOpenModal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const availableLanguages = [
    { code: 'en', name: 'English', flag: '🇺🇸', description: 'English - Voice & Text Support' },
    { code: 'es', name: 'Español', flag: '🇪🇸', description: 'Español - Soporte de voz y texto' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳', description: 'हिंदी - आवाज और पाठ समर्थन' },
    { code: 'fr', name: 'Français', flag: '🇫🇷', description: 'Français - Support vocal et textuel' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪', description: 'Deutsch - Sprach- und Textunterstützung' }
  ];

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = getLanguageCode(currentLanguage);
      
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleVoiceInput(transcript);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, [currentLanguage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getLanguageCode = (lang: string) => {
    const codes: { [key: string]: string } = {
      'en': 'en-US',
      'es': 'es-ES',
      'hi': 'hi-IN',
      'fr': 'fr-FR',
      'de': 'de-DE'
    };
    return codes[lang] || 'en-US';
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLanguageSelect = async (languageCode: string) => {
    setCurrentLanguage(languageCode);
    multilingualAI.setLanguage(languageCode);
    setShowLanguageSelector(false);
    
    // Update speech recognition language
    if (recognition) {
      recognition.lang = getLanguageCode(languageCode);
    }
    
    // Add welcome message in selected language
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      text: multilingualAI.getResponse('welcome', {}, languageCode),
      sender: 'ai',
      timestamp: new Date(),
      language: languageCode
    };
    setMessages([welcomeMessage]);
    
    // Speak welcome message
    await multilingualAI.speak(welcomeMessage.text, languageCode);
  };

  const handleVoiceInput = async (transcript: string) => {
    if (!transcript.trim()) return;

    // Auto-detect language from voice input
    const detectedLanguage = multilingualAI.detectLanguageFromText(transcript);
    if (detectedLanguage !== currentLanguage) {
      setCurrentLanguage(detectedLanguage);
      multilingualAI.setLanguage(detectedLanguage);
      
      // Add language switch message
      const languageInfo = multilingualAI.getLanguageInfo(detectedLanguage);
      const switchMessage: Message = {
        id: Date.now().toString() + '_lang_switch',
        text: `Language switched to ${languageInfo.name} ${languageInfo.flag}`,
        sender: 'ai',
        timestamp: new Date(),
        language: detectedLanguage
      };
      setMessages(prev => [...prev, switchMessage]);
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: transcript,
      sender: 'user',
      timestamp: new Date(),
      language: detectedLanguage
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      setIsProcessing(true);
      
      // Process the voice command
      const response = await voiceReservationService.processVoiceCommand(
        transcript,
        currentLanguage,
        onOpenModal,
        detectedLanguage
      );

      // Add AI response
      const aiMessage: Message = {
        id: Date.now().toString() + '_ai',
        text: response.message,
        sender: 'ai',
        timestamp: new Date(),
        language: detectedLanguage,
        data: response.extractedData
      };
      setMessages(prev => [...prev, aiMessage]);

      // Speak the response in the appropriate language
      await multilingualAI.speak(response.message, detectedLanguage);
      
    } catch (error) {
      console.error('Voice processing error:', error);
      const errorMessage: Message = {
        id: Date.now().toString() + '_error',
        text: multilingualAI.getResponse('error', {}, detectedLanguage),
        sender: 'ai',
        timestamp: new Date(),
        language: detectedLanguage
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const startVoiceRecognition = () => {
    if (recognition && !isListening) {
      setIsListening(true);
      recognition.start();
    }
  };

  const stopVoiceRecognition = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  };

  const handleTextInput = async (text: string) => {
    if (!text.trim()) return;

    // Auto-detect language from text input
    const detectedLanguage = multilingualAI.detectLanguageFromText(text);
    if (detectedLanguage !== currentLanguage) {
      setCurrentLanguage(detectedLanguage);
      multilingualAI.setLanguage(detectedLanguage);
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: text,
      sender: 'user',
      timestamp: new Date(),
      language: detectedLanguage
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      setIsProcessing(true);
      setIsTyping(true);
      
      // Process the text command
      const response = await voiceReservationService.processVoiceCommand(
        text,
        currentLanguage,
        onOpenModal,
        detectedLanguage
      );

      // Add AI response
      const aiMessage: Message = {
        id: Date.now().toString() + '_ai',
        text: response.message,
        sender: 'ai',
        timestamp: new Date(),
        language: detectedLanguage,
        data: response.extractedData
      };
      setMessages(prev => [...prev, aiMessage]);

      // Speak the response
      await multilingualAI.speak(response.message, detectedLanguage);
      
    } catch (error) {
      console.error('Text processing error:', error);
      const errorMessage: Message = {
        id: Date.now().toString() + '_error',
        text: multilingualAI.getResponse('error', {}, detectedLanguage),
        sender: 'ai',
        timestamp: new Date(),
        language: detectedLanguage
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      setIsTyping(false);
    }
  };

  const handleSendMessage = () => {
    if (inputText.trim()) {
      handleTextInput(inputText);
      setInputText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const openChatbot = () => {
    setIsOpen(true);
    setIsMinimized(false);
    if (messages.length === 0) {
      setShowLanguageSelector(true);
    }
  };

  const minimizeChatbot = () => {
    setIsMinimized(true);
  };

  const closeChatbot = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setShowLanguageSelector(false);
  };

  // Two-button layout when minimized or closed
  if (!isOpen || isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 flex flex-col space-y-3 z-50">
        {/* Voice Button */}
        <button
          onClick={startVoiceRecognition}
          disabled={isListening}
          className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-gray-600 hover:bg-gray-700'
          }`}
        >
          {isListening ? (
            <MicOff className="w-6 h-6 text-white" />
          ) : (
            <Mic className="w-6 h-6 text-white" />
          )}
        </button>

        {/* AI Assistant Button */}
        <button
          onClick={openChatbot}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Language Selection Screen */}
      {showLanguageSelector && (
        <div className="absolute inset-0 bg-white rounded-lg z-10 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5" />
                <h3 className="font-semibold">Choose Your Language</h3>
              </div>
              <button
                onClick={closeChatbot}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Language Options */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Welcome to Lagunacreek</h2>
              <p className="text-gray-600">Select your preferred language for voice and text assistance</p>
            </div>

            <div className="space-y-3">
              {availableLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang.code)}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{lang.flag}</span>
                    <div>
                      <div className="font-semibold text-gray-800 group-hover:text-blue-600">
                        {lang.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {lang.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Features Panel */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">Voice Assistant Features</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Multi-language speech recognition</li>
                <li>• Natural language understanding</li>
                <li>• Real-time voice responses</li>
                <li>• Complete reservation management</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Chat Interface */}
      {!showLanguageSelector && (
        <>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">AI Assistant</h3>
                  <div className="text-xs opacity-90">
                    {isTyping ? 'Typing...' : `Online - ${availableLanguages.find(l => l.code === currentLanguage)?.name}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowLanguageSelector(true)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                </button>
                <button
                  onClick={minimizeChatbot}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={closeChatbot}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {message.language && message.language !== 'en' && (
                      <span className="ml-2">
                        {availableLanguages.find(l => l.code === message.language)?.flag}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm">Processing...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message or use voice..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                  <span className="text-xs text-gray-500">
                    {availableLanguages.find(l => l.code === currentLanguage)?.flag}
                  </span>
                </div>
              </div>
              <button
                onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
                disabled={isProcessing}
                className={`p-2 rounded-lg transition-colors ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isProcessing}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AIChatbot;