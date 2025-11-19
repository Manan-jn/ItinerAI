"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface PDFDownloadLinkWrapperProps {
  markdownContent: string;
  fileName: string;
}

export default function PDFDownloadLinkWrapper({
  markdownContent,
  fileName,
}: PDFDownloadLinkWrapperProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);

    try {
      // Dynamic import to avoid SSR issues
      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      // Create a temporary container
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.width = "210mm"; // A4 width
      container.style.padding = "20mm";
      container.style.backgroundColor = "#ffffff";
      container.style.fontFamily = "Arial, sans-serif";
      container.style.fontSize = "12px";
      container.style.lineHeight = "1.6";
      container.style.color = "#1f2937";

      // Add custom CSS for markdown rendering
      const style = document.createElement("style");
      style.textContent = `
        .markdown-content h1 {
          font-size: 24px;
          font-weight: bold;
          margin: 24px 0 16px 0;
          color: #1e40af;
        }
        .markdown-content h2 {
          font-size: 20px;
          font-weight: bold;
          margin: 20px 0 12px 0;
          color: #1e40af;
        }
        .markdown-content h3 {
          font-size: 16px;
          font-weight: bold;
          margin: 16px 0 10px 0;
          color: #2563eb;
        }
        .markdown-content h4 {
          font-size: 14px;
          font-weight: bold;
          margin: 12px 0 8px 0;
          color: #3b82f6;
        }
        .markdown-content p {
          margin: 0 0 12px 0;
          text-align: justify;
        }
        .markdown-content ul, .markdown-content ol {
          margin: 12px 0;
          padding-left: 20px;
        }
        .markdown-content li {
          margin-bottom: 6px;
        }
        .markdown-content strong {
          font-weight: bold;
        }
        .markdown-content em {
          font-style: italic;
        }
        .markdown-content code {
          background-color: #f3f4f6;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: monospace;
          font-size: 11px;
        }
        .markdown-content pre {
          background-color: #f3f4f6;
          padding: 12px;
          border-radius: 6px;
          overflow-x: auto;
          margin: 12px 0;
        }
        .markdown-content pre code {
          background: none;
          padding: 0;
        }
        .markdown-content hr {
          border: none;
          border-top: 1px solid #e5e7eb;
          margin: 16px 0;
        }
        .markdown-content blockquote {
          border-left: 3px solid #60a5fa;
          margin: 12px 0;
          padding-left: 12px;
          font-style: italic;
          color: #4b5563;
        }
        .markdown-content a {
          color: #2563eb;
          text-decoration: underline;
        }
        .markdown-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 12px 0;
        }
        .markdown-content table th,
        .markdown-content table td {
          border: 1px solid #e5e7eb;
          padding: 8px;
          text-align: left;
        }
        .markdown-content table th {
          background-color: #f3f4f6;
          font-weight: bold;
        }
      `;

      container.appendChild(style);

      // Create markdown container
      const markdownDiv = document.createElement("div");
      markdownDiv.className = "markdown-content";
      container.appendChild(markdownDiv);

      document.body.appendChild(container);

      // Render markdown using a temporary React root
      const { createRoot } = await import("react-dom/client");
      const root = createRoot(markdownDiv);

      await new Promise<void>((resolve) => {
        root.render(
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {markdownContent}
          </ReactMarkdown>
        );
        // Wait for rendering
        setTimeout(resolve, 100);
      });

      // Capture the content
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      // Download
      pdf.save(fileName);

      // Cleanup
      root.unmount();
      document.body.removeChild(container);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="download-button"
      disabled={isGenerating}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      <span>{isGenerating ? "Generating..." : "Download PDF"}</span>
    </button>
  );
}
