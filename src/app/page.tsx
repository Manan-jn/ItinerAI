'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'd be happy to help you plan your perfect itinerary! Could you tell me more about your destination, travel dates, interests, and budget? This will help me create a personalized travel plan just for you.",
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleNudgeClick = (nudgeText: string) => {
    setInput(nudgeText);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const nudges = [
    "Plan a 7-day trip to Japan",
    "Best restaurants in Paris",
    "Budget backpacking through Europe",
    "Family vacation ideas for summer"
  ];

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header */}
      <header className="flex items-center justify-center py-3 border-b border-gray-800">
        <h1 className="text-xl font-medium text-white">ItinerAI</h1>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-2">
        <div className="w-full max-w-2xl h-full flex flex-col">
          
          {/* Welcome Screen or Messages */}
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-light text-white mb-3">ItinerAI</h2>
                <p className="text-gray-400 text-base">
                  Your AI travel companion
                </p>
              </div>
            </div>
          ) : (
            /* Messages Container */
            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              {messages.map((message) => (
                <div key={message.id} className="message-enter-active">
                  <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-lg px-3 py-2 ${
                      message.role === 'user' 
                        ? 'bg-white text-black' 
                        : 'bg-gray-900 text-gray-100 border border-gray-800'
                    }`}>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 max-w-[75%]">
                    <div className="typing-dots">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Nudges - only show when no messages */}
          {messages.length === 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2 justify-center">
                {nudges.map((nudge, index) => (
                  <button
                    key={index}
                    onClick={() => handleNudgeClick(nudge)}
                    className="px-3 py-1.5 text-xs text-gray-400 bg-gray-900 border border-gray-800 rounded-full hover:border-gray-700 hover:text-gray-300 transition-colors"
                  >
                    {nudge}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <div className="border-t border-gray-900 pt-3">
            <form onSubmit={handleSubmit} className="relative">
              <div className="flex items-end gap-2 bg-gray-900 rounded-lg border border-gray-800 p-2 focus-within:border-gray-700 transition-colors">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message ItinerAI..."
                  className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none outline-none min-h-[20px] max-h-[120px] text-sm leading-relaxed py-1"
                  rows={1}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="bg-white hover:bg-gray-200 disabled:bg-gray-700 disabled:cursor-not-allowed text-black disabled:text-gray-500 rounded p-1.5 transition-colors flex-shrink-0"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="transform rotate-90"
                  >
                    <path
                      d="M7 11L12 6L17 11M12 18V7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
