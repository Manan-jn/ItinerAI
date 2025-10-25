"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import ProcessingIndicator from "./ProcessingIndicator";
import APILoader from "./APILoader";
import FlashcardsWidget, { FlashcardsWidgetRef } from "./FlashcardsWidget";
import FlightsWidget from "./FlightsWidget";
import { getSessionId, getUserId } from "../utils/sessionManager";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface APIResponse {
  message?: string;
  [key: string]: unknown;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
}

export default function ChatModal({
  isOpen,
  onClose,
  initialMessage,
}: ChatModalProps) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [showFlights, setShowFlights] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);

  // Session management
  const [sessionId, setSessionId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const flashcardsRef = useRef<FlashcardsWidgetRef>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleProcessingComplete = () => {
    // APILoader will handle completion automatically
  };

  // Initialize session IDs on component mount
  useEffect(() => {
    const initializeSession = () => {
      const newSessionId = getSessionId();
      const newUserId = getUserId();

      setSessionId(newSessionId);
      setUserId(newUserId);

      console.log("ChatModal session initialized:", {
        sessionId: newSessionId,
        userId: newUserId,
      });
    };

    if (isOpen) {
      initializeSession();
    }
  }, [isOpen]);

  // Handle initial message
  useEffect(() => {
    if (isOpen && initialMessage && initialMessage.trim() && !hasStartedChat) {
      setInput(initialMessage);
      setHasStartedChat(true);
      // Auto-submit the initial message after a short delay to ensure UI is ready
      const timer = setTimeout(() => {
        handleSubmitWithMessage(initialMessage);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isOpen, initialMessage, hasStartedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus textarea when modal opens (if no initial message)
  useEffect(() => {
    if (isOpen && !initialMessage && textareaRef.current) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isOpen, initialMessage]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  const handleSubmitWithMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;

    if (!sessionId || !userId) {
      console.error("Session not initialized yet");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent.trim(),
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setHasStartedChat(true);

    try {
      console.log("Making API call...");

      const response = await fetch("https://agent-bigfit-api.com/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          session_id: sessionId,
          message: messageContent.trim(),
        }),
      });

      console.log("FastAPI Request sent:", {
        user_id: userId,
        session_id: sessionId,
        message: messageContent.trim(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: APIResponse = await response.json();
      console.log("FastAPI Response received:", data);

      if (data.message) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.message,
          role: "assistant",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content:
            "I apologize, but I'm having trouble processing your request right now. Please try again.",
          role: "assistant",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "I'm sorry, I'm having trouble connecting right now. Please check your internet connection and try again.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmitWithMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setMessages([]);
    setInput("");
    setIsLoading(false);
    setHasStartedChat(false);
    setShowFlashcards(false);
    setShowFlights(false);
    setSelectedTrip(null);
    if (flashcardsRef.current) {
      flashcardsRef.current.clearSelection();
    }
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-black rounded-2xl border border-gray-700/50 w-full max-w-7xl h-[90vh] flex flex-col relative shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with places and flights toggles and close button */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800/50">
          <div className="flex items-center space-x-6">
            <h2 className="text-xl font-semibold text-white">ItinerAI Chat</h2>

            {/* Places Toggle Slider */}
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-400">Places</span>
              <button
                onClick={() => {
                  setShowFlashcards(!showFlashcards);
                  if (showFlashcards) {
                    setSelectedTrip(null);
                    if (flashcardsRef.current) {
                      flashcardsRef.current.clearSelection();
                    }
                  }
                  // Close flights if opening places
                  if (!showFlashcards) {
                    setShowFlights(false);
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showFlashcards
                    ? "bg-purple-500/30 border-purple-400/50"
                    : "bg-gray-700/50 border-gray-600/50"
                } border backdrop-blur-sm`}
                title="Toggle Places Explorer"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
                    showFlashcards ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Flights Toggle Slider */}
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-400">Flights</span>
              <button
                onClick={() => {
                  setShowFlights(!showFlights);
                  // Close places if opening flights
                  if (!showFlights) {
                    setShowFlashcards(false);
                    setSelectedTrip(null);
                    if (flashcardsRef.current) {
                      flashcardsRef.current.clearSelection();
                    }
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showFlights
                    ? "bg-blue-500/30 border-blue-400/50"
                    : "bg-gray-700/50 border-gray-600/50"
                } border backdrop-blur-sm`}
                title="Toggle Flights Search"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
                    showFlights ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Chat Content */}
        <div className="flex-1 flex flex-col min-h-0">
          <div
            className={`w-full h-full flex flex-col min-h-0 ${
              showFlashcards || showFlights ? "px-3 py-3" : "px-6 py-4"
            } mx-auto transition-all duration-500 ease-out`}
          >
            {showFlights ? (
              /* Flights Widget with Chat Input Below */
              <>
                <div className="flex-1 flex flex-col justify-start w-full min-h-0 pt-2">
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <FlightsWidget
                      isVisible={showFlights}
                      onToggle={() => {
                        setShowFlights(false);
                      }}
                    />
                  </div>
                  {/* Chat Input Below Flights */}
                  <div className="flex-shrink-0 pt-4 pb-2 px-2">
                    <form onSubmit={handleSubmit} className="relative">
                      <div className="flex items-end gap-2 bg-gray-900 rounded-lg border border-gray-800 p-2 focus-within:border-gray-700 transition-colors">
                        <textarea
                          ref={textareaRef}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Ask about flights..."
                          className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none outline-none min-h-[20px] max-h-[120px] text-sm leading-relaxed py-1"
                          rows={1}
                          disabled={isLoading}
                        />
                        <button
                          type="submit"
                          disabled={isLoading || !input.trim()}
                          className="p-2 bg-white hover:bg-gray-100 disabled:bg-gray-700 disabled:cursor-not-allowed text-black disabled:text-gray-400 rounded-md transition-colors flex-shrink-0"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                            />
                          </svg>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </>
            ) : showFlashcards ? (
              /* Flashcards Widget with Chat Input Below */
              <>
                <div className="flex-1 flex flex-col justify-start w-full min-h-0 pt-2">
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <FlashcardsWidget
                      ref={flashcardsRef}
                      isVisible={showFlashcards}
                      onToggle={() => {
                        setShowFlashcards(false);
                        setSelectedTrip(null);
                      }}
                      rightPanelCollapsed={true}
                      onTripSelect={setSelectedTrip}
                    />
                  </div>
                  {/* Chat Input Below Flashcards */}
                  <div className="flex-shrink-0 pt-4 pb-2 px-2">
                    <form onSubmit={handleSubmit} className="relative">
                      <div className="flex items-end gap-2 bg-gray-900 rounded-lg border border-gray-800 p-2 focus-within:border-gray-700 transition-colors">
                        <textarea
                          ref={textareaRef}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder={
                            selectedTrip
                              ? `Ask about ${selectedTrip.trip_title}...`
                              : "Message ItinerAI..."
                          }
                          className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none outline-none min-h-[20px] max-h-[120px] text-sm leading-relaxed py-1"
                          rows={1}
                          disabled={isLoading}
                        />
                        <button
                          type="submit"
                          disabled={isLoading || !input.trim()}
                          className="p-2 bg-white hover:bg-gray-100 disabled:bg-gray-700 disabled:cursor-not-allowed text-black disabled:text-gray-400 rounded-md transition-colors flex-shrink-0"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                            />
                          </svg>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </>
            ) : !hasStartedChat ? (
              /* Welcome Screen */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mb-8 mx-auto">
                    <svg
                      className="w-10 h-10 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4">
                    Welcome to ItinerAI
                  </h3>
                  <p className="text-gray-400 mb-8 text-lg leading-relaxed">
                    Your AI travel companion is ready to help you plan the
                    perfect trip. Ask me anything about destinations,
                    activities, or travel planning!
                  </p>
                  <div className="text-sm text-gray-500">
                    💡 Try toggling "Places" to explore destinations or
                    "Flights" to search flights
                  </div>
                </div>
              </div>
            ) : (
              /* Messages Container */
              <div className="flex-1 overflow-y-auto space-y-4 py-4 min-h-0 mb-4 px-2">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`message-enter-active ${
                      index === messages.length - 1 &&
                      message.role === "assistant"
                        ? "message-appear"
                        : ""
                    }`}
                  >
                    <div
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg px-4 py-3 ${
                          message.role === "user"
                            ? "bg-white text-black"
                            : "bg-gray-900 text-gray-100 border border-gray-800"
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                <APILoader
                  isVisible={isLoading}
                  onComplete={handleProcessingComplete}
                />

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Chat Input - only show when not in flashcards or flights mode */}
        {!showFlashcards && !showFlights && (
          <div className="flex-shrink-0 pb-4 px-6">
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
                  disabled={isLoading || !input.trim()}
                  className="p-2 bg-white hover:bg-gray-100 disabled:bg-gray-700 disabled:cursor-not-allowed text-black disabled:text-gray-400 rounded-md transition-colors flex-shrink-0"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
