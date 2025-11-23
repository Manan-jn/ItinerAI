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

const TRAVEL_ICONS = ["🌍", "✈️", "🏨", "🗺️", "🧳"];

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
      {/* Travel animation container - subtle morphing icons */}
      <div className="relative w-24 h-24 md:w-28 md:h-28 flex items-center justify-center mb-10">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-blue-50 to-white border border-blue-100 animate-gentle-breathe" />
        </div>
        {TRAVEL_ICONS.map((icon, i) => (
          <span
            key={i}
            className={`absolute text-4xl md:text-5xl transition-all duration-700 ease-out ${
              i === travelIconIndex
                ? "opacity-100 scale-100 animate-subtle-float"
                : "opacity-0 scale-90"
            }`}
          >
            {icon}
          </span>
        ))}
      </div>

      {/* Steps loader */}
      <div className="w-[90%] max-w-3xl">
        {/* Steps container */}
        <div className="relative flex justify-between items-center mb-10">
          {/* Progress line background */}
          <div className="absolute top-[24px] md:top-[28px] left-[30px] md:left-[35px] right-[30px] md:right-[35px] h-[2px] bg-gray-100 z-0 rounded-full" />

          {/* Progress line active */}
          <div
            className="absolute top-[24px] md:top-[28px] left-[30px] md:left-[35px] h-[2px] bg-blue-400 z-0 rounded-full transition-all duration-700 ease-out"
            style={{
              width: `calc(${progressPercentage}% * (100% - 60px) / 100)`,
            }}
          />

          {/* Step circles - minimalistic design */}
          {STEPS_CONFIG.map((step, i) => {
            const isActive = i === currentStepIndex;
            const isCompleted = i < currentStepIndex;

            return (
              <div
                key={step.id}
                className="relative z-10 flex flex-col items-center"
              >
                <div
                  className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center mb-2 transition-all duration-400 ${
                    isActive
                      ? "bg-white border border-blue-400"
                      : isCompleted
                      ? "bg-blue-50 border border-blue-200"
                      : "bg-gray-50 border border-gray-200"
                  }`}
                  style={{
                    boxShadow: isActive
                      ? "0 2px 8px rgba(37, 99, 235, 0.12)"
                      : "none",
                  }}
                >
                  <span
                    className={`text-lg md:text-xl transition-all duration-400 ${
                      isActive
                        ? "opacity-100"
                        : isCompleted
                        ? "opacity-70"
                        : "opacity-40"
                    }`}
                  >
                    {step.icon}
                  </span>
                </div>
                <span
                  className={`text-[10px] md:text-xs text-center max-w-[60px] md:max-w-[80px] transition-all duration-400 ${
                    isActive
                      ? "text-blue-600 font-medium"
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

        {/* Loading text with reveal animation - inspired by loadingscreen.html */}
        <div className="text-center">
          <div className="text-reveal-container relative inline-flex items-center justify-center overflow-hidden">
            <div
              key={`prefix-${currentStep}`}
              className="text-reveal-prefix text-lg md:text-xl font-light text-gray-600"
              style={{
                fontFamily:
                  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              }}
            >
              {currentStepConfig.label}
            </div>
            <div
              key={currentMessage}
              className="text-reveal-main overflow-hidden whitespace-nowrap"
            >
              <span
                className="text-reveal-slide inline-block text-lg md:text-xl font-normal text-blue-500 ml-2"
                style={{
                  fontFamily:
                    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}
              >
                {currentMessage}
              </span>
            </div>
          </div>

          {/* Message progress dots - more subtle */}
          <div className="flex justify-center space-x-1.5 mt-5">
            {currentStepConfig.messages.map((_, i) => (
              <div
                key={i}
                className={`transition-all duration-400 ease-out rounded-full ${
                  i === messageIndex
                    ? "w-4 h-1 bg-blue-400"
                    : "w-1 h-1 bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Gentle breathing animation for the icon container */
        @keyframes gentle-breathe {
          0%, 100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.03);
            opacity: 1;
          }
        }

        .animate-gentle-breathe {
          animation: gentle-breathe 4s ease-in-out infinite;
        }

        /* Subtle float for active emoji */
        @keyframes subtle-float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        .animate-subtle-float {
          animation: subtle-float 3s ease-in-out infinite;
        }

        /* Text reveal animations - inspired by loadingscreen.html */
        @keyframes showup {
          0% { opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }

        @keyframes reveal {
          0% { opacity: 0; width: 0px; }
          20% { opacity: 1; width: 0px; }
          30% { width: 280px; }
          80% { opacity: 1; }
          100% { opacity: 0; width: 280px; }
        }

        @keyframes slidein {
          0% { margin-left: -280px; }
          20% { margin-left: -280px; }
          35% { margin-left: 0px; }
          100% { margin-left: 0px; }
        }

        .text-reveal-prefix {
          animation: showup 5s infinite;
        }

        .text-reveal-main {
          width: 0px;
          animation: reveal 5s infinite;
        }

        .text-reveal-slide {
          margin-left: -280px;
          animation: slidein 5s infinite;
        }
      `}</style>
    </div>
  );
}

export default JourneyLoader;
