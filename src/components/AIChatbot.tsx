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
        detectedLanguage // Pass detected language
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