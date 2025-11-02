"use client";

import React, { useState, useEffect } from "react";

export interface BookingConfirmationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  activityTitle: string;
  activityFare?: number;
}

export default function BookingConfirmationModal({
  isVisible,
  onClose,
  onConfirm,
  activityTitle,
  activityFare,
}: BookingConfirmationModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      // Reset state when modal closes
      setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(false);
        setProgress(0);
      }, 300);
    }
  }, [isVisible]);

  const handleConfirmBooking = () => {
    setIsProcessing(true);
    setProgress(0);

    // Simulate payment processing with progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    // Complete after 1.5 seconds
    setTimeout(() => {
      clearInterval(progressInterval);
      setProgress(100);
      setIsProcessing(false);
      setIsSuccess(true);

      // Show success for 1 second, then close
      setTimeout(() => {
        onConfirm();
        onClose();
      }, 1000);
    }, 1500);
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-container" onClick={(e) => e.stopPropagation()}>
          {!isProcessing && !isSuccess ? (
            <>
              {/* Confirmation View */}
              <div className="modal-header">
                <h3 className="modal-title">Confirm Booking</h3>
                <button onClick={onClose} className="close-button" aria-label="Close">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div className="modal-body">
                <div className="activity-info">
                  <div className="activity-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                  </div>
                  <p className="activity-title">{activityTitle}</p>
                  {activityFare && activityFare > 0 && (
                    <p className="activity-fare">₹{activityFare.toLocaleString("en-IN")}</p>
                  )}
                </div>
                <p className="confirmation-text">
                  Are you sure you want to proceed with this booking?
                </p>
              </div>

              <div className="modal-footer">
                <button onClick={onClose} className="cancel-button">
                  Cancel
                </button>
                <button onClick={handleConfirmBooking} className="confirm-button">
                  Confirm Booking
                </button>
              </div>
            </>
          ) : isProcessing ? (
            <>
              {/* Processing View */}
              <div className="processing-container">
                <div className="circular-progress">
                  <svg className="progress-ring" width="120" height="120">
                    <circle
                      className="progress-ring-circle-bg"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                      fill="transparent"
                      r="52"
                      cx="60"
                      cy="60"
                    />
                    <circle
                      className="progress-ring-circle"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      fill="transparent"
                      r="52"
                      cx="60"
                      cy="60"
                      strokeDasharray={`${2 * Math.PI * 52}`}
                      strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#9333ea" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="progress-text">{Math.round(progress)}%</div>
                </div>
                <p className="processing-message">Processing your payment...</p>
              </div>
            </>
          ) : (
            <>
              {/* Success View */}
              <div className="success-container">
                <div className="success-checkmark">
                  <svg className="checkmark" width="80" height="80" viewBox="0 0 24 24">
                    <circle className="checkmark-circle" cx="12" cy="12" r="10" fill="#10b981" />
                    <path
                      className="checkmark-check"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 12l3 3 7-7"
                    />
                  </svg>
                </div>
                <h3 className="success-title">Booking Confirmed!</h3>
                <p className="success-message">Your booking has been successfully processed.</p>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10001;
          animation: fadeIn 0.2s ease-out;
        }

        .modal-container {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(249, 250, 251, 0.98) 100%);
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 450px;
          width: 90%;
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 28px;
          border-bottom: 1px solid rgba(147, 51, 234, 0.1);
        }

        .modal-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif;
        }

        .close-button {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.05);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .close-button:hover {
          background: rgba(0, 0, 0, 0.1);
          transform: scale(1.1);
        }

        .modal-body {
          padding: 32px 28px;
        }

        .activity-info {
          text-align: center;
          margin-bottom: 24px;
        }

        .activity-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          background: linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(219, 39, 119, 0.05) 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9333ea;
        }

        .activity-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 8px 0;
        }

        .activity-fare {
          font-size: 1.5rem;
          font-weight: 700;
          color: #059669;
          margin: 0;
        }

        .confirmation-text {
          font-size: 0.9375rem;
          color: #4b5563;
          text-align: center;
          line-height: 1.6;
          margin: 0;
        }

        .modal-footer {
          display: flex;
          gap: 12px;
          padding: 0 28px 24px;
        }

        .cancel-button,
        .confirm-button {
          flex: 1;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif;
        }

        .cancel-button {
          background: rgba(0, 0, 0, 0.05);
          color: #4b5563;
        }

        .cancel-button:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        .confirm-button {
          background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);
        }

        .confirm-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(147, 51, 234, 0.4);
        }

        /* Processing View */
        .processing-container {
          padding: 48px 28px;
          text-align: center;
        }

        .circular-progress {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto 24px;
        }

        .progress-ring {
          transform: rotate(-90deg);
        }

        .progress-ring-circle {
          transition: stroke-dashoffset 0.3s ease;
          stroke-linecap: round;
        }

        .progress-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 1.5rem;
          font-weight: 700;
          color: #9333ea;
        }

        .processing-message {
          font-size: 1.125rem;
          font-weight: 600;
          color: #4b5563;
          margin: 0;
        }

        /* Success View */
        .success-container {
          padding: 48px 28px;
          text-align: center;
        }

        .success-checkmark {
          margin-bottom: 24px;
          animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .checkmark-circle {
          animation: fillGreen 0.4s ease-out forwards;
        }

        .checkmark-check {
          stroke-dasharray: 20;
          stroke-dashoffset: 20;
          animation: drawCheck 0.3s ease-out 0.2s forwards;
        }

        .success-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #10b981;
          margin: 0 0 8px 0;
        }

        .success-message {
          font-size: 0.9375rem;
          color: #4b5563;
          margin: 0;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fillGreen {
          from {
            fill: #e5e7eb;
          }
          to {
            fill: #10b981;
          }
        }

        @keyframes drawCheck {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </>
  );
}
