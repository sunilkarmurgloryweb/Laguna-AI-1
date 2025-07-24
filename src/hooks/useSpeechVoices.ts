import { useEffect, useState } from 'react';

export const useSpeechVoices = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      console.log(availableVoices, "availableVoices");
      setVoices(availableVoices);
    };
    console.log(123);

    // Load voices if available, or wait for voiceschanged event
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  return voices;
};
