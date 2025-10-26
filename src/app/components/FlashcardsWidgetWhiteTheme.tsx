"use client";

import React, { forwardRef } from "react";
import FlashcardsWidget from "./FlashcardsWidget";
import { FlashcardsWidgetRef } from "./flashcards/types";

interface FlashcardsWidgetWhiteThemeProps {
  isVisible: boolean;
  onToggle: () => void;
  trips?: any[];
  rightPanelCollapsed?: boolean;
  onTripSelect?: (trip: any | null) => void;
}

const FlashcardsWidgetWhiteTheme = forwardRef<
  FlashcardsWidgetRef,
  FlashcardsWidgetWhiteThemeProps
>((props, ref) => {
  return (
    <div className="flashcards-white-theme">
      <FlashcardsWidget ref={ref} {...props} />

      <style jsx global>{`
        /* Respect appear animation from base widget */
        .flashcards-white-theme .flashcards-widget.appear {
          animation: fc-fade-up 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .flashcards-white-theme .flashcards-widget {
          background: #ffffff;
          border: none;
          box-shadow: none;
          padding: 8px 16px 12px 16px;
          margin: 0;
          width: 100%;
          height: 100%;
          max-width: 100%;
          max-height: 100%;
          border-radius: 0;
          overflow: hidden;
        }

        .flashcards-white-theme .flashcards-container {
          flex: 1;
          min-height: 350px;
          max-height: 100%;
          border-radius: 8px;
          overflow: visible;
          position: relative;
          margin: 0;
          padding: 0 0 50px 0;
          contain: layout style;
          display: flex;
          align-items: center;
          background: #ffffff;
        }

        .flashcards-white-theme .flashcards-header .header-content h3 {
          color: #1e40af;
          font-weight: 600;
        }

        /* Remove bouncing/shivering during navigation */
        .flashcards-white-theme .flashcard-slide {
          transition: transform 0.4s ease-out, opacity 0.4s ease-out,
            filter 0.4s ease-out !important;
          will-change: auto !important;
        }

        .flashcards-white-theme .flashcards-scroll-wrapper {
          will-change: auto !important;
        }

        .flashcards-white-theme .toggle-btn {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          color: #3b82f6;
        }

        .flashcards-white-theme .toggle-btn:hover {
          background: rgba(59, 130, 246, 0.15);
          color: #1d4ed8;
          border-color: rgba(59, 130, 246, 0.3);
        }

        .flashcards-white-theme .flashcard-slide {
          border: 2px solid rgba(59, 130, 246, 0.2);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          background: #ffffff;
        }

        .flashcards-white-theme .flashcard-slide.inactive {
          width: 170px;
          height: 270px;
        }

        /* Ensure flashcard wrapper has proper positioning for tick button */
        .flashcards-white-theme .flashcard-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .flashcards-white-theme .flashcard-slide.active {
          border-color: rgba(59, 130, 246, 0.4);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15),
            0 0 0 2px rgba(59, 130, 246, 0.3);
          width: 250px;
          height: 320px;
        }

        .flashcards-white-theme .flashcard-slide.active:hover {
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2),
            0 0 0 2px rgba(59, 130, 246, 0.4);
        }

        .flashcards-white-theme .flashcard-slide.selected {
          border: 3px solid rgba(34, 197, 94, 0.8);
          box-shadow: 0 0 20px rgba(34, 197, 94, 0.4),
            0 12px 40px rgba(0, 0, 0, 0.15);
        }

        /* Improve text contrast and visibility - remove blur/text-shadow */
        .flashcards-white-theme .slide-content h2 {
          color: #0f172a;
          text-shadow: none;
          font-weight: 700;
        }

        .flashcards-white-theme .trip-name {
          color: #ffffff !important;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.7) !important;
          font-weight: 700 !important;
          letter-spacing: -0.02em;
        }

        .flashcards-white-theme .info-label {
          color: #1e293b;
          font-weight: 700;
          text-shadow: none;
        }

        .flashcards-white-theme .info-value {
          color: #0f172a;
          font-weight: 800;
          text-shadow: none;
        }

        .flashcards-white-theme .theme-tag {
          background: rgba(59, 130, 246, 0.15);
          color: #1e40af;
          border: 1px solid rgba(59, 130, 246, 0.3);
          font-weight: 600;
        }

        .flashcards-white-theme .flashcard-select-btn {
          background: rgba(59, 130, 246, 0.95);
          border: 2.5px solid #ffffff;
          backdrop-filter: blur(10px);
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3),
            0 1px 4px rgba(0, 0, 0, 0.1);
          width: 32px;
          height: 32px;
          position: absolute !important;
          top: -16px !important;
          right: -16px !important;
          z-index: 15 !important;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .flashcards-white-theme .flashcard-select-btn:hover {
          background: rgba(59, 130, 246, 1);
          border-color: #ffffff;
          transform: scale(1.05) !important;
          box-shadow: 0 3px 12px rgba(59, 130, 246, 0.4),
            0 2px 6px rgba(0, 0, 0, 0.15);
        }

        .flashcards-white-theme .flashcard-select-btn svg {
          width: 16px;
          height: 16px;
          stroke: #ffffff;
          stroke-width: 3;
          opacity: 1;
        }

        .flashcards-white-theme .flashcard-select-btn.selected {
          background: rgba(34, 197, 94, 0.95) !important;
          border-color: #ffffff !important;
          box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3),
            0 1px 4px rgba(0, 0, 0, 0.1) !important;
          position: absolute !important;
          top: -16px !important;
          right: -16px !important;
        }

        .flashcards-white-theme .flashcard-select-btn.selected svg {
          stroke: #ffffff;
          stroke-width: 3.5;
          opacity: 1;
        }

        .flashcards-white-theme .flashcard-select-btn.selected:hover {
          background: rgba(34, 197, 94, 1) !important;
          transform: scale(1.05) !important;
          box-shadow: 0 3px 12px rgba(34, 197, 94, 0.4),
            0 2px 6px rgba(0, 0, 0, 0.15) !important;
        }

        .flashcards-white-theme .nav-arrow {
          background: rgba(255, 255, 255, 0.95);
          color: #3b82f6;
          border: 2px solid rgba(59, 130, 246, 0.3);
          backdrop-filter: blur(16px);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2),
            inset 0 1px 1px rgba(255, 255, 255, 0.8);
          transition: all 0.25s ease-out !important;
          transform: translateY(-50%) !important;
        }

        .flashcards-white-theme .nav-arrow:hover {
          background: rgba(255, 255, 255, 1);
          border-color: rgba(59, 130, 246, 0.5);
          color: #1d4ed8;
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.3),
            inset 0 1px 2px rgba(255, 255, 255, 1);
          transform: translateY(-50%) scale(1.05) !important;
        }

        .flashcards-white-theme .nav-arrow:active {
          transform: translateY(-50%) scale(0.98) !important;
        }

        .flashcards-white-theme .info-card {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(59, 130, 246, 0.25);
          backdrop-filter: blur(12px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .flashcards-white-theme .info-card:hover {
          background: rgba(255, 255, 255, 1);
          border-color: rgba(59, 130, 246, 0.35);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }

        .flashcards-white-theme .info-card * {
          text-shadow: none !important;
        }

        .flashcards-white-theme .info-icon {
          background: rgba(59, 130, 246, 0.2);
          color: #1e40af;
        }

        .flashcards-white-theme .slide-overlay {
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.2) 0%,
            rgba(255, 255, 255, 0.05) 30%,
            rgba(255, 255, 255, 0.05) 70%,
            rgba(0, 0, 0, 0.75) 100%
          );
          transition: background 0.3s ease;
        }

        .flashcards-white-theme .flashcard-slide:hover .slide-overlay {
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.25) 0%,
            rgba(255, 255, 255, 0.1) 30%,
            rgba(255, 255, 255, 0.1) 70%,
            rgba(0, 0, 0, 0.65) 100%
          );
        }

        /* Modal styles for white theme - fix white backgrounds */
        .flashcards-white-theme .modal-backdrop {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(24px);
        }

        .flashcards-white-theme .modal-container {
          border: 2px solid rgba(59, 130, 246, 0.2);
          box-shadow: 0 20px 60px rgba(59, 130, 246, 0.3);
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(20px);
        }

        .flashcards-white-theme .modal-close-btn {
          background: rgba(255, 255, 255, 0.9);
          border: 2px solid rgba(59, 130, 246, 0.3);
          color: #3b82f6;
        }

        .flashcards-white-theme .modal-close-btn:hover {
          background: rgba(255, 255, 255, 1);
          border-color: rgba(59, 130, 246, 0.5);
          color: #1d4ed8;
        }

        .flashcards-white-theme .meta-card {
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(59, 130, 246, 0.2);
          backdrop-filter: blur(10px);
        }

        .flashcards-white-theme .meta-card:hover {
          background: rgba(255, 255, 255, 0.75);
          border-color: rgba(59, 130, 246, 0.3);
        }

        .flashcards-white-theme .meta-card .info-label,
        .flashcards-white-theme .meta-card .meta-label {
          color: #1e293b !important;
          text-shadow: 0 1px 1px rgba(255, 255, 255, 0.5) !important;
        }

        .flashcards-white-theme .meta-card .info-value,
        .flashcards-white-theme .meta-card .meta-value {
          color: #0f172a !important;
          text-shadow: 0 1px 1px rgba(255, 255, 255, 0.5) !important;
        }

        .flashcards-white-theme .modal-theme-tag {
          background: rgba(59, 130, 246, 0.2);
          color: #1d4ed8;
          border: 1px solid rgba(59, 130, 246, 0.3);
          backdrop-filter: blur(5px);
        }

        .flashcards-white-theme .modal-theme-tag:hover {
          background: rgba(59, 130, 246, 0.3);
          border-color: rgba(59, 130, 246, 0.4);
        }

        .flashcards-white-theme .modal-day-card {
          background: rgba(255, 255, 255, 0.5);
          border: 1px solid rgba(59, 130, 246, 0.15);
          backdrop-filter: blur(10px);
        }

        .flashcards-white-theme .modal-day-card:hover {
          background: rgba(255, 255, 255, 0.65);
          border-color: rgba(59, 130, 246, 0.25);
        }

        .flashcards-white-theme .modal-day-card .day-title,
        .flashcards-white-theme .modal-day-card h4,
        .flashcards-white-theme .modal-day-card h5 {
          color: #0f172a !important;
          text-shadow: none !important;
        }

        .flashcards-white-theme .modal-day-card p {
          color: #475569 !important;
          text-shadow: none !important;
        }

        .flashcards-white-theme .day-badge {
          background: rgba(59, 130, 246, 0.2);
          border-bottom: 1px solid rgba(59, 130, 246, 0.3);
          backdrop-filter: blur(5px);
        }

        .flashcards-white-theme .day-number {
          color: #1d4ed8;
          text-shadow: 0 1px 1px rgba(255, 255, 255, 0.5);
          font-weight: 700;
        }

        .flashcards-white-theme .enhanced-city-card {
          background: rgba(255, 255, 255, 0.45);
          border: 1px solid rgba(59, 130, 246, 0.15);
          backdrop-filter: blur(8px);
        }

        .flashcards-white-theme .enhanced-city-card:hover {
          background: rgba(255, 255, 255, 0.6);
          border-color: rgba(59, 130, 246, 0.25);
        }

        .flashcards-white-theme .enhanced-city-card h4,
        .flashcards-white-theme .enhanced-city-card h5,
        .flashcards-white-theme .enhanced-city-card h6 {
          color: #0f172a !important;
          text-shadow: none !important;
        }

        .flashcards-white-theme .enhanced-city-card p,
        .flashcards-white-theme .enhanced-city-card span {
          text-shadow: none !important;
        }

        .flashcards-white-theme .city-info-header {
          background: rgba(59, 130, 246, 0.05);
        }

        .flashcards-white-theme .city-title {
          color: #1e40af;
          text-shadow: none;
          font-weight: 700;
        }

        .flashcards-white-theme .city-location {
          color: #475569;
          text-shadow: none;
          font-weight: 500;
        }

        .flashcards-white-theme .city-tag-item {
          background: rgba(59, 130, 246, 0.1);
          color: #1d4ed8;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .flashcards-white-theme .enhanced-activity-item {
          border-top: 1px solid rgba(59, 130, 246, 0.1);
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(5px);
        }

        .flashcards-white-theme .enhanced-activity-item:hover {
          background: rgba(255, 255, 255, 0.55);
        }

        .flashcards-white-theme .enhanced-activity-item h4,
        .flashcards-white-theme .enhanced-activity-item h5 {
          color: #0f172a !important;
          text-shadow: none !important;
        }

        .flashcards-white-theme .enhanced-activity-item p,
        .flashcards-white-theme .enhanced-activity-item span {
          text-shadow: none !important;
        }

        .flashcards-white-theme .activity-number-badge {
          background: rgba(59, 130, 246, 0.15);
          color: #1d4ed8;
          border: 1px solid rgba(59, 130, 246, 0.2);
          text-shadow: none;
          font-weight: 700;
        }

        .flashcards-white-theme .activity-title {
          color: #1e40af;
          text-shadow: none;
          font-weight: 700;
        }

        .flashcards-white-theme .activity-subtitle {
          color: #475569;
          text-shadow: none;
          font-weight: 500;
        }

        .flashcards-white-theme .activity-action-btn {
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(59, 130, 246, 0.2);
          color: #3b82f6;
        }

        .flashcards-white-theme .activity-action-btn.add-btn:hover {
          background: rgba(34, 197, 94, 0.1);
          border-color: rgba(34, 197, 94, 0.3);
          color: #059669;
        }

        .flashcards-white-theme .activity-action-btn.remove-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
          color: #dc2626;
        }

        .flashcards-white-theme .chatbox-container {
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(59, 130, 246, 0.2);
          backdrop-filter: blur(24px);
        }

        .flashcards-white-theme .chatbox-input {
          color: #1e40af;
          text-shadow: none;
          font-weight: 500;
        }

        .flashcards-white-theme .chatbox-input::placeholder {
          color: rgba(59, 130, 246, 0.5);
          text-shadow: none;
        }

        .flashcards-white-theme .chatbox-submit-btn {
          background: rgba(59, 130, 246, 0.8);
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .flashcards-white-theme .chatbox-submit-btn:hover {
          background: rgba(59, 130, 246, 0.9);
          border-color: rgba(59, 130, 246, 0.5);
        }

        /* Global text improvements for all elements */
        .flashcards-white-theme .modal-container h1,
        .flashcards-white-theme .modal-container h2,
        .flashcards-white-theme .modal-container h3,
        .flashcards-white-theme .modal-container h4,
        .flashcards-white-theme .modal-container h5,
        .flashcards-white-theme .modal-container h6 {
          color: #0f172a !important;
          text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8) !important;
        }

        /* Specific styles for modal header elements */
        .flashcards-white-theme .modal-title {
          color: #0f172a !important;
          text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8) !important;
        }

        .flashcards-white-theme .modal-meta {
          text-shadow: none !important;
        }

        .flashcards-white-theme .itinerary-title {
          color: #0f172a !important;
          text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8) !important;
        }

        .flashcards-white-theme .modal-header {
          background: rgba(255, 255, 255, 0.35);
          backdrop-filter: blur(10px);
          padding: 24px;
          border-radius: 12px 12px 0 0;
        }

        .flashcards-white-theme .modal-body {
          background: transparent;
        }

        .flashcards-white-theme .modal-container p,
        .flashcards-white-theme .modal-container span,
        .flashcards-white-theme .modal-container div {
          text-shadow: none !important;
        }

        .flashcards-white-theme .slide-content * {
          text-shadow: none !important;
        }

        /* Spot/Badge styling fixes */
        .flashcards-white-theme .spot-title,
        .flashcards-white-theme .spot-subtitle {
          color: #0f172a !important;
          text-shadow: none !important;
        }

        /* Responsive adjustments for white theme */
        @media (max-width: 768px) {
          .flashcards-white-theme .flashcards-widget {
            padding: 6px 12px 10px 12px;
          }

          .flashcards-white-theme .flashcards-container {
            min-height: 300px;
            padding: 0 0 45px 0;
          }

          .flashcards-white-theme .flashcard-slide.active {
            width: 220px;
            height: 300px;
          }

          .flashcards-white-theme .flashcard-slide.inactive {
            width: 160px;
            height: 250px;
          }

          .flashcards-white-theme .flashcard-select-btn {
            width: 30px;
            height: 30px;
            top: -15px !important;
            right: -15px !important;
          }

          .flashcards-white-theme .flashcard-select-btn:hover,
          .flashcards-white-theme .flashcard-select-btn.selected,
          .flashcards-white-theme .flashcard-select-btn.selected:hover {
            top: -15px !important;
            right: -15px !important;
          }

          .flashcards-white-theme .nav-arrow {
            width: 36px;
            height: 36px;
          }
        }

        @media (max-width: 480px) {
          .flashcards-white-theme .flashcards-widget {
            padding: 4px 8px 8px 8px;
          }

          .flashcards-white-theme .flashcards-container {
            min-height: 280px;
            padding: 0 0 40px 0;
          }

          .flashcards-white-theme .flashcard-slide.active {
            width: 190px;
            height: 270px;
          }

          .flashcards-white-theme .flashcard-slide.inactive {
            width: 140px;
            height: 220px;
          }

          .flashcards-white-theme .flashcard-select-btn {
            width: 28px;
            height: 28px;
            top: -14px !important;
            right: -14px !important;
          }

          .flashcards-white-theme .flashcard-select-btn:hover,
          .flashcards-white-theme .flashcard-select-btn.selected,
          .flashcards-white-theme .flashcard-select-btn.selected:hover {
            top: -14px !important;
            right: -14px !important;
          }

          .flashcards-white-theme .flashcard-select-btn svg {
            width: 14px;
            height: 14px;
          }

          .flashcards-white-theme .nav-arrow {
            width: 32px;
            height: 32px;
          }
        }
      `}</style>
    </div>
  );
});

FlashcardsWidgetWhiteTheme.displayName = "FlashcardsWidgetWhiteTheme";

export default FlashcardsWidgetWhiteTheme;
