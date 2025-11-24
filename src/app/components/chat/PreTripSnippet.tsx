"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamically import PDF components
const PDFDownloadButton = dynamic(() => import("../pdf/PDFDownloadButton"), {
  ssr: false,
  loading: () => <span className="loading-text">Loading...</span>,
});

interface PreTripSnippetProps {
  tripTitle: string;
  markdownContent: string;
}

export function PreTripSnippet({ tripTitle, markdownContent }: PreTripSnippetProps) {
  const [isClient, setIsClient] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Extract first few lines for preview
  const previewLines = markdownContent.split('\n').filter(line => line.trim()).slice(0, 5);
  const previewText = previewLines.join('\n');
  const hasMoreContent = markdownContent.split('\n').filter(line => line.trim()).length > 5;

  return (
    <div className="pretrip-snippet">
      {/* Header */}
      <div className="snippet-header">
        <div className="header-icon">📄</div>
        <div className="header-content">
          <h3 className="header-title">Pre-Trip Brief Ready</h3>
          <p className="header-subtitle">{tripTitle}</p>
        </div>
      </div>

      {/* PDF Preview */}
      <div className={`pdf-preview ${isExpanded ? 'expanded' : ''}`}>
        <div className="preview-header">
          <span className="preview-title">Document Preview</span>
          <button
            className="expand-button"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '▼ Collapse' : '▶ Expand'}
          </button>
        </div>
        <div className="preview-content">
          <div className="markdown-preview">
            {previewText.split('\n').map((line, index) => {
              // Simple markdown rendering for preview
              if (line.startsWith('# ')) {
                return <h1 key={index} className="md-h1">{line.substring(2)}</h1>;
              } else if (line.startsWith('## ')) {
                return <h2 key={index} className="md-h2">{line.substring(3)}</h2>;
              } else if (line.startsWith('### ')) {
                return <h3 key={index} className="md-h3">{line.substring(4)}</h3>;
              } else if (line.startsWith('**') && line.endsWith('**')) {
                return <strong key={index} className="md-strong">{line.slice(2, -2)}</strong>;
              } else if (line.trim()) {
                return <p key={index} className="md-p">{line}</p>;
              }
              return null;
            })}
            {isExpanded && (
              <div className="full-content">
                {markdownContent.split('\n').slice(5).map((line, index) => {
                  if (line.startsWith('# ')) {
                    return <h1 key={index + 5} className="md-h1">{line.substring(2)}</h1>;
                  } else if (line.startsWith('## ')) {
                    return <h2 key={index + 5} className="md-h2">{line.substring(3)}</h2>;
                  } else if (line.startsWith('### ')) {
                    return <h3 key={index + 5} className="md-h3">{line.substring(4)}</h3>;
                  } else if (line.startsWith('**') && line.endsWith('**')) {
                    return <strong key={index + 5} className="md-strong">{line.slice(2, -2)}</strong>;
                  } else if (line.trim()) {
                    return <p key={index + 5} className="md-p">{line}</p>;
                  }
                  return null;
                })}
              </div>
            )}
            {!isExpanded && hasMoreContent && (
              <div className="more-indicator">... and more</div>
            )}
          </div>
        </div>
      </div>

      {/* Download Button */}
      <div className="download-section">
        {isClient ? (
          <PDFDownloadButton
            markdownContent={markdownContent}
            fileName={`pre-trip-${tripTitle.replace(/\s+/g, '-').toLowerCase()}.pdf`}
          />
        ) : (
          <button className="download-btn-placeholder" disabled>
            <span>⬇️ Loading...</span>
          </button>
        )}
      </div>

      <style jsx>{`
        .pretrip-snippet {
          display: flex;
          flex-direction: column;
          gap: 12px;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
            "Segoe UI", Roboto, sans-serif;
        }

        .snippet-header {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e5e7eb;
        }

        .header-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .header-content {
          flex: 1;
          min-width: 0;
        }

        .header-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 4px 0;
        }

        .header-subtitle {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0;
        }

        .pdf-preview {
          background: linear-gradient(to br, #f9fafb, #ffffff);
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 10px;
          background: linear-gradient(to r, #dbeafe, #e0e7ff);
          border-bottom: 1px solid #e5e7eb;
        }

        .preview-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: #1f2937;
        }

        .expand-button {
          background: none;
          border: none;
          color: #3b82f6;
          font-size: 0.6875rem;
          font-weight: 500;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .expand-button:hover {
          background: rgba(59, 130, 246, 0.1);
          color: #2563eb;
        }

        .preview-content {
          padding: 10px;
          max-height: 250px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }

        .pdf-preview.expanded .preview-content {
          max-height: 500px;
        }

        .preview-content::-webkit-scrollbar {
          width: 4px;
        }

        .preview-content::-webkit-scrollbar-track {
          background: #f1f5f9;
        }

        .preview-content::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 2px;
        }

        .preview-content::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        .markdown-preview {
          color: #374151;
          line-height: 1.6;
        }

        .md-h1 {
          font-size: 1rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 8px 0;
        }

        .md-h2 {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin: 8px 0 6px 0;
        }

        .md-h3 {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #4b5563;
          margin: 6px 0 4px 0;
        }

        .md-p {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 4px 0;
        }

        .md-strong {
          font-weight: 600;
          color: #1f2937;
        }

        .full-content {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #e5e7eb;
        }

        .more-indicator {
          margin-top: 8px;
          padding: 6px;
          text-align: center;
          font-size: 0.6875rem;
          color: #9ca3af;
          font-style: italic;
        }

        .download-section {
          display: flex;
          justify-content: center;
        }

        .loading-text {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .download-btn-placeholder {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          color: #9ca3af;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: not-allowed;
        }

        :global(.download-button) {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border: 1px solid #2563eb;
          border-radius: 8px;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          box-shadow: 0 1px 3px rgba(59, 130, 246, 0.2);
        }

        :global(.download-button:hover) {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          border-color: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
        }
      `}</style>
    </div>
  );
}

