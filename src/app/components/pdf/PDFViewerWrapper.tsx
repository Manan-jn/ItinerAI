"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface PDFViewerWrapperProps {
  markdownContent: string;
}

export default function PDFViewerWrapper({
  markdownContent,
}: PDFViewerWrapperProps) {
  return (
    <div className="pdf-preview-container">
      <div className="pdf-preview-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => <h1 className="preview-h1">{children}</h1>,
            h2: ({ children }) => <h2 className="preview-h2">{children}</h2>,
            h3: ({ children }) => <h3 className="preview-h3">{children}</h3>,
            h4: ({ children }) => <h4 className="preview-h4">{children}</h4>,
            p: ({ children }) => <p className="preview-p">{children}</p>,
            ul: ({ children }) => <ul className="preview-ul">{children}</ul>,
            ol: ({ children }) => <ol className="preview-ol">{children}</ol>,
            li: ({ children }) => <li className="preview-li">{children}</li>,
            code: ({ inline, children }) =>
              inline ? (
                <code className="preview-code-inline">{children}</code>
              ) : (
                <pre className="preview-code-block">
                  <code>{children}</code>
                </pre>
              ),
            blockquote: ({ children }) => (
              <blockquote className="preview-blockquote">{children}</blockquote>
            ),
            hr: () => <hr className="preview-hr" />,
            a: ({ href, children }) => (
              <a
                href={href}
                className="preview-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ),
            table: ({ children }) => (
              <table className="preview-table">{children}</table>
            ),
            th: ({ children }) => <th className="preview-th">{children}</th>,
            td: ({ children }) => <td className="preview-td">{children}</td>,
          }}
        >
          {markdownContent}
        </ReactMarkdown>
      </div>

      <style jsx>{`
        .pdf-preview-container {
          width: 100%;
          height: 100%;
          overflow: auto;
          background: #ffffff;
          border-radius: 8px;
          padding: 40px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            "Helvetica Neue", Arial, sans-serif;
        }

        .pdf-preview-content {
          max-width: 210mm;
          margin: 0 auto;
          background: #ffffff;
        }

        :global(.preview-h1) {
          font-size: 24px;
          font-weight: bold;
          margin: 24px 0 16px 0;
          color: #1e40af;
          line-height: 1.2;
        }

        :global(.preview-h2) {
          font-size: 20px;
          font-weight: bold;
          margin: 20px 0 12px 0;
          color: #1e40af;
          line-height: 1.2;
        }

        :global(.preview-h3) {
          font-size: 16px;
          font-weight: bold;
          margin: 16px 0 10px 0;
          color: #2563eb;
          line-height: 1.2;
        }

        :global(.preview-h4) {
          font-size: 14px;
          font-weight: bold;
          margin: 12px 0 8px 0;
          color: #3b82f6;
          line-height: 1.2;
        }

        :global(.preview-p) {
          margin: 0 0 12px 0;
          text-align: justify;
          color: #1f2937;
          line-height: 1.6;
          font-size: 12px;
        }

        :global(.preview-ul),
        :global(.preview-ol) {
          margin: 12px 0;
          padding-left: 20px;
          color: #374151;
        }

        :global(.preview-li) {
          margin-bottom: 6px;
          font-size: 12px;
          line-height: 1.6;
        }

        :global(.preview-code-inline) {
          background-color: #f3f4f6;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: "Courier New", Courier, monospace;
          font-size: 11px;
          color: #1f2937;
        }

        :global(.preview-code-block) {
          background-color: #f3f4f6;
          padding: 12px;
          border-radius: 6px;
          overflow-x: auto;
          margin: 12px 0;
          font-family: "Courier New", Courier, monospace;
          font-size: 11px;
          color: #1f2937;
        }

        :global(.preview-code-block code) {
          background: none;
          padding: 0;
        }

        :global(.preview-hr) {
          border: none;
          border-top: 1px solid #e5e7eb;
          margin: 16px 0;
        }

        :global(.preview-blockquote) {
          border-left: 3px solid #60a5fa;
          margin: 12px 0;
          padding-left: 12px;
          font-style: italic;
          color: #4b5563;
        }

        :global(.preview-link) {
          color: #2563eb;
          text-decoration: underline;
        }

        :global(.preview-table) {
          border-collapse: collapse;
          width: 100%;
          margin: 12px 0;
          font-size: 12px;
        }

        :global(.preview-th),
        :global(.preview-td) {
          border: 1px solid #e5e7eb;
          padding: 8px;
          text-align: left;
        }

        :global(.preview-th) {
          background-color: #f3f4f6;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}
