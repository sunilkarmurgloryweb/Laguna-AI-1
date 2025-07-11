import React from 'react';
import { Languages } from 'lucide-react';
import { Language } from '../types/reservation';

interface LanguageSelectorProps {
  onLanguageSelect: (language: Language) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onLanguageSelect }) => {
  const languages = [
    { code: 'en' as Language, name: 'English', flag: '🇺🇸', subtitle: 'Press or say 1' },
    { code: 'es' as Language, name: 'Español', flag: '🇪🇸', subtitle: 'Press or say 2' },
    { code: 'hi' as Language, name: 'हिंदी', flag: '🇮🇳', subtitle: 'Press or say 3' },
    { code: 'en-uk' as Language, name: 'English (UK)', flag: '🇬🇧', subtitle: 'Press or say 4' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Languages className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-blue-900 mb-2">
                Welcome to Lagunacreek
              </h1>
              <p className="text-lg text-gray-600 max-w-md mx-auto">
                Please select your preferred language to continue
              </p>
            </div>
            
            {/* Language Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {languages.map((language) => (
                <div
                  key={language.code}
                  onClick={() => onLanguageSelect(language.code)}
                  className="bg-white border-2 border-gray-200 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 text-center"
                >
                  <div className="text-5xl mb-3">
                    {language.flag}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {language.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {language.subtitle}
                  </p>
                </div>
              ))}
            </div>
            
            {/* Footer */}
            <div className="text-center">
              <p className="text-sm text-gray-500">
                You can also use voice commands: "1 for English", "2 for Spanish", "3 for Hindi", or "4 for UK English"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;