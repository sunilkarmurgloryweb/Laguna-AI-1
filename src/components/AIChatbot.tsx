import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send as SendIcon, 
  Mic as MicIcon, 
  MicOff as MicOffIcon, 
  VolumeUp as VolumeUpIcon, 
  VolumeOff as VolumeOffIcon, 
  Chat as ChatIcon, 
  Close as CloseIcon 
} from '@mui/icons-material';
import { useAppSelector } from '../hooks/useAppSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { setActiveModal } from '../store/slices/uiSlice';
import { processVoiceCommand } from '../services/geminiService';
import { speakText } from '../services/multilingualAIService';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const AIChatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI assistant. I can help you with reservations, check-in, check-out, and room availability. How can I assist you today?',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const dispatch = useAppDispatch();
  const { currentLanguage } = useAppSelector(state => state.ui);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Speech synthesis function
  const speakMessage = useCallback(async (text: string) => {
    if (!isSpeechEnabled || !text) return;

    try {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      // Try advanced multilingual service first
      try {
        await speakText(text, currentLanguage);
        return;
      } catch (error) {
        console.log('Multilingual service failed, using browser speech:', error);
      }

      // Fallback to browser speech synthesis
      setTimeout(() => {
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = currentLanguage === 'es' ? 'es-ES' : 
                          currentLanguage === 'fr' ? 'fr-FR' : 'en-US';
          utterance.rate = 0.9;
          utterance.pitch = 1;
          utterance.volume = 0.8;

          utterance.onend = () => {
            console.log('Speech synthesis completed');
          };

          utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
          };

          speechSynthesis.speak(utterance);
        } catch (error) {
          console.error('Speech synthesis completely failed:', error);
        }
      }, 100);
    } catch (error) {
      console.error('Speech synthesis error:', error);
    }
  }, [isSpeechEnabled, currentLanguage]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = currentLanguage === 'es' ? 'es-ES' : 
                                   currentLanguage === 'fr' ? 'fr-FR' : 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
        handleSendMessage(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [currentLanguage]);

  // Detect intent and open appropriate modal
  const detectIntentAndOpenModal = useCallback((text: string) => {
    const lowerText = text.toLowerCase();
    
    // Booking/Reservation keywords
    if (lowerText.includes('book') || lowerText.includes('reservation') || 
        lowerText.includes('reserve') || lowerText.includes('make a booking')) {
      setTimeout(() => {
        dispatch(setActiveModal('reservation'));
      }, 1500);
      return 'booking';
    }
    
    // Check-in keywords
    if (lowerText.includes('check in') || lowerText.includes('checking in') || 
        lowerText.includes('arrival') || lowerText.includes('check-in')) {
      setTimeout(() => {
        dispatch(setActiveModal('checkin'));
      }, 1500);
      return 'checkin';
    }
    
    // Check-out keywords
    if (lowerText.includes('check out') || lowerText.includes('checking out') || 
        lowerText.includes('departure') || lowerText.includes('check-out')) {
      setTimeout(() => {
        dispatch(setActiveModal('checkout'));
      }, 1500);
      return 'checkout';
    }
    
    // Room availability keywords
    if (lowerText.includes('availability') || lowerText.includes('available rooms') || 
        lowerText.includes('room available') || lowerText.includes('calendar')) {
      setTimeout(() => {
        dispatch(setActiveModal('availability'));
      }, 1500);
      return 'availability';
    }
    
    return null;
  }, [dispatch]);

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);

    try {
      // Detect intent and potentially open modal
      const detectedIntent = detectIntentAndOpenModal(messageText);
      
      // Process the message with AI
      const result = await processVoiceCommand(messageText, currentLanguage);
      
      let responseText = result.response?.text || 'I understand you want to help with that. Let me assist you.';
      
      // Add specific responses based on detected intent
      if (detectedIntent === 'booking') {
        responseText = 'I\'ll help you make a reservation. Let me open the booking form for you.';
      } else if (detectedIntent === 'checkin') {
        responseText = 'I\'ll help you check in. Opening the check-in process now.';
      } else if (detectedIntent === 'checkout') {
        responseText = 'I\'ll help you check out. Opening the check-out process now.';
      } else if (detectedIntent === 'availability') {
        responseText = 'Let me show you our room availability. Opening the calendar now.';
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Speak the AI response
      setTimeout(() => {
        speakMessage(responseText);
      }, 500);

    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I apologize, but I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleSpeech = () => {
    setIsSpeechEnabled(!isSpeechEnabled);
    if (isSpeechEnabled) {
      speechSynthesis.cancel();
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 flex items-center gap-2"
        >
          <ChatIcon className="w-6 h-6" />
          <span className="hidden sm:inline">AI Assistant</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-3 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChatIcon className="w-5 h-5" />
          <span className="font-medium">AI Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSpeech}
            className="p-1 hover:bg-blue-700 rounded transition-colors"
            title={isSpeechEnabled ? 'Disable Speech' : 'Enable Speech'}
          >
            {isSpeechEnabled ? <VolumeUpIcon className="w-4 h-4" /> : <VolumeOffIcon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-blue-700 rounded transition-colors"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-2 rounded-lg text-sm ${
                message.isUser
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 p-2 rounded-lg rounded-bl-none text-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={isProcessing}
          />
          <button
            onClick={isListening ? stopListening : startListening}
            className={`p-2 rounded-lg transition-colors ${
              isListening
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
            disabled={isProcessing}
          >
            {isListening ? <MicOffIcon className="w-4 h-4" /> : <MicIcon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => handleSendMessage()}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
            disabled={isProcessing || !inputText.trim()}
          >
            <SendIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatbot;