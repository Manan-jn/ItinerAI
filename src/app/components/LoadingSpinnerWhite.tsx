"use client";

import { useEffect, useRef } from "react";

interface LoadingSpinnerWhiteProps {
  message?: string;
  duration?: number;
}

export default function LoadingSpinnerWhite({
  message = "Loading...",
  duration = 3,
}: LoadingSpinnerWhiteProps) {
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (progressRef.current) {
      // Animate the progress bar
      progressRef.current.style.width = "0%";
      setTimeout(() => {
        if (progressRef.current) {
          progressRef.current.style.width = "100%";
        }
      }, 100);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-blue-100/50 flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-white to-blue-50/30"></div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-1/4 w-32 h-32 bg-blue-200/20 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-20 right-1/4 w-40 h-40 bg-blue-300/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-10 w-24 h-24 bg-blue-400/10 rounded-full blur-xl animate-pulse delay-500"></div>
      <div className="absolute top-1/3 right-10 w-28 h-28 bg-blue-200/15 rounded-full blur-2xl animate-pulse delay-700"></div>

      <div className="relative z-10 text-center">
        {/* Logo and Branding */}
        <div className="mb-8">
          <div className="relative w-20 h-20 mx-auto mb-6">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-spin"></div>
            <div
              className="absolute inset-2 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"
              style={{ animationDuration: "1.5s" }}
            ></div>

            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <svg
                  className="w-5 h-5 text-white"
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
              </div>
            </div>
          </div>

          {/* Brand Name */}
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
            ItinerAI
          </h1>
          <p className="text-sm text-blue-600/70 font-medium">
            Your AI Travel Companion
          </p>
        </div>

        {/* Loading Message */}
        <div className="mb-8">
          <p className="text-lg text-gray-700 mb-4 font-medium">{message}</p>

          {/* Progress Bar */}
          <div className="w-64 mx-auto">
            <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
              <div
                ref={progressRef}
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-[3000ms] ease-out shadow-sm"
                style={{ width: "0%" }}
              ></div>
            </div>
          </div>
        </div>

        {/* Animated Dots */}
        <div className="flex items-center justify-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-100"></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-200"></div>
        </div>

        {/* Subtle hint text */}
        <p className="text-xs text-gray-500 mt-8 max-w-sm mx-auto">
          Preparing your personalized travel experience...
        </p>
      </div>

      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
            backgroundSize: "50px 50px",
          }}
        ></div>
      </div>
    </div>
  );
}
