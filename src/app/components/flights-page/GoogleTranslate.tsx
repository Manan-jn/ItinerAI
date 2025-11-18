"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

export function GoogleTranslate() {
  const translateRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    // Check if script is already loaded
    if (
      scriptLoadedRef.current ||
      document.getElementById("google-translate-script")
    ) {
      return;
    }

    // Define the callback function globally
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages:
              "en,bn,hi,gu,kn,ml,mr,or,pa,ta,te,as,ar,fr,es,de,it,ja,ko,pt,ru,zh-CN,zh-TW",
            layout:
              window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          "google_translate_element"
        );
      }
    };

    // Load the Google Translate script
    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    script.onerror = () => {
      console.error("Failed to load Google Translate script");
    };

    document.body.appendChild(script);
    scriptLoadedRef.current = true;

    // Cleanup function
    return () => {
      // Don't remove the script on unmount to avoid reloading
      // The script will persist across component remounts
    };
  }, []);

  return (
    <div className="google-translate-wrapper">
      <div id="google_translate_element" ref={translateRef}></div>

      <style jsx global>{`
        /* Container styling */
        .google-translate-wrapper {
          display: flex;
          align-items: center;
        }

        #google_translate_element {
          display: flex;
          align-items: center;
        }

        /* Hide Google branding */
        .goog-te-gadget {
          font-family: inherit !important;
          font-size: 0 !important;
          display: flex !important;
          align-items: center !important;
          gap: 0.375rem !important;
        }

        .goog-te-gadget img {
          display: none !important;
        }

        .goog-te-gadget-simple {
          background: linear-gradient(
            135deg,
            #eff6ff 0%,
            #dbeafe 100%
          ) !important;
          border: 1px solid #bfdbfe !important;
          border-radius: 9999px !important;
          padding: 0.25rem 0.625rem !important;
          font-size: 0.75rem !important;
          font-weight: 500 !important;
          color: #1e40af !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 0.375rem !important;
          transition: all 0.3s ease !important;
          cursor: pointer !important;
          min-height: 28px !important;
        }

        .goog-te-gadget-simple:hover {
          background: linear-gradient(
            135deg,
            #dbeafe 0%,
            #bfdbfe 100%
          ) !important;
          border-color: #93c5fd !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1) !important;
        }

        .goog-te-gadget-simple span {
          color: #1e40af !important;
          font-size: 0.75rem !important;
          font-weight: 500 !important;
          line-height: 1 !important;
          display: inline-flex !important;
          align-items: center !important;
        }

        /* Add globe icon before text */
        .goog-te-gadget-simple::before {
          content: "🌐";
          font-size: 0.875rem;
          margin-right: 0.25rem;
        }

        /* Dropdown menu styling */
        .goog-te-menu-value {
          color: #1e40af !important;
          font-size: 0.75rem !important;
          font-weight: 500 !important;
        }

        .goog-te-menu-value span {
          color: #1e40af !important;
          border-left: none !important;
        }

        .goog-te-menu-value span:first-child {
          display: none !important;
        }

        /* Hide powered by text */
        .goog-te-gadget-simple .goog-te-menu-value span:last-child {
          display: none !important;
        }

        /* Dropdown arrow styling */
        .goog-te-gadget-simple img {
          display: none !important;
        }

        /* Add custom arrow */
        .goog-te-menu-value::after {
          content: "▼";
          font-size: 0.625rem;
          margin-left: 0.375rem;
          color: #1e40af;
        }

        /* Language selector dropdown */
        .goog-te-menu2 {
          background: white !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 0.5rem !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
            0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
          max-height: 400px !important;
          overflow-y: auto !important;
        }

        .goog-te-menu2-item {
          padding: 0.5rem 1rem !important;
          font-size: 0.875rem !important;
          color: #374151 !important;
          transition: all 0.15s ease !important;
        }

        .goog-te-menu2-item:hover {
          background: #eff6ff !important;
          color: #1e40af !important;
        }

        .goog-te-menu2-item-selected {
          background: #dbeafe !important;
          color: #1e40af !important;
          font-weight: 600 !important;
        }

        /* Hide Google Translate banner */
        .goog-te-banner-frame {
          display: none !important;
        }

        body {
          top: 0 !important;
        }

        /* Fix for iframe */
        .skiptranslate iframe {
          visibility: hidden !important;
          height: 0 !important;
          position: absolute !important;
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          .goog-te-gadget-simple {
            padding: 0.25rem 0.5rem !important;
            font-size: 0.7rem !important;
          }

          .goog-te-gadget-simple::before {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}
