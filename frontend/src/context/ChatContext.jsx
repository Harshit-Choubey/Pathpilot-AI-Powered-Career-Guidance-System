import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { chatService } from '../services/api';
import { useAuth } from './AuthContext';
import i18n from '../i18n';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: i18n.t('chat.greeting') }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuth();
  
  // Dynamic Context Extraction
  const location = useLocation();
  const [pageContext, setPageContext] = useState({ page: 'Home' });

  // Reset chat history when the logged-in user changes
  useEffect(() => {
    setMessages([
      { role: 'assistant', content: i18n.t('chat.greeting') }
    ]);
  }, [user]);

  useEffect(() => {
    // Determine page context based on URL
    const path = location.pathname;
    let newContext = { page: 'Home' };
    
    if (path.includes('dashboard')) newContext.page = 'Dashboard';
    else if (path.includes('results')) newContext.page = 'Results';
    else if (path.includes('roadmap-preview')) newContext.page = 'RoadmapPreview';
    else if (path.includes('assessment')) newContext.page = 'Assessment';
    else if (path.includes('compare')) newContext.page = 'Compare';
    
    setPageContext(newContext);
  }, [location]);

  const toggleChat = () => setIsOpen(prev => !prev);
  const closeChat = () => setIsOpen(false);
  const openChat = () => setIsOpen(true);

  // A way to inject specific task context dynamically from components
  const updateContext = (extraData) => {
    setPageContext(prev => ({ ...prev, ...extraData }));
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const newMsgs = [...messages, { role: 'user', content: text }];
    setMessages(newMsgs);
    setIsLoading(true);

    // Prepare history to send (exclude system prompts or anything too old if needed, but we do that on backend)
    // Send the last 10 messages for short-term memory
    const historyToSend = messages.slice(-10);

    try {
      // Send language alongside context so backend LLM responds in correct language
      const contextWithLang = { ...pageContext, language: i18n.language };
      const res = await chatService.sendMessage(text, historyToSend, contextWithLang);
      if (res.data && res.data.success) {
        setMessages([...newMsgs, { role: 'assistant', content: res.data.data.reply }]);
      } else {
        setMessages([...newMsgs, { role: 'assistant', content: res.data?.data?.reply || i18n.t('chat.connection_error') }]);
      }
    } catch (err) {
      console.error(err);
      setMessages([...newMsgs, { role: 'assistant', content: i18n.t('chat.network_error') }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Pre-filled quick prompt trigger
  const sendQuickPrompt = (text) => {
    if (!isOpen) setIsOpen(true);
    sendMessage(text);
  };

  return (
    <ChatContext.Provider value={{
      isOpen,
      toggleChat,
      closeChat,
      openChat,
      messages,
      isLoading,
      sendMessage,
      sendQuickPrompt,
      updateContext,
      pageContext
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
