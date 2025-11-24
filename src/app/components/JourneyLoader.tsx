"use client";

import React, { useState, useEffect, useMemo } from "react";

export type JourneyStep =
  | "trip-suggestion"
  | "date-recommender"
  | "conveyance-finder"
  | "stays-finder"
  | "itinerary-generation"
  | "booking-activities"
  | "pre-trip-brief";

interface JourneyLoaderProps {
  isVisible: boolean;
  currentStep: JourneyStep;
  duration?: number;
  // Dynamic location data for conveyance and stays search
  fromLocation?: string;
  toLocation?: string;
  cityLocation?: string;
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
      "Analyzing your unique travel preferences carefully",
      "Understanding your ideal journey style",
      "Discovering perfect destinations for you",
      "Crafting personalized travel experiences now",
      "Curating your dream adventure itinerary",
    ],
  },
  {
    id: "date-recommender",
    icon: "📅",
    label: "Date Recommender",
    messages: [
      "Finding the best travel dates available",
      "Analyzing seasonal patterns for your trip",
      "Checking availability windows and prices",
      "Optimizing your travel timeline smartly",
      "Preparing perfect date options for you",
    ],
  },
  {
    id: "conveyance-finder",
    icon: "✈️",
    label: "Conveyance Finder",
    messages: [
      "Searching for best flights and trains",
      "Comparing all available travel options",
      "Finding optimal connections for you",
      "Checking real-time seat availability now",
      "Curating the best transport choices",
    ],
  },
  {
    id: "stays-finder",
    icon: "🏨",
    label: "Stays Finder",
    messages: [
      "Discovering perfect stays for your trip",
      "Filtering accommodations by your preferences",
      "Checking real-time room availability now",
      "Comparing the best accommodation options",
      "Preparing ideal stay options for you",
    ],
  },
  {
    id: "itinerary-generation",
    icon: "📋",
    label: "Itinerary Generation",
    messages: [
      "Building your perfect travel itinerary now",
      "Organizing daily activities and experiences",
      "Adding must-see attractions to your plan",
      "Optimizing your schedule for best experience",
      "Finalizing your complete journey details",
    ],
  },
  {
    id: "booking-activities",
    icon: "🎫",
    label: "Booking Activities",
    messages: [
      "Preparing your travel bookings summary",
      "Calculating total costs and expenses",
      "Organizing all your travel reservations",
      "Finalizing your complete booking details",
      "Getting everything ready to confirm",
    ],
  },
  {
    id: "pre-trip-brief",
    icon: "📄",
    label: "Pre-Trip Brief",
    messages: [
      "Generating your personalized travel brief",
      "Compiling essential trip information now",
      "Creating your pre-departure document",
      "Preparing important travel reminders for you",
      "Finalizing your complete trip summary",
    ],
  },
];

const TRAVEL_ICONS = ["🌍", "✈️", "🏨", "🗺️", "🧳"];

export function JourneyLoader({
  isVisible,
  currentStep,
  duration = 4000,
  fromLocation,
  toLocation,
  cityLocation,
}: JourneyLoaderProps) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);
  const [shouldRender, setShouldRender] = useState(false);
  const [travelIconIndex, setTravelIconIndex] = useState(0);

  const currentStepIndex = useMemo(
    () => STEPS_CONFIG.findIndex((s) => s.id === currentStep),
    [currentStep]
  );

  const currentStepConfig = useMemo(() => {
    const config = STEPS_CONFIG[currentStepIndex] || STEPS_CONFIG[0];
    
    // Generate dynamic messages for conveyance and stays based on location data
    if (config.id === "conveyance-finder" && fromLocation && toLocation) {
      return {
        ...config,
        messages: [
          `Finding the conveyance options from ${fromLocation} to ${toLocation}`,
          `Searching for best flights and trains from ${fromLocation}`,
          `Comparing travel options to ${toLocation}`,
          `Checking real-time availability for your route`,
          `Curating the best transport choices for you`,
        ],
      };
    }
    
    if (config.id === "stays-finder" && cityLocation) {
      return {
        ...config,
        messages: [
          `Discovering perfect stays in ${cityLocation}`,
          `Finding accommodation options in ${cityLocation}`,
          `Checking real-time room availability in ${cityLocation}`,
          `Comparing the best hotels and properties`,
          `Preparing ideal stay options for you in ${cityLocation}`,
        ],
      };
    }
    
    return config;
  }, [currentStepIndex, fromLocation, toLocation, cityLocation]);

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

        {/* Loading text with smooth reveal animation */}
        <div className="text-center px-4">
          {/* Dynamic message display */}
          <div className="message-container relative h-16 md:h-20 flex items-center justify-center overflow-hidden">
            <div
              key={currentMessage}
              className="message-text absolute inset-0 flex items-center justify-center"
            >
              <span
                className="text-lg md:text-xl font-medium text-gray-700 text-center leading-relaxed"
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
          <div className="flex justify-center space-x-1.5 mt-4">
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

        /* Message container for smooth transitions */
        .message-container {
          min-height: 64px;
        }

        /* Smooth message text animation */
        .message-text {
          animation: messageReveal 1.1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes messageReveal {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }
          15% {
            opacity: 0.3;
            transform: translateY(6px);
          }
          40% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default JourneyLoader;
