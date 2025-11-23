"use client";

import React, { useState, useEffect, useMemo } from "react";

export type JourneyStep =
  | "trip-suggestion"
  | "date-recommender"
  | "conveyance-finder"
  | "stays-finder"
  | "itinerary-generation";

interface JourneyLoaderProps {
  isVisible: boolean;
  currentStep: JourneyStep;
  duration?: number;
}

interface StepConfig {
  id: JourneyStep;
  icon: string;
  label: string;
  messages: string[];
}

const STEPS_CONFIG: StepConfig[] = [
  {
    id: "trip-suggestion",
    icon: "🎯",
    label: "Trip Suggestion",
    messages: [
      "Analyzing your travel preferences",
      "Understanding your journey style",
      "Discovering perfect destinations",
      "Crafting personalized experiences",
      "Curating your ideal adventure",
    ],
  },
  {
    id: "date-recommender",
    icon: "📅",
    label: "Date Recommender",
    messages: [
      "Finding the best travel dates",
      "Analyzing seasonal patterns",
      "Checking availability windows",
      "Optimizing your timeline",
      "Preparing date options",
    ],
  },
  {
    id: "conveyance-finder",
    icon: "✈️",
    label: "Conveyance Finder",
    messages: [
      "Searching for flights & trains",
      "Comparing travel options",
      "Finding best connections",
      "Checking seat availability",
      "Curating transport choices",
    ],
  },
  {
    id: "stays-finder",
    icon: "🏨",
    label: "Stays Finder",
    messages: [
      "Discovering perfect stays",
      "Filtering by your preferences",
      "Checking room availability",
      "Comparing accommodations",
      "Preparing stay options",
    ],
  },
  {
    id: "itinerary-generation",
    icon: "📋",
    label: "Itinerary Generation",
    messages: [
      "Building your perfect itinerary",
      "Organizing daily activities",
      "Adding must-see attractions",
      "Optimizing your schedule",
      "Finalizing your journey",
    ],
  },
];

const TRAVEL_ICONS = ["🌍", "✈️", "🏨", "🎭", "🎉"];

