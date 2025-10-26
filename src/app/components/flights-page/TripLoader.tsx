import React, { useState, useEffect } from "react";

interface TripLoaderProps {
  showTripLoader: boolean;
}

export function TripLoader({ showTripLoader }: TripLoaderProps) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [currentSubMessage, setCurrentSubMessage] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);

  const loadingMessages = [
    {
      main: "Analyzing your travel preferences",
      sub: "Understanding what makes your perfect trip",
    },
    {
      main: "Discovering amazing destinations",
      sub: "Finding places that match your interests",
    },
    {
      main: "Crafting personalized itineraries",
      sub: "Creating experiences you'll never forget",
    },
    {
      main: "Curating the perfect journey",
      sub: "Tailoring everything just for you",
    },
    {
      main: "Finding hidden gems",
      sub: "Uncovering destinations off the beaten path",
    },
  ];

  useEffect(() => {
    if (showTripLoader) {
      console.log("🎯 TripLoader: Showing loader - setting visibility to true");
      setIsVisible(true);

      // Set initial message
      const initialMessage =
        loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
      setCurrentMessage(initialMessage.main);
      setCurrentSubMessage(initialMessage.sub);
      setMessageIndex(0);

      // Cycle through messages every 2.5 seconds
      const messageInterval = setInterval(() => {
        setMessageIndex((prev) => {
          const nextIndex = (prev + 1) % loadingMessages.length;
          setCurrentMessage(loadingMessages[nextIndex].main);
          setCurrentSubMessage(loadingMessages[nextIndex].sub);
          return nextIndex;
        });
      }, 2500);

      return () => clearInterval(messageInterval);
    } else {
      console.log("🎯 TripLoader: Hiding loader - starting dissolve");
      // allow a smooth dissolve before unmounting
      const t = setTimeout(() => {
        setIsVisible(false);
        console.log("🎯 TripLoader: Loader fully dissolved");
      }, 650);
      return () => clearTimeout(t);
    }
  }, [showTripLoader]);

  if (!showTripLoader && !isVisible) {
    return null;
  }

  return (
    <div
      className={`absolute inset-0 z-50 bg-white flex items-center justify-center transition-all duration-700 ease-out ${
        showTripLoader && isVisible
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
      style={{
        background:
          "linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #ffffff 100%)",
      }}
    >
      {/* Loading Animation Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      <div className="relative text-center px-6 max-w-md">
        {/* Main Icon */}
        <div className="mb-6 relative">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg animate-float">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          {/* Pulsing ring */}
          <div className="absolute inset-0 w-16 h-16 mx-auto border-4 border-blue-200 rounded-2xl animate-ping opacity-20"></div>
        </div>

        {/* Main Message */}
        <p className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-2 animate-text-reveal">
          {currentMessage}
        </p>

        {/* Sub Message */}
        <p className="text-base text-gray-600 mb-6 animate-subtle-fade">
          {currentSubMessage}
        </p>

        {/* Progress Dots */}
        <div className="flex justify-center space-x-2 mb-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-500 ${
                i === messageIndex % 3 ? "bg-blue-500 scale-125" : "bg-gray-300"
              }`}
              style={{
                animationDelay: `${i * 200}ms`,
              }}
            />
          ))}
        </div>

        {/* Status Text */}
        <p className="text-sm text-gray-500 animate-pulse">
          This may take a few moments...
        </p>
      </div>

      <style jsx>{`
        @keyframes text-reveal {
          0% {
            opacity: 0;
            transform: translateY(10px);
            letter-spacing: 0.5px;
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            letter-spacing: 0;
          }
        }

        @keyframes subtle-fade {
          0% {
            opacity: 0;
            transform: translateY(5px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes blob {
          0%,
          100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-text-reveal {
          animation: text-reveal 800ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .animate-subtle-fade {
          animation: subtle-fade 1000ms ease-out 300ms both;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
