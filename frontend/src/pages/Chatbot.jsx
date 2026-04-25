import { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { chatService } from '../services/api';
import { useTranslation } from 'react-i18next';

const Chatbot = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hi! I'm PathPilot AI. I can answer questions about your career results, help you build a roadmap, or suggest learning resources. How can I help you today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { i18n } = useTranslation();

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMsgs = [...messages, { role: 'user', text: input }];
    setMessages(newMsgs);
    setInput("");
    setIsLoading(true);

    try {
      const res = await chatService.sendMessage(input, i18n.language);
      if (res.data && res.data.success) {
        setMessages([...newMsgs, { role: 'bot', text: res.data.data.reply }]);
      } else {
        setMessages([...newMsgs, { role: 'bot', text: res.data?.data?.reply || "I'm sorry, I encountered an error." }]);
      }
    } catch (err) {
      console.error(err);
      setMessages([...newMsgs, { role: 'bot', text: "Network error trying to reach the AI engine." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 max-h-[calc(100vh-64px)] flex flex-col">
      <div className="max-w-4xl mx-auto w-full glass rounded-3xl shadow-xl flex flex-col h-[calc(100vh-128px)] overflow-hidden">
        
        {/* Header */}
        <div className="bg-indigo-600 p-4 shrink-0 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white">
            <Bot size={24}/>
          </div>
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">PathPilot Assistant</h2>
            <div className="text-indigo-200 text-xs flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Online
            </div>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-indigo-100 text-indigo-600'}`}>
                {m.role === 'user' ? <User size={16}/> : <Bot size={16}/>}
              </div>
              <div className={`p-4 rounded-2xl text-[15px] leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-200' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'}`}>
                {m.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Bot size={16}/>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200 shrink-0">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me about careers, salaries, or skills..."
              className="w-full pl-6 pr-14 py-4 bg-slate-100 border-none rounded-full focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="absolute right-2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-md"
            >
              <Send size={18}/>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default Chatbot;