export function JourneyLoader({
  isVisible,
  currentStep,
  duration = 4000,
}: JourneyLoaderProps) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);
  const [shouldRender, setShouldRender] = useState(false);
  const [travelIconIndex, setTravelIconIndex] = useState(0);

  const currentStepIndex = useMemo(
    () => STEPS_CONFIG.findIndex((s) => s.id === currentStep),
    [currentStep]
  );

  const currentStepConfig = useMemo(
    () => STEPS_CONFIG[currentStepIndex] || STEPS_CONFIG[0],
    [currentStepIndex]
  );

  // Handle visibility with smooth transition
  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 700);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  // Cycle through messages
  useEffect(() => {
    if (!isVisible) return;

    setCurrentMessage(currentStepConfig.messages[0]);
    setMessageIndex(0);

    const messageTimer = setInterval(() => {
      setMessageIndex((prev) => {
        const nextIndex = (prev + 1) % currentStepConfig.messages.length;
        setCurrentMessage(currentStepConfig.messages[nextIndex]);
        return nextIndex;
      });
    }, 1200);

    return () => clearInterval(messageTimer);
  }, [isVisible, currentStep, currentStepConfig.messages]);

  // Cycle through travel icons
  useEffect(() => {
    if (!isVisible) return;

    const iconTimer = setInterval(() => {
      setTravelIconIndex((prev) => (prev + 1) % TRAVEL_ICONS.length);
    }, 2400);

    return () => clearInterval(iconTimer);
  }, [isVisible]);

  // Calculate progress line percentage
  const progressPercentage = useMemo(() => {
    if (currentStepIndex <= 0) return 0;
    return (currentStepIndex / (STEPS_CONFIG.length - 1)) * 100;
  }, [currentStepIndex]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-700 ease-out overflow-hidden ${
        isVisible
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
      style={{
        background: "#ffffff",
      }}
    >
      {/* Subtle floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="particle absolute rounded-full"
            style={{
              width: `${6 + i * 2}px`,
              height: `${6 + i * 2}px`,
              left: `${10 + i * 17}%`,
              background:
                "linear-gradient(135deg, rgba(37, 99, 235, 0.3), rgba(96, 165, 250, 0.2))",
              boxShadow: "0 0 15px rgba(37, 99, 235, 0.2)",
              animationDelay: `${i * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Travel animation container - morphing icons */}
      <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center mb-8">
        {TRAVEL_ICONS.map((icon, i) => (
          <span
            key={i}
            className={`travel-icon absolute text-5xl md:text-6xl transition-all duration-500 ${
              i === travelIconIndex
                ? "opacity-100 scale-100"
                : "opacity-0 scale-50"
            }`}
            style={{
              filter: "drop-shadow(0 4px 12px rgba(37, 99, 235, 0.2))",
            }}
          >
            {icon}
          </span>
        ))}
      </div>

      {/* Steps loader */}
      <div className="w-[90%] max-w-3xl">
        {/* Steps container */}
        <div className="relative flex justify-between items-center mb-12">
          {/* Progress line background */}
          <div className="absolute top-[28px] md:top-[35px] left-[35px] md:left-[45px] right-[35px] md:right-[45px] h-[3px] bg-blue-100 z-0 rounded-full" />

          {/* Progress line active */}
          <div
            className="absolute top-[28px] md:top-[35px] left-[35px] md:left-[45px] h-[3px] bg-gradient-to-r from-blue-500 to-blue-400 z-0 rounded-full transition-all duration-800 ease-out"
            style={{
              width: `calc(${progressPercentage}% * (100% - 70px) / 100)`,
              boxShadow: "0 0 12px rgba(37, 99, 235, 0.4)",
            }}
          />

          {/* Step circles */}
          {STEPS_CONFIG.map((step, i) => {
            const isActive = i === currentStepIndex;
            const isCompleted = i < currentStepIndex;

            return (
              <div
                key={step.id}
                className="relative z-10 flex flex-col items-center"
              >
                <div
                  className={`w-14 h-14 md:w-[70px] md:h-[70px] rounded-full flex items-center justify-center mb-3 transition-all duration-500 ${
                    isActive
                      ? "bg-white border-2 border-blue-500 shadow-lg scale-110"
                      : isCompleted
                      ? "bg-blue-50 border-2 border-blue-300"
                      : "bg-white/60 border-2 border-blue-100"
                  }`}
                  style={{
                    backdropFilter: "blur(12px)",
                    boxShadow: isActive
                      ? "0 6px 20px rgba(37, 99, 235, 0.18), 0 0 0 6px rgba(37, 99, 235, 0.08)"
                      : isCompleted
                      ? "0 3px 12px rgba(37, 99, 235, 0.1)"
                      : "0 2px 12px rgba(37, 99, 235, 0.06)",
                    animation: isActive
                      ? "subtlePulse 3s ease-in-out infinite"
                      : "none",
                  }}
                >
                  <span
                    className={`text-xl md:text-2xl transition-all duration-500 ${
                      isActive
                        ? "opacity-100 scale-100"
                        : isCompleted
                        ? "opacity-60 scale-95"
                        : "opacity-35 scale-90"
                    }`}
                    style={{
                      animation: isActive
                        ? "subtleIconBounce 3s ease-in-out infinite"
                        : "none",
                    }}
                  >
                    {step.icon}
                  </span>
                </div>
                <span
                  className={`text-xs md:text-sm text-center max-w-[70px] md:max-w-[90px] font-medium transition-all duration-600 ${
                    isActive
                      ? "text-blue-600 font-bold -translate-y-0.5"
                      : isCompleted
                      ? "text-gray-500"
                      : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Loading text with reveal animation */}
        <div className="text-center">
          <div className="loading-text-container relative inline-block">
            <p
              key={currentMessage}
              className="text-xl md:text-2xl font-medium text-blue-600 animate-text-reveal"
              style={{
                fontFamily:
                  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                letterSpacing: "0.01em",
              }}
            >
              {currentMessage}
            </p>
          </div>

          {/* Message progress dots */}
          <div className="flex justify-center space-x-2 mt-6">
            {currentStepConfig.messages.map((_, i) => (
              <div
                key={i}
                className={`transition-all duration-500 ease-out rounded-full ${
                  i === messageIndex
                    ? "w-6 h-1 bg-blue-400"
                    : "w-1.5 h-1 bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float-particle {
          0% {
            transform: translateY(100vh) translateX(0) scale(0.5);
            opacity: 0;
          }
          10% {
            opacity: 0.5;
          }
          90% {
            opacity: 0.5;
          }
          100% {
            transform: translateY(-100px) translateX(80px) scale(1.1);
            opacity: 0;
          }
        }

        .particle {
          animation: float-particle 15s infinite ease-in-out;
        }

        @keyframes subtlePulse {
          0%,
          100% {
            box-shadow: 0 6px 20px rgba(37, 99, 235, 0.18),
              0 0 0 6px rgba(37, 99, 235, 0.08);
          }
          50% {
            box-shadow: 0 8px 24px rgba(37, 99, 235, 0.22),
              0 0 0 8px rgba(37, 99, 235, 0.12);
          }
        }

        @keyframes subtleIconBounce {
          0%,
          100% {
            transform: scale(1) rotate(5deg);
          }
          50% {
            transform: scale(1.08) rotate(-3deg);
          }
        }

        @keyframes text-reveal {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          20% {
            opacity: 1;
            transform: translateY(0);
          }
          80% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-text-reveal {
          animation: text-reveal 1.2s ease-out both;
        }
      `}</style>
    </div>
  );
}

export default JourneyLoader;
