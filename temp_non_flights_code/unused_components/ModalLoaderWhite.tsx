"use client";

import React, { useEffect, useRef } from "react";

interface ModalLoaderWhiteProps {
  message?: string;
  isVisible: boolean;
  onComplete?: () => void;
}

export default function ModalLoaderWhite({
  message = "Processing...",
  isVisible,
  onComplete,
}: ModalLoaderWhiteProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible) return;

    // Simple timeout for completion callback
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop with blue tint */}
      <div className="absolute inset-0 bg-blue-900/20 backdrop-blur-sm"></div>

      <div ref={containerRef} className="relative z-10">
        <div className="flex flex-col items-center">
          {/* Beautiful animated loader */}
          <div className="w-32 h-32 mb-8 relative">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-spin">
              <div className="absolute top-0 left-1/2 w-2 h-2 bg-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1"></div>
            </div>

            {/* Middle rotating ring */}
            <div
              className="absolute inset-2 rounded-full border-4 border-blue-200 animate-spin"
              style={{ animationDirection: "reverse", animationDuration: "2s" }}
            >
              <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-blue-400 rounded-full transform -translate-x-1/2 -translate-y-0.5"></div>
            </div>

            {/* Inner pulsing circle */}
            <div className="absolute inset-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 animate-pulse flex items-center justify-center shadow-lg">
              {/* Airplane icon */}
              <svg
                className="w-8 h-8 text-white transform rotate-45"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
            </div>
          </div>

          {/* Loading Text */}
          <div className="text-center bg-white/95 backdrop-blur-sm rounded-xl px-8 py-4 border border-blue-200 shadow-lg">
            <h3 className="text-xl font-semibold text-blue-900 mb-2 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-500 mr-2 transform rotate-45"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
              ItinerAI
            </h3>
            <p className="text-blue-700 text-sm font-medium">{message}</p>

            {/* Animated dots */}
            <div className="flex justify-center space-x-1 mt-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
          </div>

          {/* Floating particles effect */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-blue-300 rounded-full animate-ping opacity-75"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: `${20 + Math.random() * 60}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
