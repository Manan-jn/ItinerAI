"use client";

import React, { useEffect, useState } from "react";

export interface MessageResponseOverlayProps {
  message: string | null;
  isVisible: boolean;
  onClose?: () => void;
  autoHideDuration?: number; // milliseconds
}

export default function MessageResponseOverlay({
  message,
  isVisible,
  onClose,
  autoHideDuration = 0, // 0 means no auto-hide
}: MessageResponseOverlayProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayMessage, setDisplayMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible && message) {
      // Trigger exit animation if there's an existing message
      if (displayMessage) {
        setIsAnimating(false);
        // Wait for exit animation, then update message
        setTimeout(() => {
          setDisplayMessage(message);
          setIsAnimating(true);
        }, 300);
      } else {
        setDisplayMessage(message);
        setIsAnimating(true);
      }

      // Auto-hide if duration is set
      if (autoHideDuration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoHideDuration);
        return () => clearTimeout(timer);
      }
    } else if (!isVisible) {
      setIsAnimating(false);
    }
  }, [isVisible, message, autoHideDuration]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setDisplayMessage(null);
      if (onClose) onClose();
    }, 300);
  };

  // Only show if visible, has a message, and message is not empty string
  if (!isVisible || !displayMessage || displayMessage.trim() === "") return null;

  return (
    <>
      <div
        className={`message-response-overlay ${isAnimating ? "visible" : ""}`}
      >
        <div className="message-content">
          <p className="message-text">{displayMessage}</p>
        </div>
        {onClose && (
          <button
            onClick={handleClose}
            className="close-button"
            aria-label="Close message"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>

      <style jsx>{`
        .message-response-overlay {
          position: fixed;
          top: 20px;
          right: 20px;
          max-width: 380px;
          min-width: 260px;
          z-index: 9999;

          /* Enhanced Glassmorphic Background - More transparent, more blur */
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.75) 0%,
            rgba(255, 255, 255, 0.6) 100%
          );
          backdrop-filter: blur(32px) saturate(200%);
          -webkit-backdrop-filter: blur(32px) saturate(200%);

          /* Border & Shadow - More compact, subtle */
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow:
            0 6px 24px rgba(0, 0, 0, 0.1),
            0 2px 6px rgba(0, 0, 0, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 0 rgba(0, 0, 0, 0.03);

          /* Layout - More compact padding */
          padding: 14px 18px;
          display: flex;
          align-items: flex-start;
          gap: 10px;

          /* Animation */
          opacity: 0;
          transform: translateY(-20px) scale(0.95);
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          pointer-events: none;
        }

        .message-response-overlay.visible {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: all;
          animation: gentlePulse 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .message-content {
          flex: 1;
          min-width: 0;
        }

        .message-text {
          margin: 0;
          font-size: 14px;
          line-height: 1.4;
          color: #1d1d1f;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif;
          font-weight: 500;
          letter-spacing: -0.01em;
          word-wrap: break-word;

          /* Subtle text shadow for depth */
          text-shadow: 0 0.5px 1px rgba(255, 255, 255, 0.8);
        }

        .close-button {
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.04);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #86868b;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0;
        }

        .close-button:hover {
          background: rgba(0, 0, 0, 0.08);
          color: #1d1d1f;
          transform: scale(1.1);
        }

        .close-button:active {
          transform: scale(0.95);
        }

        @keyframes gentlePulse {
          0% {
            transform: translateY(-20px) scale(0.95);
            opacity: 0;
          }
          60% {
            transform: translateY(0) scale(1.02);
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          .message-response-overlay {
            top: 16px;
            right: 16px;
            left: 16px;
            max-width: none;
            min-width: auto;
          }
        }

        /* Dark mode support - More compact and glassmorphic */
        @media (prefers-color-scheme: dark) {
          .message-response-overlay {
            background: linear-gradient(
              135deg,
              rgba(30, 30, 30, 0.75) 0%,
              rgba(20, 20, 20, 0.6) 100%
            );
            border-color: rgba(255, 255, 255, 0.15);
            box-shadow:
              0 6px 24px rgba(0, 0, 0, 0.3),
              0 2px 6px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
          }

          .message-text {
            color: #f5f5f7;
            text-shadow: 0 0.5px 1px rgba(0, 0, 0, 0.5);
          }

          .close-button {
            background: rgba(255, 255, 255, 0.1);
            color: #86868b;
          }

          .close-button:hover {
            background: rgba(255, 255, 255, 0.15);
            color: #f5f5f7;
          }
        }
      `}</style>
    </>
  );
}
