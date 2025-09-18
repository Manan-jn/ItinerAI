'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import TabPanel from './components/TabPanel';
import { 
  TripDetailsContent, 
  ItineraryContent, 
  PreferencesContent, 
  BookmarksContent, 
  WeatherContent,
  HistoryContent,
  DatesContent 
} from './components/TabContents';

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
  const [rightPanelWidth, setRightPanelWidth] = useState(320); // Default 320px (w-80)
  const [isResizing, setIsResizing] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false); // Track if chat has started
  const [chatMaxWidth, setChatMaxWidth] = useState('95%'); // Dynamic chat width
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Calculate optimal chat width based on available space
  useEffect(() => {
    const calculateChatWidth = () => {
      if (typeof window !== 'undefined') {
        const availableWidth = window.innerWidth - (isRightPanelCollapsed ? 0 : rightPanelWidth) - 32; // 32px for padding
        const optimalWidth = Math.min(availableWidth * 0.95, Math.max(600, availableWidth - 100));
        setChatMaxWidth(`${optimalWidth}px`);
      }
    };

    // Use requestAnimationFrame for smoother updates during resize
    if (isResizing) {
      requestAnimationFrame(calculateChatWidth);
    } else {
      calculateChatWidth();
    }
    
    const handleResize = () => {
      if (!isResizing) {
        calculateChatWidth();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [rightPanelWidth, isRightPanelCollapsed, isResizing]);

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
    
    // Mark that chat has started after first message
    if (!hasStartedChat) {
      setHasStartedChat(true);
    }

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

  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    // Use requestAnimationFrame for smoother resize updates
    requestAnimationFrame(() => {
      const newWidth = window.innerWidth - e.clientX;
      const minWidth = 280; // Minimum width
      const maxWidth = window.innerWidth * 0.6; // Maximum 60% of screen width
      
      const clampedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
      setRightPanelWidth(clampedWidth);
    });
  }, [isResizing]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  const toggleRightPanel = () => {
    setIsRightPanelCollapsed(!isRightPanelCollapsed);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  const nudges = [
    "Plan a 7-day trip to Japan",
    "Best restaurants in Paris",
    "Budget backpacking through Europe",
    "Family vacation ideas for summer"
  ];

  const initialTabs = [
    {
      id: 'trip-details',
      title: 'Trip Details',
      content: <TripDetailsContent />
    },
    {
      id: 'dates',
      title: 'Dates',
      content: <DatesContent />
    },
    {
      id: 'itinerary',
      title: 'Itinerary',
      content: <ItineraryContent />
    },
    {
      id: 'preferences',
      title: 'Preferences',
      content: <PreferencesContent />
    },
    {
      id: 'weather',
      title: 'Weather',
      content: <WeatherContent />
    },
    {
      id: 'bookmarks',
      title: 'Bookmarks',
      content: <BookmarksContent />
    },
    {
      id: 'history',
      title: 'History',
      content: <HistoryContent />
    }
  ];

  return (
    <div className="flex flex-col h-screen max-h-screen bg-black overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between py-3 border-b border-gray-800 flex-shrink-0 px-4">
        <div className="flex-1"></div>
        <h1 className="text-xl font-medium text-white">ItinerAI</h1>
        <div className="flex-1 flex justify-end">
          {/* Panel Toggle Button */}
          <button
            onClick={toggleRightPanel}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-500 transform hover:scale-105 active:scale-95 ${
              isRightPanelCollapsed 
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                : 'bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white hover:shadow-lg hover:shadow-gray-700/20'
            }`}
            title={isRightPanelCollapsed ? 'Show Sidebar' : 'Hide Sidebar'}
          >
            <svg
              className={`w-4 h-4 transition-all duration-500 ${isRightPanelCollapsed ? 'rotate-180' : 'rotate-0'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="text-xs transition-all duration-300">{isRightPanelCollapsed ? 'Show Panel' : 'Hide Panel'}</span>
            <svg
              className={`w-3 h-3 transition-all duration-500 ${
                isRightPanelCollapsed ? 'opacity-0 scale-0 rotate-90' : 'opacity-60 scale-100 rotate-0'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className={`flex-1 flex min-h-0 ${isResizing ? 'resizing-mode' : ''}`}>
        {/* Chat Area */}
        <div className={`flex-1 min-h-0 flex flex-col ${
          isResizing ? '' : 'transition-all duration-500 ease-out'
        }`}>
          <div className={`w-full h-full flex flex-col min-h-0 px-4 py-2 mx-auto ${
            hasStartedChat ? '' : 'max-w-2xl'
          } ${
            isResizing ? '' : 'transition-all duration-500 ease-out'
          }`} style={{
            maxWidth: hasStartedChat ? chatMaxWidth : '32rem'
          }}>
          
          {/* Welcome Screen or Messages Container */}
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
            <div className="flex-1 overflow-y-auto space-y-4 py-4 min-h-0 mb-4">
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

          {/* Input Form - always positioned at bottom with padding */}
          <div className="flex-shrink-0 pb-4">
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

        {/* Right Panel Container */}
        <div 
          className={`flex-shrink-0 min-h-0 relative overflow-hidden ${
            isRightPanelCollapsed ? 'w-0 opacity-0' : ''
          } ${
            isResizing ? 'resize-in-progress' : 'transition-all duration-500 ease-out'
          }`}
          style={{ 
            width: isRightPanelCollapsed ? '0px' : `${rightPanelWidth}px`
          }}
        >
          {/* Right Panel Content */}
          <div 
            className={`h-full ${
              isRightPanelCollapsed ? 'transform translate-x-full' : 'transform translate-x-0'
            } ${
              isResizing ? '' : 'transition-transform duration-500 ease-out'
            }`}
            style={{ width: `${rightPanelWidth}px` }}
          >
            {/* Resize Handle */}
            <div
              className={`resize-handle ${isResizing ? 'resizing' : ''} transition-opacity duration-300 ${
                isRightPanelCollapsed ? 'opacity-0' : 'opacity-100'
              }`}
              onMouseDown={handleResizeStart}
            />
            
            <TabPanel initialTabs={initialTabs} />
          </div>
        </div>
      </div>
    </div>
  );
}
