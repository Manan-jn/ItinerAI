"use client";

import { useState, useEffect } from "react";

interface ProcessingIndicatorProps {
  isVisible: boolean;
  onComplete?: () => void;
}

const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({
  isVisible,
  onComplete,
}) => {
  const [progress, setProgress] = useState(0);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isTextVisible, setIsTextVisible] = useState(true);

  const processingTexts = [
    "Processing your request...",
    "Understanding context and intent...",
    "Accessing travel knowledge base...",
    "Analyzing destination patterns...",
    "Cross-referencing preferences...",
    "Generating personalized recommendations...",
    "Optimizing itinerary suggestions...",
    "Finalizing response structure...",
  ];

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setCurrentTextIndex(0);
      return;
    }

    // Progress animation - always moves forward, never backwards
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev; // Stay at current progress if near completion
        const increment = Math.random() * 8 + 2; // Smaller, more consistent increments (2-10%)
        return Math.min(prev + increment, 95); // Ensure we never exceed 95% and never go backwards
      });
    }, 1200); // Slower intervals for more realistic progress

    // Text rotation with fade effect
    const textInterval = setInterval(() => {
      setIsTextVisible(false);
      setTimeout(() => {
        setCurrentTextIndex((prev) => (prev + 1) % processingTexts.length);
        setIsTextVisible(true);
      }, 300);
    }, 2500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(textInterval);
    };
  }, [isVisible, processingTexts.length]);

  // Complete progress when component is about to disappear
  useEffect(() => {
    if (!isVisible && progress > 0) {
      // Smoothly complete to 100%
      setProgress(100);
      setCurrentTextIndex(processingTexts.length - 1);
      setIsTextVisible(true);

      // Call completion callback immediately
      onComplete?.();
    }
  }, [isVisible, progress, onComplete, processingTexts.length]);

  if (!isVisible) return null;

  return (
    <div className="flex justify-start animate-fadeIn">
      <div className="glassmorphic-container w-[320px] h-[110px]">
        {/* Modern Glassmorphic background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-white/[0.02] rounded-xl backdrop-blur-2xl border border-white/[0.15] shadow-2xl"></div>
        {/* Enhanced inner glow and depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/[0.08] via-transparent to-purple-400/[0.06] rounded-xl"></div>
        {/* Subtle inner border highlight */}
        <div className="absolute inset-[1px] bg-gradient-to-br from-white/[0.05] to-transparent rounded-[11px] pointer-events-none"></div>

        {/* Content */}
        <div className="relative z-10 p-4 h-full flex flex-col justify-between">
          {/* Thinking Status */}
          <div className="flex items-center justify-center">
            <div className="text-sm font-medium text-white/80">Thinking...</div>
          </div>

          {/* Dynamic processing text with fixed height */}
          <div className="h-[20px] flex items-center justify-center overflow-hidden">
            <p
              className={`text-xs text-white/80 font-medium text-center transition-all duration-500 ease-out absolute ${
                isTextVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2"
              }`}
            >
              {processingTexts[currentTextIndex]}
            </p>
          </div>

          {/* Compact progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/70">Progress</span>
              <span className="text-xs font-mono text-white/80 bg-gray-700/40 px-2 py-0.5 rounded-md text-[10px]">
                {Math.round(progress)}%
              </span>
            </div>

            {/* Compact Progress Track */}
            <div className="relative">
              <div className="w-full h-2 bg-gray-800/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  {/* Enhanced shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessingIndicator;
