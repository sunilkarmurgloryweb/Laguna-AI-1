import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Mic, MicOff, Volume2, Globe, X, Minimize2, Send, Bot, User } from 'lucide-react';
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
  const [showLanguageSelector, setShowLanguageSelector] = useState(true);
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
      text: multilingualAI.getGreeting('welcome'),
      sender: 'ai',
      timestamp: new Date(),
      language: languageCode
    };
    setMessages([welcomeMessage]);
    
    // Speak welcome message
    await multilingualAI.speak(welcomeMessage.text, languageCode);
  };

  const handleVoiceInput = async (transcript: string) => {
    // Robust validation for transcript
    if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
      console.warn('Invalid transcript received:', transcript);
      return;
    }

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
        text: response,
        sender: 'ai',
        timestamp: new Date(),
        language: detectedLanguage
      };
      setMessages(prev => [...prev, aiMessage]);

      // Speak the response in the appropriate language
      await multilingualAI.speak(response, detectedLanguage);
      
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
        text: response,
        sender: 'ai',
        timestamp: new Date(),
        language: detectedLanguage
      };
      setMessages(prev => [...prev, aiMessage]);

      // Speak the response
      await multilingualAI.speak(response, detectedLanguage);
      
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

  // Language Selection Screen
  if (showLanguageSelector) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Choose Language</h3>
          <p className="text-sm text-gray-600 mb-6">Select your preferred language</p>

          <div className="space-y-3">
            {availableLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                className="w-full p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{lang.flag}</span>
                  <div>
                    <div className="font-medium text-gray-800">{lang.name}</div>
                    <div className="text-xs text-gray-500">{lang.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-2 max-w-[80%]`}>
              {message.sender === 'ai' && (
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
              )}
              <div
                className={`p-3 rounded-lg ${
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
              {message.sender === 'user' && (
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
              <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Processing...</span>
                </div>
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
        
        <div className="mt-2 text-center">
          <button
            onClick={() => setShowLanguageSelector(true)}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center justify-center space-x-1"
          >
            <Globe className="w-3 h-3" />
            <span>Change Language</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatbot;