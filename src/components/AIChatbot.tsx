import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Mic, MicOff, Volume2, User, Bot, Globe } from 'lucide-react';
import { useVoiceRedux } from '../hooks/useVoiceRedux';
import { voiceReservationService } from '../services/voiceReservationService';
import { multilingualAI } from '../services/multilingualAIService';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  language?: string;
}

interface AIChatbotProps {
  onClose: () => void;
}

const AIChatbot: React.FC<AIChatbotProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [showLanguageSelector, setShowLanguageSelector] = useState(true);
  const [reservationData, setReservationData] = useState<any>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    voiceState,
    isSupported,
    transcript,
    startListening,
    stopListening
  } = useVoiceRedux();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (transcript && voiceState === 'processing') {
      handleSendMessage(transcript);
    }
  }, [transcript, voiceState]);

  // Initialize with welcome message
  useEffect(() => {
    if (!showLanguageSelector) {
      const welcomeMessage = multilingualAI.getGreeting('welcome');
      addMessage('ai', welcomeMessage);
    }
  }, [showLanguageSelector, currentLanguage]);

  const addMessage = (type: 'user' | 'ai', content: string, language?: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      language: language || currentLanguage
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleLanguageSelect = async (languageCode: string) => {
    setCurrentLanguage(languageCode);
    multilingualAI.setLanguage(languageCode);
    voiceReservationService.setLanguage(languageCode);
    setShowLanguageSelector(false);
    
    // Speak welcome message in selected language
    const welcomeMessage = multilingualAI.getGreeting('welcome');
    setTimeout(() => {
      multilingualAI.speak(welcomeMessage, languageCode);
    }, 500);
  };

  const handleSendMessage = async (message?: string) => {
    const messageToSend = message || inputMessage.trim();
    if (!messageToSend) return;

    // Add user message
    addMessage('user', messageToSend);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Process with voice reservation service
      const result = await voiceReservationService.processVoiceInput(messageToSend);
      
      // Update reservation data if provided
      if (result.data) {
        setReservationData(prev => ({ ...prev, ...result.data }));
      }

      // Add AI response
      setTimeout(async () => {
        addMessage('ai', result.response);
        setIsTyping(false);
        
        // Speak the response in current language
        try {
          await multilingualAI.speak(result.response, currentLanguage);
        } catch (error) {
          console.error('Speech synthesis error:', error);
        }
      }, 1000);

    } catch (error) {
      console.error('AI processing error:', error);
      setTimeout(() => {
        const errorMessage = multilingualAI.getResponse('error');
        addMessage('ai', errorMessage);
        setIsTyping(false);
      }, 1000);
    }
  };

  const handleVoiceToggle = () => {
    if (voiceState === 'listening') {
      stopListening();
    } else {
      startListening();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const availableLanguages = multilingualAI.getAvailableLanguages();

  if (showLanguageSelector) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
          <div className="bg-blue-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Select Language</h3>
                <p className="text-sm text-blue-100">Choose your preferred language</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-blue-500 p-2 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 gap-3">
              {availableLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang.code)}
                  className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="font-medium text-gray-900">{lang.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md h-[600px] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold">AI Assistant</h3>
              <p className="text-sm text-blue-100 flex items-center">
                <span className="mr-2">{availableLanguages.find(l => l.code === currentLanguage)?.flag}</span>
                {isTyping ? 'Typing...' : 'Online'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowLanguageSelector(true)}
              className="text-white hover:bg-blue-500 p-2 rounded-full transition-colors"
              title="Change Language"
            >
              <Globe className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-white hover:bg-blue-500 p-2 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Reservation Progress */}
        {Object.keys(reservationData).length > 0 && (
          <div className="bg-blue-50 border-b p-3">
            <div className="text-xs text-blue-600 font-medium mb-1">Reservation Progress</div>
            <div className="text-xs text-gray-600">
              {reservationData.checkIn && `📅 ${reservationData.checkIn}`}
              {reservationData.adults && ` • 👥 ${reservationData.adults} guests`}
              {reservationData.roomType && ` • 🏨 ${reservationData.roomType}`}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-2 max-w-[80%] ${
                message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === 'user' ? 'bg-blue-600' : 'bg-gray-200'
                }`}>
                  {message.type === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-gray-600" />
                  )}
                </div>
                <div className={`rounded-2xl p-3 ${
                  message.type === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-gray-600" />
                </div>
                <div className="bg-gray-100 rounded-2xl p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Voice Status */}
        {voiceState !== 'idle' && (
          <div className="px-4 py-2 bg-blue-50 border-t">
            <div className="flex items-center justify-center space-x-2 text-sm text-blue-600">
              {voiceState === 'listening' && (
                <>
                  <Mic className="w-4 h-4 animate-pulse" />
                  <span>Listening in {availableLanguages.find(l => l.code === currentLanguage)?.name}...</span>
                </>
              )}
              {voiceState === 'processing' && (
                <>
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              )}
              {voiceState === 'speaking' && (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>Speaking...</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={`Type in ${availableLanguages.find(l => l.code === currentLanguage)?.name} or use voice...`}
                className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isTyping}
              />
            </div>
            
            {isSupported && (
              <button
                onClick={handleVoiceToggle}
                className={`p-2 rounded-full transition-colors ${
                  voiceState === 'listening' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {voiceState === 'listening' ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
            )}
            
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isTyping}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-2 rounded-full transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatbot;