"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNotifications } from "../contexts/NotificationsContext";

export interface MessageResponseOverlayProps {
  message: string | null;
  isVisible: boolean;
  onClose?: () => void;
  autoHideDuration?: number; // milliseconds
  source?: string; // Optional: track which component triggered the overlay
  showConfirmation?: boolean; // Show Yes/No buttons
  onConfirm?: () => void; // Called when user clicks Yes
  onReject?: () => void; // Called when user clicks No
}

export default function MessageResponseOverlay({
  message,
  isVisible,
  onClose,
  autoHideDuration = 0, // 0 means no auto-hide
  source = "System",
  showConfirmation = false,
  onConfirm,
  onReject,
}: MessageResponseOverlayProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayMessage, setDisplayMessage] = useState<string | null>(null);
  const [isFlyingToBell, setIsFlyingToBell] = useState(false);
  const [flyPosition, setFlyPosition] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);
  const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasSetTimerRef = useRef(false); // Track if we've already set a timer for current message
  const displayMessageRef = useRef<string | null>(null); // Ref to capture displayMessage for async callbacks

  const { addNotification, bellIconRef, setIsDropdownOpen } = useNotifications();

  const handleFlyToBell = useCallback(() => {
    // Capture the current displayMessage value before any async operations
    const messageToAdd = displayMessageRef.current;

    if (!bellIconRef.current || !overlayRef.current) {
      // Fallback: just add notification without animation
      if (messageToAdd) {
        addNotification(messageToAdd, source);
      }
      setIsAnimating(false);
      setDisplayMessage(null);
      displayMessageRef.current = null;
      if (onClose) onClose();
      return;
    }

    // Get positions
    const bellRect = bellIconRef.current.getBoundingClientRect();
    const overlayRect = overlayRef.current.getBoundingClientRect();

    // Calculate target position (center of bell icon)
    const targetX = bellRect.left + bellRect.width / 2 - overlayRect.width / 2;
    const targetY = bellRect.top + bellRect.height / 2 - overlayRect.height / 2;

    // Current position
    const currentX = overlayRect.left;
    const currentY = overlayRect.top;

    // Set fly animation
    setFlyPosition({
      x: targetX - currentX,
      y: targetY - currentY,
    });
    setIsFlyingToBell(true);

    // After animation completes
    setTimeout(() => {
      // Add to notifications using the captured message
      if (messageToAdd) {
        addNotification(messageToAdd, source);
      }

      // Reset states
      setIsFlyingToBell(false);
      setFlyPosition({ x: 0, y: 0 });
      setIsAnimating(false);
      setDisplayMessage(null);
      displayMessageRef.current = null;

      // Open notifications dropdown briefly
      setIsDropdownOpen(true);

      // Auto-close dropdown after 2 seconds
      setTimeout(() => {
        setIsDropdownOpen(false);
      }, 2000);

      if (onClose) onClose();
    }, 500); // Animation duration
  }, [bellIconRef, addNotification, source, onClose, setIsDropdownOpen]);

  const handleClose = useCallback(() => {
    // Trigger fly-to-bell animation
    handleFlyToBell();
  }, [handleFlyToBell]);

  const handleConfirm = useCallback(() => {
    // Call the confirm callback if provided
    if (onConfirm) {
      onConfirm();
    }
    // Then close the overlay
    handleClose();
  }, [onConfirm, handleClose]);

  const handleReject = useCallback(() => {
    // Call the reject callback if provided
    if (onReject) {
      onReject();
    }
    // Then close the overlay
    handleClose();
  }, [onReject, handleClose]);

  useEffect(() => {
    if (isVisible && message) {
      // Check if this is a new message (different from current displayMessage)
      const isNewMessage = message !== displayMessage;

      // Trigger exit animation if there's an existing message
      if (displayMessage && isNewMessage) {
        setIsAnimating(false);
        // Reset timer tracking for new message
        hasSetTimerRef.current = false;
        // Wait for exit animation, then update message
        setTimeout(() => {
          setDisplayMessage(message);
          displayMessageRef.current = message; // Keep ref in sync
          setIsAnimating(true);
        }, 300);
      } else if (!displayMessage) {
        setDisplayMessage(message);
        displayMessageRef.current = message; // Keep ref in sync
        setIsAnimating(true);
        // Reset timer tracking for new message
        hasSetTimerRef.current = false;
      }

      // Auto-hide if duration is set - only set timer ONCE per message
      // Don't auto-hide if confirmation buttons are shown
      if (autoHideDuration > 0 && !hasSetTimerRef.current && !showConfirmation) {
        // Clear any existing timer first
        if (autoHideTimerRef.current) {
          clearTimeout(autoHideTimerRef.current);
        }

        hasSetTimerRef.current = true;
        autoHideTimerRef.current = setTimeout(() => {
          handleClose();
        }, autoHideDuration);
      }
    } else if (!isVisible) {
      setIsAnimating(false);
      // Clear timer and reset tracking when overlay is hidden
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
        autoHideTimerRef.current = null;
      }
      hasSetTimerRef.current = false;
      displayMessageRef.current = null; // Clear ref when hidden
    }
  }, [isVisible, message, autoHideDuration, handleClose, displayMessage]);

  // Only show if visible, has a message, and message is not empty string
  if (!isVisible || !displayMessage || displayMessage.trim() === "") return null;

  return (
    <>
      <div
        ref={overlayRef}
        className={`message-response-overlay ${isAnimating ? "visible" : ""} ${
          isFlyingToBell ? "flying-to-bell" : ""
        } ${showConfirmation ? "with-confirmation" : ""}`}
        style={
          isFlyingToBell
            ? {
                transform: `translate(${flyPosition.x}px, ${flyPosition.y}px) scale(0.1)`,
                opacity: 0,
              }
            : undefined
        }
      >
        <div className="message-content">
          <p className="message-text">{displayMessage}</p>

          {/* Confirmation Buttons - Only shown when showConfirmation is true */}
          {showConfirmation && (
            <div className="confirmation-buttons">
              <button
                onClick={handleConfirm}
                className="confirm-button yes-button"
                aria-label="Confirm changes"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Yes</span>
              </button>
              <button
                onClick={handleReject}
                className="confirm-button no-button"
                aria-label="Reject changes"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                <span>No</span>
              </button>
            </div>
          )}
        </div>
        {onClose && !showConfirmation && (
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
          top: 80px;
          right: 20px;
          max-width: 380px;
          min-width: 260px;
          z-index: 10030;

          /* Enhanced Glassmorphic Background - Blue gradient theme */
          background: linear-gradient(
            135deg,
            rgba(59, 130, 246, 0.95) 0%,
            rgba(37, 99, 235, 0.9) 100%
          );
          backdrop-filter: blur(32px) saturate(200%);
          -webkit-backdrop-filter: blur(32px) saturate(200%);

          /* Border & Shadow - Subtle blue theme */
          border-radius: 16px;
          border: 1px solid rgba(147, 197, 253, 0.3);
          box-shadow:
            0 6px 24px rgba(59, 130, 246, 0.4),
            0 2px 6px rgba(37, 99, 235, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            inset 0 -1px 0 rgba(0, 0, 0, 0.1);

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

        .message-response-overlay.with-confirmation {
          max-width: 420px;
        }

        .message-response-overlay.visible {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: all;
          animation: gentlePulse 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .message-response-overlay.flying-to-bell {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
          border-radius: 50%;
        }

        .message-content {
          flex: 1;
          min-width: 0;
        }

        .message-text {
          margin: 0;
          font-size: 14px;
          line-height: 1.4;
          color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif;
          font-weight: 500;
          letter-spacing: -0.01em;
          word-wrap: break-word;

          /* Subtle text shadow for depth */
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .confirmation-buttons {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .confirm-button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          outline: none;
        }

        .yes-button {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
        }

        .yes-button:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
        }

        .yes-button:active {
          transform: translateY(0);
          box-shadow: 0 2px 6px rgba(16, 185, 129, 0.2);
        }

        .no-button {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.25);
        }

        .no-button:hover {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.35);
        }

        .no-button:active {
          transform: translateY(0);
          box-shadow: 0 2px 6px rgba(239, 68, 68, 0.2);
        }

        .confirm-button svg {
          flex-shrink: 0;
        }

        .flying-to-bell .message-text {
          opacity: 0;
        }

        .close-button {
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.15);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0;
        }

        .close-button:hover {
          background: rgba(255, 255, 255, 0.25);
          color: #ffffff;
          transform: scale(1.1);
        }

        .close-button:active {
          transform: scale(0.95);
        }

        .flying-to-bell .close-button {
          opacity: 0;
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
            color: #f5f5f7;
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
