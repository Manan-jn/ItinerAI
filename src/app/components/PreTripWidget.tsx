"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Dynamically import PDF wrapper components to ensure they only load on client side
const PDFViewerWrapper = dynamic(() => import("./pdf/PDFViewerWrapper"), {
  ssr: false,
  loading: () => (
    <div className="loading-state">
      <div className="spinner"></div>
      <p>Loading PDF viewer...</p>
    </div>
  ),
});

const PDFDownloadButton = dynamic(() => import("./pdf/PDFDownloadButton"), {
  ssr: false,
  loading: () => (
    <button className="download-button" disabled>
      <span>Loading...</span>
    </button>
  ),
});

export interface PreTripWidgetProps {
  isVisible: boolean;
  onToggle: () => void;
  markdownContent: string;
  tripTitle: string;
  onClose?: () => void;
}

export default function PreTripWidget({
  isVisible,
  onToggle,
  markdownContent,
  tripTitle,
  onClose,
}: PreTripWidgetProps) {
  const [isClient, setIsClient] = useState(false);
  const hasRenderedRef = useRef(false);

  // Ensure we're only rendering PDF viewer on client side
  useEffect(() => {
    // Only set isClient once to prevent re-mounting PDF components
    if (!hasRenderedRef.current) {
      setIsClient(true);
      hasRenderedRef.current = true;
    }
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <div className="pretrip-widget-container">
        <div className="centered-wrapper">
          {/* Header Section */}
          <div className="pretrip-header">
            <div className="header-content">
              <h2 className="header-title">📄 Pre-Trip Brief</h2>
              <p className="header-subtitle">{tripTitle}</p>
            </div>
            <div className="header-actions">
              {/* Download Button with stable container */}
              <div style={{ minWidth: "140px", minHeight: "42px" }}>
                {isClient ? (
                  <PDFDownloadButton
                    markdownContent={markdownContent}
                    fileName={`pre-trip-${tripTitle
                      .replace(/\s+/g, "-")
                      .toLowerCase()}.pdf`}
                  />
                ) : (
                  <button className="download-button" disabled>
                    <span>Loading...</span>
                  </button>
                )}
              </div>
              <button
                onClick={onToggle}
                className="close-button"
                aria-label="Close pre-trip widget"
              >
                <svg
                  width="18"
                  height="18"
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
            </div>
          </div>

          {/* PDF Viewer Section */}
          <div className="pdf-viewer-container">
            {isClient ? (
              <PDFViewerWrapper markdownContent={markdownContent} />
            ) : (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading PDF viewer...</p>
              </div>
            )}
          </div>

          {/* Bottom Action Bar */}
          {onClose && (
            <div className="action-bar">
              <button onClick={onClose} className="finish-button">
                <span>Finish & Continue</span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .pretrip-widget-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: linear-gradient(
            135deg,
            #e0f2fe 0%,
            #dbeafe 50%,
            #e0e7ff 100%
          );
          overflow: hidden;
          padding: 0;
        }

        .centered-wrapper {
          width: 80%;
          max-width: 1400px;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 20px 0;
        }

        .pretrip-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 28px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(255, 255, 255, 0.85) 100%
          );
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-radius: 16px;
          border: 1px solid rgba(59, 130, 246, 0.2);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.08),
            0 8px 32px rgba(37, 99, 235, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }

        .header-content {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .header-title {
          font-size: 1.375rem;
          font-weight: 700;
          background: linear-gradient(
            135deg,
            #1e40af 0%,
            #3b82f6 50%,
            #60a5fa 100%
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
            "Segoe UI", Roboto, sans-serif;
          letter-spacing: -0.02em;
        }

        .header-subtitle {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #64748b;
          margin: 0;
          padding-left: 16px;
          border-left: 2px solid rgba(59, 130, 246, 0.3);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        :global(.download-button) {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 24px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.25),
            0 2px 8px rgba(37, 99, 235, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          text-decoration: none;
          position: relative;
          overflow: hidden;
        }

        :global(.download-button::before) {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          transition: left 0.5s;
        }

        :global(.download-button:hover::before) {
          left: 100%;
        }

        :global(.download-button:hover:not(:disabled)) {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4),
            0 4px 12px rgba(37, 99, 235, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.3),
            0 0 24px rgba(59, 130, 246, 0.3);
        }

        :global(.download-button:active:not(:disabled)) {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }

        :global(.download-button:disabled) {
          opacity: 0.6;
          cursor: not-allowed;
        }

        :global(.download-button svg) {
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
        }

        .close-button {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(59, 130, 246, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .close-button:hover {
          background: rgba(239, 246, 255, 1);
          color: #3b82f6;
          transform: scale(1.05) rotate(90deg);
          border-color: rgba(59, 130, 246, 0.4);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }

        .pdf-viewer-container {
          flex: 1;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(10px);
          position: relative;
          border-radius: 16px;
          border: 1px solid rgba(59, 130, 246, 0.15);
          box-shadow: 0 8px 32px rgba(59, 130, 246, 0.08),
            0 4px 16px rgba(37, 99, 235, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.5);
          padding: 12px;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 20px;
        }

        .spinner {
          width: 56px;
          height: 56px;
          border: 5px solid rgba(59, 130, 246, 0.15);
          border-top: 5px solid #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .loading-state p {
          color: #64748b;
          font-size: 0.9375rem;
          font-weight: 600;
        }

        .action-bar {
          display: flex;
          justify-content: center;
          padding: 0;
        }

        .finish-button {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 40px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.9) 0%,
            rgba(255, 255, 255, 0.8) 100%
          );
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-radius: 16px;
          border: 1px solid rgba(59, 130, 246, 0.2);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.1),
            0 2px 8px rgba(37, 99, 235, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
          font-size: 1.0625rem;
          font-weight: 600;
          color: #1e40af;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
            "Segoe UI", Roboto, sans-serif;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
          position: relative;
          overflow: hidden;
        }

        .finish-button::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(59, 130, 246, 0.2),
            transparent
          );
          transition: left 0.5s;
        }

        .finish-button:hover::before {
          left: 100%;
        }

        .finish-button:hover {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(59, 130, 246, 0.35),
            0 6px 16px rgba(37, 99, 235, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.3),
            0 0 32px rgba(59, 130, 246, 0.25);
          border-color: rgba(59, 130, 246, 0.4);
        }

        .finish-button:active {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
        }

        .finish-button svg {
          flex-shrink: 0;
          transition: transform 0.3s ease;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
        }

        .finish-button:hover svg {
          transform: scale(1.15) rotate(5deg);
        }

        @media (max-width: 1200px) {
          .centered-wrapper {
            width: 90%;
          }
        }

        @media (max-width: 768px) {
          .centered-wrapper {
            width: 95%;
            padding: 16px 0;
            gap: 16px;
          }

          .pretrip-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
            padding: 16px 20px;
          }

          .header-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .header-subtitle {
            padding-left: 0;
            border-left: none;
            border-top: 2px solid rgba(59, 130, 246, 0.3);
            padding-top: 8px;
          }

          .header-actions {
            width: 100%;
            justify-content: space-between;
          }

          :global(.download-button) {
            flex: 1;
            justify-content: center;
          }

          .pdf-viewer-container {
            padding: 8px;
          }

          .finish-button {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 640px) {
          .centered-wrapper {
            width: 100%;
            padding: 12px;
            gap: 12px;
          }

          .pretrip-header {
            padding: 12px 16px;
            border-radius: 12px;
          }

          .header-title {
            font-size: 1.125rem;
          }

          .pdf-viewer-container {
            border-radius: 12px;
            padding: 6px;
          }
        }
      `}</style>
    </>
  );
}
