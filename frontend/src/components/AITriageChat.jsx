import React, { useState, useRef, useEffect } from 'react';
import { streamTriageChat } from '../api';

// Added gender and formData as props to inject into the AI prompt
const AITriageChat = ({ language = "English", onComplete, gender = "Unknown", formData = {} }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hello. I am the MediFlow AI Triage Assistant. Please describe your symptoms in detail.` }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isStreaming) return;

    const userMsg = inputValue.trim();
    setInputValue('');
    
    const newHistory = [...messages, { role: 'user', content: userMsg }];
    setMessages(newHistory);
    setIsStreaming(true);

    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    // --- NEW: Injecting the gender, age, and symptoms into the AI prompt ---
    const userSymptoms = newHistory.filter(msg => msg.role === 'user').map(msg => msg.content).join(". ");
    
    // Ensure this is passed into your AI system prompt
    const triagePrompt = `Patient is a ${gender}, age ${formData.age || 'unknown'}. Symptoms: ${userSymptoms}. \nPlease perform a clinical triage and provide a pre-diagnosis.`;

    try {
      // Pass the enriched triagePrompt to the backend, giving the AI the full context
      const response = await streamTriageChat(triagePrompt, newHistory, language);
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages];
            const lastIndex = updatedMessages.length - 1;
            updatedMessages[lastIndex] = {
              ...updatedMessages[lastIndex],
              content: updatedMessages[lastIndex].content + chunk
            };
            return updatedMessages;
          });
        }
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [...prev, { role: 'assistant', content: "⚠️ Connection error. Please try again." }]);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-125 w-full bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
      
      {/* Chat Header WITH THE NEW FINISH BUTTON */}
      <div className="bg-clinical-600 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
             <span className="relative inline-flex rounded-full h-3 w-3 bg-green-300"></span>
          </div>
          <h3 className="text-white font-bold tracking-wider text-sm md:text-base">MediFlow AI</h3>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-clinical-100 uppercase bg-clinical-700 px-2 py-1 rounded-md hidden md:block">
            {language}
          </span>
          {/* THE FINISH BUTTON */}
          <button 
            onClick={() => onComplete(messages)}
            disabled={isStreaming}
            className="bg-green-500 hover:bg-green-400 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-md transition-all uppercase tracking-wider disabled:opacity-50"
          >
            Finish & Enter
          </button>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900/50 custom-scrollbar">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm shadow-sm whitespace-pre-wrap
              ${msg.role === 'user' 
                ? 'bg-clinical-600 text-white rounded-br-none' 
                : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-600 rounded-bl-none'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isStreaming}
            placeholder={isStreaming ? "AI is typing..." : "Type your symptoms here..."}
            className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-clinical-500 text-gray-800 dark:text-white outline-none"
          />
          <button 
            type="submit"
            disabled={isStreaming || !inputValue.trim()}
            className={`px-5 py-3 font-bold rounded-xl shadow-md transition-all
              ${(isStreaming || !inputValue.trim()) 
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed' 
                : 'bg-clinical-600 hover:bg-clinical-500 text-white'
              }`}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default AITriageChat;