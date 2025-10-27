import React, { useState, useEffect } from "react";

interface TripLoaderProps {
  showTripLoader: boolean;
  duration?: number; // Duration in milliseconds
  customMessages?: string[]; // Optional custom messages
}

export function TripLoader({
  showTripLoader,
  duration = 4000,
  customMessages,
}: TripLoaderProps) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);

  const defaultLoadingMessages = [
    "Analyzing your travel preferences",
    "Understanding your journey style",
    "Discovering perfect destinations",
    "Crafting personalized experiences",
    "Curating your ideal adventure",
  ];

  const loadingMessages = customMessages || defaultLoadingMessages;

  useEffect(() => {
    if (showTripLoader) {
      console.log("🎯 TripLoader: Showing loader - setting visibility to true");
      setIsVisible(true);

      // Set initial message
      setCurrentMessage(loadingMessages[0]);
      setMessageIndex(0);

      // Cycle through messages every 1.2 seconds for smooth transitions
      const messageTimer = setInterval(() => {
        setMessageIndex((prev) => {
          const nextIndex = (prev + 1) % loadingMessages.length;
          setCurrentMessage(loadingMessages[nextIndex]);
          return nextIndex;
        });
      }, 1200);

      return () => clearInterval(messageTimer);
    } else {
      console.log("🎯 TripLoader: Hiding loader - starting dissolve");
      // allow a smooth dissolve before unmounting
      const t = setTimeout(() => {
        setIsVisible(false);
        console.log("🎯 TripLoader: Loader fully dissolved");
      }, 650);
      return () => clearTimeout(t);
    }
  }, [showTripLoader, duration, loadingMessages]);

  if (!showTripLoader && !isVisible) {
    return null;
  }

  return (
    <div
      className={`absolute inset-0 z-50 flex items-center justify-center transition-all duration-700 ease-out overflow-hidden ${
        showTripLoader && isVisible
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
      style={{
        background:
          "linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #f1f5f9 100%)",
      }}
    >
      {/* Subtle animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-gradient-to-r from-blue-100/20 to-transparent rounded-full blur-3xl animate-drift-slow"></div>
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-to-l from-purple-100/15 to-transparent rounded-full blur-3xl animate-drift-reverse"></div>
        </div>
      </div>

      <div className="relative text-center px-8 max-w-2xl">
        {/* Main Message with Subtle Typography */}
        <div className="relative mb-8">
          <p
            key={currentMessage}
            className="text-xl md:text-2xl font-medium text-gray-700 animate-text-fade"
            style={{
              fontFamily:
                "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontWeight: 500,
              letterSpacing: "0.01em",
            }}
          >
            {currentMessage}
          </p>

          {/* Subtle underline effect */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse-soft"></div>
        </div>

        {/* Minimalist progress indicator */}
        <div className="flex justify-center space-x-2 mb-8">
          {loadingMessages.map((_, i) => (
            <div
              key={i}
              className={`transition-all duration-500 ease-out ${
                i === messageIndex
                  ? "w-6 h-0.5 bg-blue-400 rounded-full"
                  : "w-1 h-0.5 bg-gray-300 rounded-full"
              }`}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes text-fade {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes drift-slow {
          0%,
          100% {
            transform: translate(0, 0) rotate(0deg);
          }
          25% {
            transform: translate(20px, -30px) rotate(1deg);
          }
          50% {
            transform: translate(-15px, -20px) rotate(-0.5deg);
          }
          75% {
            transform: translate(25px, 10px) rotate(0.8deg);
          }
        }

        @keyframes drift-reverse {
          0%,
          100% {
            transform: translate(0, 0) rotate(0deg);
          }
          25% {
            transform: translate(-25px, 20px) rotate(-1deg);
          }
          50% {
            transform: translate(20px, 30px) rotate(0.7deg);
          }
          75% {
            transform: translate(-10px, -15px) rotate(-0.3deg);
          }
        }

        @keyframes pulse-soft {
          0%,
          100% {
            opacity: 0.3;
            transform: scaleX(0.8);
          }
          50% {
            opacity: 0.8;
            transform: scaleX(1.2);
          }
        }

        .animate-text-fade {
          animation: text-fade 800ms ease-out both;
        }

        .animate-drift-slow {
          animation: drift-slow 20s ease-in-out infinite;
        }

        .animate-drift-reverse {
          animation: drift-reverse 25s ease-in-out infinite;
        }

        .animate-pulse-soft {
          animation: pulse-soft 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
