"use client";

import React, { useEffect, useState } from "react";

export interface ChatLoadingIndicatorProps {
  isVisible: boolean;
  theme?: "default" | "white" | "purple";
}

const loadingMessages = [
  "Communicating with agent...",
  "Researching best options...",
  "Analyzing your preferences...",
  "Gathering information...",
  "Processing your request...",
  "Finding perfect matches...",
];

export default function ChatLoadingIndicator({
  isVisible,
  theme = "default",
}: ChatLoadingIndicatorProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      // Small delay to trigger animation
      setTimeout(() => setIsAnimating(true), 10);
      setMessageIndex(0);

      // Change message every 2 seconds
      const interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);

      return () => clearInterval(interval);
    } else {
      // Fade out animation
      setIsAnimating(false);
      // Remove from DOM after animation completes
      const timeout = setTimeout(() => {
        setShouldRender(false);
        setMessageIndex(0);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  const getThemeClasses = () => {
    switch (theme) {
      case "white":
        return {
          container: "chat-loader-container-white",
          text: "chat-loader-text-white",
        };
      case "purple":
        return {
          container: "chat-loader-container-purple",
          text: "chat-loader-text-purple",
        };
      default:
        return {
          container: "chat-loader-container",
          text: "chat-loader-text",
        };
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <>
      {/* RGB Glowing Border Wrapper */}
      <div className="rgb-border-wrapper">
        {/* RGB Continuous Flowing Border */}
        <div className="absolute -inset-[3px] rounded-2xl pointer-events-none">
          <div
            className="absolute inset-0 rounded-2xl border-4 border-transparent animate-rgb-flow"
            style={{
              background:
                "linear-gradient(90deg, #3b82f6, #60a5fa, #93c5fd, #60a5fa, #3b82f6, #1d4ed8, #3b82f6) border-box",
              WebkitMask:
                "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }}
          ></div>

          {/* Flowing Glow Overlay */}
          <div className="absolute inset-0 rounded-2xl animate-rgb-glow-continuous">
            <div
              className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-blue-400/60 via-blue-500/60 to-blue-600/60 blur-sm shadow-[0_0_25px_rgba(59,130,246,0.8)]"
              style={{
                WebkitMask:
                  "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
            ></div>
          </div>
        </div>

        <div className={`${themeClasses.container} ${isAnimating ? "visible" : ""}`}>
          {/* Rotating Spinner Icon */}
          <svg
            className="chat-loader-spinner"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25"></circle>
            <path
              d="M12 2a10 10 0 0 1 10 10"
              strokeLinecap="round"
            ></path>
          </svg>

          {/* Dynamic Loading Text */}
          <span className={themeClasses.text}>
            {loadingMessages[messageIndex]}
          </span>
        </div>
      </div>

      <style jsx>{`
        .rgb-border-wrapper {
          position: relative;
          isolation: isolate;
          border-radius: 16px;
        }

        /* Default Theme */
        .chat-loader-container {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 18px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.75) 0%,
            rgba(255, 255, 255, 0.6) 100%
          );
          backdrop-filter: blur(32px) saturate(200%);
          -webkit-backdrop-filter: blur(32px) saturate(200%);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow:
            0 6px 24px rgba(0, 0, 0, 0.1),
            0 2px 6px rgba(0, 0, 0, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 0 rgba(0, 0, 0, 0.03);

          /* Initial hidden state */
          opacity: 0;
          transform: translateY(-10px) scale(0.95);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
          position: relative;
          z-index: 1;
        }

        .chat-loader-container.visible {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: all;
        }

        .chat-loader-text {
          font-size: 14px;
          font-weight: 500;
          color: #1d1d1f;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto,
            sans-serif;
          white-space: nowrap;
          line-height: 1.4;
          text-shadow: 0 0.5px 1px rgba(255, 255, 255, 0.8);
          animation: textFadeIn 0.3s ease-in-out;
        }

        /* White Theme */
        .chat-loader-container-white {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 18px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.75) 0%,
            rgba(255, 255, 255, 0.6) 100%
          );
          backdrop-filter: blur(32px) saturate(200%);
          -webkit-backdrop-filter: blur(32px) saturate(200%);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow:
            0 6px 24px rgba(0, 0, 0, 0.1),
            0 2px 6px rgba(0, 0, 0, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 0 rgba(0, 0, 0, 0.03);

          /* Initial hidden state */
          opacity: 0;
          transform: translateY(-10px) scale(0.95);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
          position: relative;
          z-index: 1;
        }

        .chat-loader-container-white.visible {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: all;
        }

        .chat-loader-text-white {
          font-size: 14px;
          font-weight: 500;
          color: #1d1d1f;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto,
            sans-serif;
          white-space: nowrap;
          line-height: 1.4;
          text-shadow: 0 0.5px 1px rgba(255, 255, 255, 0.8);
          animation: textFadeIn 0.3s ease-in-out;
        }

        /* Purple Theme */
        .chat-loader-container-purple {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          background: linear-gradient(
            135deg,
            rgba(147, 51, 234, 0.08) 0%,
            rgba(219, 39, 119, 0.05) 100%
          );
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 20px;
          border: 1px solid rgba(147, 51, 234, 0.15);
          box-shadow:
            0 4px 12px rgba(147, 51, 234, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.5);
          animation: slideUpFadeIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          z-index: 1;
        }

        .chat-loader-text-purple {
          font-size: 0.875rem;
          font-weight: 500;
          color: #9333ea;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            sans-serif;
          white-space: nowrap;
          animation: textFadeIn 0.3s ease-in-out;
        }

        /* Spinner Animation */
        .chat-loader-spinner {
          animation: spin 0.8s linear infinite;
          flex-shrink: 0;
        }

        /* RGB Flow Animations */
        @keyframes rgb-flow {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }

        .animate-rgb-flow {
          animation: rgb-flow 3s linear infinite;
          background-size: 200% 100%;
        }

        .animate-rgb-glow-continuous {
          animation: rgb-glow-pulse 3s ease-in-out infinite;
        }

        @keyframes rgb-glow-pulse {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes textFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
