"use client";

import React, { useState, useEffect } from "react";

export interface FinalizeLoaderProps {
  showLoader: boolean;
  duration?: number; // milliseconds
}

const finalizationMessages = [
  "Finalizing your itinerary...",
  "Calculating total costs...",
  "Preparing booking summary...",
  "Organizing travel details...",
  "Almost ready...",
];

export default function FinalizeLoader({
  showLoader,
  duration = 3000,
}: FinalizeLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (showLoader) {
      setIsVisible(true);
      setMessageIndex(0);

      // Calculate interval based on duration and number of messages
      const messageInterval = duration / finalizationMessages.length;

      const interval = setInterval(() => {
        setMessageIndex(
          (prev) => (prev + 1) % finalizationMessages.length
        );
      }, messageInterval);

      return () => clearInterval(interval);
    } else {
      setIsVisible(false);
    }
  }, [showLoader, duration]);

  if (!isVisible) return null;

  return (
    <>
      <div className="finalize-loader-overlay">
        <div className="finalize-loader-container">
          {/* Animated Icon */}
          <div className="loader-icon-wrapper">
            <div className="loader-icon">
              <svg
                className="loader-checkmark"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
          </div>

          {/* Message Text */}
          <div className="loader-message-container">
            <h3 className="loader-message">{finalizationMessages[messageIndex]}</h3>
            <div className="loader-progress-dots">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .finalize-loader-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(249, 250, 251, 0.98) 100%
          );
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease-in-out;
        }

        .finalize-loader-container {
          text-align: center;
          max-width: 400px;
          padding: 40px;
        }

        .loader-icon-wrapper {
          margin-bottom: 32px;
          display: flex;
          justify-content: center;
        }

        .loader-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(
            135deg,
            rgba(147, 51, 234, 0.1) 0%,
            rgba(79, 70, 229, 0.1) 100%
          );
          backdrop-filter: blur(16px);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            0 8px 32px rgba(147, 51, 234, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.5);
          animation: pulse 2s ease-in-out infinite;
        }

        .loader-checkmark {
          color: #9333ea;
          animation: rotate 2s linear infinite;
        }

        .loader-message-container {
          margin-top: 24px;
        }

        .loader-message {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
            "Segoe UI", Roboto, sans-serif;
          margin-bottom: 16px;
          animation: messageFade 0.5s ease-in-out;
        }

        .loader-progress-dots {
          display: flex;
          justify-content: center;
          gap: 8px;
        }

        .dot {
          width: 8px;
          height: 8px;
          background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out;
        }

        .dot:nth-child(1) {
          animation-delay: -0.32s;
        }

        .dot:nth-child(2) {
          animation-delay: -0.16s;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
            box-shadow:
              0 8px 32px rgba(147, 51, 234, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.5);
          }
          50% {
            transform: scale(1.05);
            box-shadow:
              0 12px 40px rgba(147, 51, 234, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.6);
          }
        }

        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes messageFade {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce {
          0%,
          80%,
          100% {
            transform: scale(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
