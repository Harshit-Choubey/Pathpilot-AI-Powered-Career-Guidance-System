import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { MessageSquare, X, Send, Bot, User, ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const GlobalChatbot = () => {
  const { isOpen, toggleChat, closeChat, messages, sendMessage, isLoading, sendQuickPrompt, pageContext } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const location = useLocation();

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  // Determine quick actions based on context
  const getQuickActions = () => {
    const page = pageContext.page;
    if (page === 'Dashboard') {
      return [
        "How do I complete my active task?",
        "Can you make today's tasks easier?",
        "I'm feeling unmotivated."
      ];
    }
    if (page === 'Results') {
      return [
        "Why is this my top career match?",
        "What's the earning potential?",
        "Show me a typical day in this career."
      ];
    }
    if (page === 'RoadmapPreview') {
      return [
        "Explain Phase 1 in more detail.",
        "Can I skip the basics?",
        "How long will this take?"
      ];
    }
    return [
      "Tell me a joke about programming.",
      "What should I learn next?",
      "Explain a complex topic simply."
    ];
  };

  // Do not render floating button on login/signup pages
  if (['/login', '/signup'].includes(location.pathname)) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <div className={`fixed bottom-6 right-6 z-50 transition-transform duration-300 ${isOpen ? 'scale-0' : 'scale-100'}`}>
        <button 
          onClick={toggleChat}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-2xl flex items-center justify-center transform hover:scale-110 transition-all hover:shadow-indigo-500/50"
        >
          <MessageSquare size={28} />
          {/* Notification Dot */}
          <span className="absolute top-0 right-0 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-indigo-600"></span>
          </span>
        </button>
      </div>

      {/* Backdrop (Optional, mobile mostly) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 sm:hidden transition-opacity"
          onClick={closeChat}
        />
      )}

      {/* Slide-in Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] md:w-[450px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 shrink-0 flex items-center justify-between text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30">
              <Bot size={24} />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">AI Mentor</h2>
              <div className="text-indigo-100 text-xs flex items-center gap-1 font-medium tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Online
              </div>
            </div>
          </div>
          <button 
            onClick={closeChat}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronDown size={24} className="-rotate-90" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 max-w-[90%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-sm'}`}>
                {m.role === 'user' ? <User size={16}/> : <Bot size={16}/>}
              </div>
              <div className={`p-4 rounded-2xl text-[15px] leading-relaxed whitespace-pre-wrap shadow-sm ${
                m.role === 'user' 
                  ? 'bg-slate-900 text-white rounded-tr-none' 
                  : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center shrink-0">
                <Bot size={16}/>
              </div>
              <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-sm">
                <span className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Contextual Quick Actions */}
        {!isLoading && messages[messages.length-1]?.role !== 'user' && (
          <div className="px-4 pb-2 bg-slate-50/50 flex gap-2 overflow-x-auto hide-scrollbar">
            {getQuickActions().map((action, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(action)}
                className="whitespace-nowrap bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 px-3 py-1.5 rounded-full text-xs font-medium transition-colors shadow-sm"
              >
                {action}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-slate-100 shrink-0">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your mentor..."
              className="w-full pl-5 pr-14 py-3.5 bg-slate-100/50 border border-slate-200 rounded-full focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm placeholder:text-slate-400"
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="absolute right-2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-md transform active:scale-95"
            >
              <Send size={16}/>
            </button>
          </div>
        </form>

      </div>
    </>
  );
};

export default GlobalChatbot;
