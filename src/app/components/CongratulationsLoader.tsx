"use client";

import React, { useState, useEffect } from "react";

export interface CongratulationsLoaderProps {
  showLoader: boolean;
  duration?: number; // milliseconds
}

const congratulationsMessages = [
  "Congratulations! Your entire itinerary is ready",
  "All set to go!",
  "Pack up your bags",
  "Adventure awaits",
  "Get ready for an amazing trip!",
];

export default function CongratulationsLoader({
  showLoader,
  duration = 4000,
}: CongratulationsLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (showLoader) {
      setIsVisible(true);
      setMessageIndex(0);

      // Calculate interval based on duration and number of messages
      const messageInterval = duration / congratulationsMessages.length;

      const interval = setInterval(() => {
        setMessageIndex(
          (prev) => (prev + 1) % congratulationsMessages.length
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
      <div className="congrats-loader-overlay">
        <div className="congrats-loader-container">
          {/* Animated Celebration Icon */}
          <div className="celebration-icon-wrapper">
            <div className="celebration-icon">
              <svg
                className="party-popper"
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5.8 11.3 2 22l10.7-3.79"></path>
                <path d="M4 3h.01"></path>
                <path d="M22 8h.01"></path>
                <path d="M15 2h.01"></path>
                <path d="M22 20h.01"></path>
                <circle cx="12" cy="12" r="2"></circle>
              </svg>
              {/* Confetti elements */}
              <div className="confetti confetti-1"></div>
              <div className="confetti confetti-2"></div>
              <div className="confetti confetti-3"></div>
              <div className="confetti confetti-4"></div>
              <div className="confetti confetti-5"></div>
              <div className="confetti confetti-6"></div>
            </div>
          </div>

          {/* Message Text */}
          <div className="loader-message-container">
            <h2 className="loader-message">{congratulationsMessages[messageIndex]}</h2>
            <div className="loader-progress-dots">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .congrats-loader-overlay {
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

        .congrats-loader-container {
          text-align: center;
          max-width: 500px;
          padding: 40px;
        }

        .celebration-icon-wrapper {
          margin-bottom: 32px;
          display: flex;
          justify-content: center;
          position: relative;
        }

        .celebration-icon {
          width: 120px;
          height: 120px;
          background: linear-gradient(
            135deg,
            rgba(16, 185, 129, 0.1) 0%,
            rgba(5, 150, 105, 0.05) 100%
          );
          backdrop-filter: blur(16px);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            0 8px 32px rgba(16, 185, 129, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.5);
          animation: celebrate 1s ease-in-out infinite alternate;
          position: relative;
        }

        .party-popper {
          color: #10b981;
          animation: wiggle 0.8s ease-in-out infinite;
        }

        /* Confetti particles */
        .confetti {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: float 2s ease-in-out infinite;
        }

        .confetti-1 {
          background: #9333ea;
          top: -20px;
          left: 20px;
          animation-delay: 0s;
        }

        .confetti-2 {
          background: #3b82f6;
          top: -10px;
          right: 30px;
          animation-delay: 0.2s;
        }

        .confetti-3 {
          background: #f59e0b;
          bottom: -15px;
          left: 30px;
          animation-delay: 0.4s;
        }

        .confetti-4 {
          background: #ec4899;
          bottom: -20px;
          right: 25px;
          animation-delay: 0.6s;
        }

        .confetti-5 {
          background: #10b981;
          top: 10px;
          left: -15px;
          animation-delay: 0.8s;
        }

        .confetti-6 {
          background: #8b5cf6;
          top: 15px;
          right: -10px;
          animation-delay: 1s;
        }

        .loader-message-container {
          margin-top: 24px;
        }

        .loader-message {
          font-size: 1.75rem;
          font-weight: 700;
          color: #10b981;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
            "Segoe UI", Roboto, sans-serif;
          margin-bottom: 20px;
          animation: messageFade 0.6s ease-in-out;
          line-height: 1.4;
        }

        .loader-progress-dots {
          display: flex;
          justify-content: center;
          gap: 8px;
        }

        .dot {
          width: 10px;
          height: 10px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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

        @keyframes celebrate {
          0% {
            transform: scale(1);
            box-shadow:
              0 8px 32px rgba(16, 185, 129, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.5);
          }
          100% {
            transform: scale(1.08);
            box-shadow:
              0 12px 40px rgba(16, 185, 129, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.6);
          }
        }

        @keyframes wiggle {
          0%, 100% {
            transform: rotate(-5deg);
          }
          50% {
            transform: rotate(5deg);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translate(
              calc(var(--float-x, 10px)),
              calc(var(--float-y, -20px))
            ) rotate(180deg);
            opacity: 0.8;
          }
        }

        .confetti-1 {
          --float-x: -15px;
          --float-y: -25px;
        }

        .confetti-2 {
          --float-x: 20px;
          --float-y: -30px;
        }

        .confetti-3 {
          --float-x: -20px;
          --float-y: 25px;
        }

        .confetti-4 {
          --float-x: 15px;
          --float-y: 30px;
        }

        .confetti-5 {
          --float-x: -25px;
          --float-y: -15px;
        }

        .confetti-6 {
          --float-x: 25px;
          --float-y: -20px;
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
