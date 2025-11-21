import React from "react";

interface FlashcardsStylesProps {
  rightPanelCollapsed?: boolean;
}

export function FlashcardsStyles({}: FlashcardsStylesProps) {
  return (
    <style jsx global>{`
      @keyframes fc-fade-up {
        from {
          opacity: 0;
          transform: translateY(6px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .flashcards-widget.appear {
        animation: fc-fade-up 500ms cubic-bezier(0.22, 1, 0.36, 1) both;
      }

      .flashcards-widget {
        background: transparent;
        backdrop-filter: none;
        border-radius: 0;
        padding: 16px 0;
        margin: 0;
        width: 100%;
        max-width: 100%;
        height: 100%;
        max-height: 100%;
        border: none;
        box-shadow: none;
        transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        position: relative;
        overflow: visible;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        touch-action: none;
        overscroll-behavior: none;
        overscroll-behavior-x: none;
        overscroll-behavior-y: none;
        -webkit-overscroll-behavior: none;
        -webkit-overscroll-behavior-x: none;
        -webkit-overscroll-behavior-y: none;
      }

      /* Modal Styles */
      .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.94);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        z-index: 10000;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: 80px 32px 100px 32px;
        animation: fadeIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        overflow-y: auto;
        overflow-x: hidden;
      }

      .modal-container {
        position: relative;
        width: 100%;
        max-width: 750px;
        max-height: calc(100vh - 180px);
        height: fit-content;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8),
          0 0 0 1px rgba(255, 255, 255, 0.1);
        animation: slideInUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        border: 1px solid rgba(255, 255, 255, 0.12);
        display: flex;
        flex-direction: column;
        margin: 0;
      }

      .modal-background {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        filter: blur(3px) brightness(0.9);
        transform: scale(1.1);
        transition: filter 0.3s ease;
      }

      .modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
          135deg,
          rgba(0, 0, 0, 0.75) 0%,
          rgba(0, 0, 0, 0.5) 50%,
          rgba(0, 0, 0, 0.85) 100%
        );
      }

      .modal-close-btn {
        position: fixed;
        top: 88px;
        right: 40px;
        background: rgba(255, 255, 255, 0.15);
        border: 1.5px solid rgba(255, 255, 255, 0.25);
        border-radius: 50%;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        z-index: 10003;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4),
          inset 0 1px 1px rgba(255, 255, 255, 0.2);
      }

      .modal-close-btn:hover {
        background: rgba(255, 255, 255, 0.22);
        border-color: rgba(255, 255, 255, 0.4);
        transform: scale(1.08) rotate(90deg);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5),
          inset 0 1px 2px rgba(255, 255, 255, 0.3);
      }

      .modal-close-btn:active {
        transform: scale(0.95) rotate(90deg);
      }

      .modal-close-btn svg {
        width: 18px;
        height: 18px;
        stroke-width: 2.5;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
      }

      .modal-content {
        position: relative;
        z-index: 10;
        height: 100%;
        max-height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 24px 20px;
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.35) rgba(255, 255, 255, 0.1);
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
      }

      .modal-content::-webkit-scrollbar {
        width: 6px;
      }

      .modal-content::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.08);
        border-radius: 3px;
        margin: 4px 0;
      }

      .modal-content::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.25);
        border-radius: 3px;
        transition: background 0.3s ease;
      }

      .modal-content::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.35);
      }

      .modal-header {
        text-align: center;
        margin-bottom: 20px;
        animation: fadeIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
      }

      .modal-title {
        color: white;
        font-size: 1.6rem;
        font-weight: 600;
        margin: 0 0 16px 0;
        text-shadow: 0 3px 12px rgba(0, 0, 0, 0.8);
        line-height: 1.3;
        letter-spacing: -0.02em;
      }

      .modal-meta {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin-bottom: 16px;
      }

      .meta-card {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 10px;
        padding: 12px 14px;
        display: flex;
        align-items: center;
        gap: 10px;
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .meta-card:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.25);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      .meta-icon {
        font-size: 1.4rem;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
        flex-shrink: 0;
      }

      .meta-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .meta-label {
        color: rgba(255, 255, 255, 0.65);
        font-size: 0.7rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.4px;
      }

      .meta-value {
        color: white;
        font-size: 0.9rem;
        font-weight: 600;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
      }

      .modal-themes {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 8px;
      }

      .modal-theme-tag {
        background: rgba(255, 255, 255, 0.12);
        color: white;
        padding: 6px 14px;
        border-radius: 8px;
        font-size: 0.75rem;
        font-weight: 500;
        border: 1px solid rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .modal-theme-tag:hover {
        background: rgba(255, 255, 255, 0.18);
        border-color: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
      }

      .modal-body {
        animation: fadeIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
      }

      .itinerary-title {
        color: white;
        font-size: 1.2rem;
        font-weight: 600;
        margin: 0 0 16px 0;
        text-align: center;
        text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
        letter-spacing: -0.02em;
      }

      .days-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .modal-day-card {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 12px;
        overflow: hidden;
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .modal-day-card:hover {
        background: rgba(255, 255, 255, 0.11);
        border-color: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      }

      .day-badge {
        background: rgba(255, 255, 255, 0.12);
        padding: 7px;
        text-align: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .day-number {
        color: white;
        font-size: 0.8rem;
        font-weight: 600;
        letter-spacing: 0.02em;
      }

      .day-content {
        padding: 12px;
      }

      .section-title {
        color: white;
        font-size: 0.85rem;
        font-weight: 600;
        margin: 0 0 8px 0;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .day-cities-section {
        display: flex;
        flex-direction: column;
        gap: 0;
      }

      .city-divider {
        padding: 10px 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .divider-text {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.7rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        background: rgba(255, 255, 255, 0.05);
        padding: 5px 14px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
      }

      .enhanced-city-card {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        overflow: hidden;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        transition: all 0.2s ease;
        margin-bottom: 0;
      }

      .enhanced-city-card:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.15);
      }

      .city-image-container {
        position: relative;
        width: 100%;
        height: 140px;
        overflow: hidden;
        cursor: pointer;
      }

      .city-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        transition: transform 0.25s ease;
      }

      .city-image-container:hover .city-image {
        transform: scale(1.04);
      }

      .enhanced-city-card:hover .city-image {
        transform: scale(1.01);
      }

      .city-image-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
          180deg,
          rgba(0, 0, 0, 0) 0%,
          rgba(0, 0, 0, 0.3) 100%
        );
        transition: background 0.3s ease;
      }

      .city-image-container:hover .city-image-overlay {
        background: linear-gradient(
          180deg,
          rgba(0, 0, 0, 0) 0%,
          rgba(0, 0, 0, 0.2) 100%
        );
      }

      .city-image-container:hover .city-image-overlay::after {
        content: "🔍";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 2rem;
        opacity: 0.8;
        filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.8));
        animation: pulseZoom 0.5s ease-in-out;
      }

      @keyframes pulseZoom {
        0% {
          transform: translate(-50%, -50%) scale(0.5);
          opacity: 0;
        }
        50% {
          transform: translate(-50%, -50%) scale(1.1);
          opacity: 0.9;
        }
        100% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 0.8;
        }
      }

      .photo-count-badge {
        position: absolute;
        bottom: 7px;
        right: 7px;
        background: rgba(0, 0, 0, 0.75);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        padding: 4px 9px;
        color: white;
        font-size: 0.65rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 3px;
        z-index: 10;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        transition: all 0.2s ease;
        pointer-events: none;
      }

      .city-image-container:hover .photo-count-badge {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.3);
        transform: scale(1.03);
      }

      /* Photo Gallery Modal Styles */
      .photo-gallery-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.95);
        backdrop-filter: blur(30px);
        -webkit-backdrop-filter: blur(30px);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        animation: fadeIn 0.3s ease;
      }

      .photo-gallery-container {
        position: relative;
        width: 100%;
        max-width: 1200px;
        height: 100%;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .gallery-close-btn {
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        cursor: pointer;
        transition: all 0.3s ease;
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        z-index: 10;
      }

      .gallery-close-btn:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.4);
        transform: scale(1.1);
      }

      .gallery-nav-btn {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(0, 0, 0, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        cursor: pointer;
        transition: all 0.3s ease;
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        z-index: 10;
      }

      .gallery-nav-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      .gallery-nav-btn:not(:disabled):hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.4);
        transform: translateY(-50%) scale(1.1);
      }

      .gallery-prev {
        left: 20px;
      }

      .gallery-next {
        right: 20px;
      }

      .photo-gallery-content {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 60px;
      }

      .gallery-image {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
      }

      .photo-counter {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 20px;
        padding: 6px 16px;
        color: white;
        font-size: 0.85rem;
        font-weight: 600;
      }

      .photo-thumbnails {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 8px;
        padding: 12px;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        max-width: 90%;
        overflow-x: auto;
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.1);
      }

      .photo-thumbnails::-webkit-scrollbar {
        height: 4px;
      }

      .photo-thumbnails::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
      }

      .photo-thumbnails::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 2px;
      }

      .thumbnail {
        width: 60px;
        height: 60px;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        border: 2px solid transparent;
        transition: all 0.3s ease;
        flex-shrink: 0;
      }

      .thumbnail:hover {
        border-color: rgba(255, 255, 255, 0.3);
      }

      .thumbnail.active {
        border-color: rgba(255, 245, 157, 0.8);
        box-shadow: 0 0 12px rgba(255, 245, 157, 0.4);
      }

      .thumbnail img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      /* Chatbox Styles */
      .chatbox-container {
        position: fixed;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        width: 225px;
        height: 48px;
        display: flex;
        align-items: center;
        background: rgba(50, 50, 52, 0.95);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border-radius: 24px;
        padding: 8px;
        gap: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
        z-index: 10002;
        animation: slideUpFade 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.3s
          both;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
          box-shadow 0.3s ease;
        pointer-events: auto;
      }

      .chatbox-container:focus-within {
        width: 355px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
      }

      .chatbox-input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        padding: 0 8px;
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.9);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
          sans-serif;
        font-weight: 400;
        height: 32px;
      }

      .chatbox-input::placeholder {
        color: rgba(255, 255, 255, 0.5);
        font-weight: 400;
      }

      .chatbox-input:focus {
        color: rgba(255, 255, 255, 1);
      }

      .chatbox-submit-btn {
        background: rgba(70, 70, 73, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        width: 32px;
        height: 32px;
        min-width: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.8);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        flex-shrink: 0;
      }

      .chatbox-submit-btn:hover {
        background: rgba(90, 90, 93, 0.9);
        border-color: rgba(255, 255, 255, 0.2);
        color: rgba(255, 255, 255, 1);
        transform: scale(1.05);
      }

      .chatbox-submit-btn:active {
        transform: scale(0.95);
      }

      .chatbox-submit-btn svg {
        transition: transform 0.2s ease;
        width: 16px;
        height: 16px;
      }

      .chatbox-submit-btn:hover svg {
        transform: translateX(1px);
      }

      @keyframes slideUpFade {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }

      .city-info-header {
        padding: 14px 16px 12px 16px;
        background: rgba(0, 0, 0, 0.1);
      }

      .city-header-top {
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .city-title {
        color: white;
        font-size: 1rem;
        font-weight: 600;
        margin: 0;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
        letter-spacing: -0.01em;
        flex: 1;
      }

      .city-actions {
        display: flex;
        gap: 6px;
        align-items: center;
      }

      .city-action-btn {
        background: rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }

      .city-action-btn:hover {
        transform: scale(1.08);
      }

      .city-action-btn.add-btn:hover {
        background: rgba(76, 175, 80, 0.25);
        border-color: rgba(76, 175, 80, 0.4);
        box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
      }

      .city-action-btn.remove-btn:hover {
        background: rgba(244, 67, 54, 0.25);
        border-color: rgba(244, 67, 54, 0.4);
        box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
      }

      .city-action-btn:active {
        transform: scale(0.95);
      }

      .city-location {
        color: rgba(255, 255, 255, 0.65);
        font-size: 0.7rem;
        margin: 0 0 7px 0;
        line-height: 1.3;
      }

      .city-tags {
        display: flex;
        gap: 5px;
        flex-wrap: wrap;
      }

      .city-tag-item {
        padding: 3px 8px;
        border-radius: 6px;
        font-size: 0.65rem;
        font-weight: 500;
        border: 1px solid rgba(255, 255, 255, 0.15);
        transition: all 0.2s ease;
      }

      .city-tag-item.statues {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.8);
        border-color: rgba(255, 255, 255, 0.15);
      }

      .city-tag-item.fountain {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.8);
        border-color: rgba(255, 255, 255, 0.15);
      }

      .city-activities-list {
        padding: 0;
      }

      .enhanced-activity-item {
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        background: rgba(0, 0, 0, 0.05);
        position: relative;
      }

      .enhanced-activity-item:hover {
        background: rgba(255, 255, 255, 0.05);
      }

      .activity-main-content {
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
      }

      .activity-left {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        flex: 1;
      }

      .activity-actions {
        display: flex;
        gap: 6px;
        align-items: center;
        flex-shrink: 0;
      }

      .activity-action-btn {
        background: rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }

      .activity-action-btn:hover {
        transform: scale(1.08);
      }

      .activity-action-btn.add-btn:hover {
        background: rgba(76, 175, 80, 0.25);
        border-color: rgba(76, 175, 80, 0.4);
        box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
      }

      .activity-action-btn.remove-btn:hover {
        background: rgba(244, 67, 54, 0.25);
        border-color: rgba(244, 67, 54, 0.4);
        box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
      }

      .activity-action-btn:active {
        transform: scale(0.95);
      }

      .activity-number-badge {
        background: rgba(255, 255, 255, 0.15);
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        font-weight: 600;
        flex-shrink: 0;
        border: 1px solid rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
      }

      .activity-type-icon {
        font-size: 1.1rem;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4));
        flex-shrink: 0;
      }

      .activity-details {
        flex: 1;
      }

      .activity-title {
        color: white;
        font-size: 0.85rem;
        font-weight: 600;
        margin: 0 0 4px 0;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
        line-height: 1.3;
      }

      .activity-subtitle {
        color: rgba(255, 255, 255, 0.65);
        font-size: 0.75rem;
        line-height: 1.5;
        margin: 0;
      }

      .activity-right {
        flex-shrink: 0;
        margin-left: 10px;
      }

      .activity-badge {
        display: inline-block;
        background: rgba(255, 245, 157, 0.2);
        color: #fff59d;
        padding: 3px 8px;
        border-radius: 10px;
        font-size: 0.65rem;
        font-weight: 600;
        border: 1px solid rgba(255, 245, 157, 0.3);
      }

      .additional-spot {
        padding: 10px 14px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(0, 0, 0, 0.1);
      }

      .spot-badge {
        margin-bottom: 8px;
      }

      .spot-time {
        display: inline-block;
        background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
        color: white;
        padding: 4px 10px;
        border-radius: 14px;
        font-size: 0.7rem;
        font-weight: 700;
        box-shadow: 0 2px 6px rgba(255, 107, 107, 0.3);
      }

      .spot-info {
        display: flex;
        align-items: center;
      }

      .spot-left {
        display: flex;
        gap: 10px;
        align-items: flex-start;
      }

      .spot-icon {
        font-size: 1rem;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
      }

      .spot-details {
        flex: 1;
      }

      .spot-title {
        color: white;
        font-size: 0.85rem;
        font-weight: 600;
        margin: 0 0 2px 0;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
      }

      .spot-subtitle {
        color: rgba(255, 255, 255, 0.65);
        font-size: 0.72rem;
        margin: 0;
      }

      .flashcards-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding: 0 80px;
      }

      .header-content h3 {
        color: white;
        font-size: 1.4rem;
        margin: 0;
        font-weight: 600;
        letter-spacing: -0.02em;
      }

      .toggle-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        padding: 6px;
        border-radius: 8px;
        transition: all 0.2s ease;
        backdrop-filter: blur(8px);
      }

      .toggle-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border-color: rgba(255, 255, 255, 0.2);
        transform: scale(1.02);
      }

      .flashcards-container {
        flex: 1;
        min-height: 0;
        max-height: 100%;
        border-radius: 0;
        overflow: hidden;
        position: relative;
        margin: 0;
        padding: 0;
        contain: layout style;
        display: flex;
        align-items: center;
        transition: opacity 0.3s ease-out, transform 0.3s ease-out;
      }

      .flashcards-container.refreshing {
        opacity: 0.6;
        transform: scale(0.98);
      }

      @keyframes flashcards-refresh {
        0% {
          opacity: 0.6;
          transform: scale(0.98);
        }
        100% {
          opacity: 1;
          transform: scale(1);
        }
      }

      .flashcards-scroll-wrapper {
        display: flex;
        gap: 24px;
        width: 100%;
        height: 100%;
        overflow-x: hidden;
        overflow-y: hidden;
        scroll-behavior: smooth;
        scrollbar-width: none;
        scrollbar-color: transparent transparent;
        padding: 40px calc(50% - 200px);
        -webkit-overflow-scrolling: touch;
        scrollbar-gutter: stable;
        will-change: scroll-position, transform;
        align-items: center;
        scroll-snap-type: none;
        position: relative;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        overscroll-behavior: none;
        overscroll-behavior-x: none;
        overscroll-behavior-y: none;
        -webkit-overscroll-behavior: none;
        -webkit-overscroll-behavior-x: none;
        -webkit-overscroll-behavior-y: none;
      }

      .flashcards-scroll-wrapper::-webkit-scrollbar {
        display: none;
        width: 0;
        height: 0;
      }

      .flashcards-scroll-wrapper::-webkit-scrollbar-track {
        display: none;
      }

      .flashcards-scroll-wrapper::-webkit-scrollbar-thumb {
        display: none;
      }

      .flashcards-scroll-wrapper::-webkit-scrollbar-corner {
        display: none;
      }

      .flashcard-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        flex-shrink: 0;
      }

      .flashcard-slide {
        position: relative;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        background-attachment: local;
        background-color: #0a0a0a;
        transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        overflow: visible;
        border-radius: 16px;
        flex-shrink: 0;
        isolation: isolate;
        contain: layout style;
        transform-origin: center;
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
        border: 1px solid rgba(255, 255, 255, 0.08);
        scroll-snap-align: center;
        will-change: transform, opacity, filter;
      }

      .flashcard-slide::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: inherit;
        background-size: inherit;
        background-position: inherit;
        background-repeat: inherit;
        border-radius: 16px;
        overflow: hidden;
        z-index: -1;
      }

      .flashcard-slide.selected {
        border: 3px solid rgba(76, 175, 80, 0.8);
        box-shadow: 0 0 20px rgba(76, 175, 80, 0.4);
      }

      .flashcard-select-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.4);
        border: 1.5px solid rgba(255, 255, 255, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        backdrop-filter: blur(8px);
        flex-shrink: 0;
        position: absolute;
        top: -16px;
        right: -16px;
        z-index: 10;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }

      .flashcard-select-btn:hover {
        background: rgba(0, 0, 0, 0.6);
        border-color: rgba(255, 255, 255, 0.25);
        transform: scale(1.05);
        box-shadow: 0 3px 12px rgba(0, 0, 0, 0.2);
      }

      .flashcard-select-btn:active {
        transform: scale(0.98);
      }

      .flashcard-select-btn svg {
        width: 14px;
        height: 14px;
        opacity: 0.4;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        stroke-width: 2.5;
      }

      .flashcard-select-btn.selected {
        background: rgba(34, 197, 94, 0.95);
        border-color: rgba(34, 197, 94, 1);
        box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
      }

      .flashcard-select-btn.selected svg {
        opacity: 1;
        stroke: white;
        stroke-width: 3;
      }

      .flashcard-select-btn.selected:hover {
        background: rgba(34, 197, 94, 1);
        transform: scale(1.05);
        box-shadow: 0 3px 12px rgba(34, 197, 94, 0.4);
      }

      .flashcard-slide.inactive {
        width: 280px;
        height: 420px;
        filter: blur(0.5px) brightness(0.85);
        transform: scale(0.88);
        opacity: 0.7;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
        cursor: default;
        pointer-events: none;
        transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .flashcard-slide.inactive:hover {
        filter: blur(0.5px) brightness(0.85);
        opacity: 0.7;
        transform: scale(0.88);
      }

      .flashcard-slide.inactive .slide-content {
        padding: 8px 6px;
      }

      .flashcard-slide.inactive .slide-title-top {
        opacity: 1;
        transform: translateY(45px);
      }

      .flashcard-slide.inactive .slide-title-top .trip-name {
        font-size: 0.75rem;
        line-height: 1.1;
      }

      .flashcard-slide.inactive .slide-info-bottom {
        opacity: 1;
        transform: translateY(0);
      }

      .flashcard-slide.inactive .info-card {
        padding: 4px 3px;
        border-radius: 6px;
        gap: 3px;
      }

      .flashcard-slide.inactive .info-icon {
        width: 16px;
        height: 16px;
      }

      .flashcard-slide.inactive .info-icon svg {
        width: 8px;
        height: 8px;
      }

      .flashcard-slide.inactive .info-label {
        font-size: 0.45rem;
      }

      .flashcard-slide.inactive .info-value {
        font-size: 0.55rem;
      }

      .flashcard-slide.active {
        width: 400px;
        height: 520px;
        filter: none;
        transform: scale(1);
        opacity: 1;
        z-index: 10;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6),
          0 0 0 1px rgba(255, 255, 255, 0.15);
        cursor: pointer;
        pointer-events: auto;
        transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .flashcard-slide.active:hover {
        transform: scale(1.02);
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.7),
          0 0 0 1px rgba(255, 255, 255, 0.2);
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
          box-shadow 0.3s ease;
      }

      .flashcard-slide.active .slide-title-top {
        transform: translateY(0);
        transition: all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .flashcard-slide.active .slide-title-top .trip-name {
        font-size: 1.1rem;
        transition: all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .flashcard-slide.active .slide-info-bottom {
        opacity: 1;
        transform: translateY(0);
        transition: all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s;
      }

      .slide-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
          180deg,
          rgba(0, 0, 0, 0.2) 0%,
          rgba(0, 0, 0, 0.05) 30%,
          rgba(0, 0, 0, 0.05) 70%,
          rgba(0, 0, 0, 0.8) 100%
        );
        transition: background 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        border-radius: 16px;
        overflow: hidden;
      }

      .flashcard-slide:hover .slide-overlay {
        background: linear-gradient(
          180deg,
          rgba(0, 0, 0, 0.1) 0%,
          rgba(0, 0, 0, 0.02) 30%,
          rgba(0, 0, 0, 0.02) 70%,
          rgba(0, 0, 0, 0.7) 100%
        );
      }

      .slide-content {
        position: relative;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 14px 12px 12px 12px;
        z-index: 2;
        gap: 8px;
      }

      .slide-title-top {
        text-align: left;
        padding-top: 4px;
        opacity: 1;
        transform: translateY(0);
        transition: all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
        flex-shrink: 0;
      }

      .slide-title-top .trip-name {
        color: white;
        font-size: 1.1rem;
        font-weight: 600;
        text-shadow: 0 2px 12px rgba(0, 0, 0, 0.9);
        letter-spacing: -0.02em;
        line-height: 1.2;
        margin: 0;
        word-wrap: break-word;
        overflow-wrap: break-word;
        max-height: 2.8em;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .slide-info-bottom {
        display: flex;
        flex-direction: column;
        gap: 5px;
        opacity: 1;
        transform: translateY(0);
        transition: all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s;
        flex-shrink: 0;
      }

      .info-row {
        display: flex;
        gap: 5px;
      }

      .info-card {
        flex: 1;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 7px;
        padding: 7px 5px;
        display: flex;
        gap: 5px;
        align-items: flex-start;
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .info-card.full-width {
        flex: 1 1 100%;
      }

      .info-card:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.25);
        transform: translateY(-1px);
      }

      .info-icon {
        flex-shrink: 0;
        width: 22px;
        height: 22px;
        background: rgba(255, 255, 255, 0.15);
        border-radius: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      }

      .info-icon svg {
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
        width: 11px;
        height: 11px;
      }

      .info-text {
        display: flex;
        flex-direction: column;
        gap: 1px;
        flex: 1;
      }

      .info-label {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.65rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
      }

      .info-value {
        color: white;
        font-size: 0.8rem;
        font-weight: 600;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
        line-height: 1.2;
      }

      /* Animations */
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes slideInUp {
        from {
          opacity: 0;
          transform: translateY(50px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes slideUpFadeIn {
        0% {
          opacity: 0;
          transform: translateY(40px);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes fadeInUp {
        0% {
          opacity: 0;
          transform: translateY(20px);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Navigation Arrows */
      .nav-arrow {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(255, 255, 255, 0.18);
        color: white;
        border: 1.5px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        width: 56px;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 100;
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4),
          inset 0 1px 1px rgba(255, 255, 255, 0.2);
      }

      .nav-arrow:hover {
        background: rgba(255, 255, 255, 0.28);
        border-color: rgba(255, 255, 255, 0.45);
        transform: translateY(-50%) scale(1.08);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5),
          inset 0 1px 2px rgba(255, 255, 255, 0.3);
      }

      .nav-arrow:active {
        transform: translateY(-50%) scale(0.95);
      }

      .nav-arrow svg {
        filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6));
        opacity: 0.95;
        width: 24px;
        height: 24px;
      }

      .nav-left {
        left: 40px;
      }

      .nav-right {
        right: 40px;
      }

      /* Suggestion Panel Styles */
      .suggestion-panel {
        position: fixed;
        top: 150px;
        right: 32px;
        width: 340px;
        max-height: calc(100vh - 230px);
        background: rgba(18, 18, 20, 0.95);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
        z-index: 10001;
        display: flex;
        flex-direction: column;
        animation: slideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        overflow: hidden;
      }

      @keyframes slideInRight {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .suggestion-header {
        padding: 16px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .suggestion-header h3 {
        color: white;
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0;
      }

      .panel-close-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 6px;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .panel-close-btn:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: scale(1.05);
      }

      .suggestion-search {
        padding: 16px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        position: relative;
      }

      .search-icon {
        position: absolute;
        left: 32px;
        top: 50%;
        transform: translateY(-50%);
        color: rgba(255, 255, 255, 0.4);
      }

      .suggestion-search-input {
        width: 100%;
        padding: 10px 12px 10px 36px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 8px;
        color: white;
        font-size: 0.9rem;
        outline: none;
        transition: all 0.3s ease;
      }

      .suggestion-search-input::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }

      .suggestion-search-input:focus {
        background: rgba(255, 255, 255, 0.12);
        border-color: rgba(255, 255, 255, 0.2);
      }

      .suggestion-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px 20px;
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
      }

      .suggestion-content::-webkit-scrollbar {
        width: 6px;
      }

      .suggestion-content::-webkit-scrollbar-track {
        background: transparent;
      }

      .suggestion-content::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
      }

      .suggestion-section {
        margin-bottom: 24px;
      }

      .suggestion-section:last-child {
        margin-bottom: 0;
      }

      .suggestion-section-title {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 0 0 12px 0;
      }

      .suggestion-cards {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .suggestion-card {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 12px;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        cursor: pointer;
      }

      .suggestion-card:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.15);
        transform: translateX(4px);
      }

      .suggestion-card-icon {
        font-size: 1.3rem;
        flex-shrink: 0;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4));
      }

      .suggestion-card-content {
        flex: 1;
      }

      .suggestion-card-title {
        color: white;
        font-size: 0.85rem;
        font-weight: 600;
        margin: 0 0 2px 0;
      }

      .suggestion-card-desc {
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.7rem;
        margin: 0;
      }

      .suggestion-add-btn {
        background: rgba(76, 175, 80, 0.15);
        border: 1px solid rgba(76, 175, 80, 0.3);
        border-radius: 6px;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgb(129, 199, 132);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        flex-shrink: 0;
      }

      .suggestion-add-btn:hover {
        background: rgba(76, 175, 80, 0.25);
        border-color: rgba(76, 175, 80, 0.5);
        transform: scale(1.1);
      }

      .suggestion-add-btn:active {
        transform: scale(0.95);
      }

      /* Responsive Design - Mobile */
      @media (max-width: 768px) {
        .flashcards-widget {
          padding: 12px 0;
        }

        .flashcards-container {
          min-height: 0;
        }

        .flashcards-header {
          padding: 0 24px;
          margin-bottom: 12px;
        }

        .flashcards-scroll-wrapper {
          padding: 30px calc(50% - 140px);
          gap: 20px;
        }

        .header-content h3 {
          font-size: 1.2rem;
        }

        .flashcard-slide.inactive {
          width: 220px;
          height: 340px;
        }

        .flashcard-slide.active {
          width: 320px;
          height: 440px;
        }

        .nav-arrow {
          width: 48px;
          height: 48px;
        }

        .nav-arrow svg {
          width: 20px;
          height: 20px;
        }

        .nav-left {
          left: 24px;
        }

        .nav-right {
          right: 24px;
        }

        .modal-backdrop {
          padding: 75px 16px 90px 16px;
        }

        .modal-container {
          max-width: 95vw;
          max-height: calc(100vh - 165px);
        }

        .suggestion-panel {
          right: 16px;
          left: 16px;
          width: auto;
          max-height: calc(100vh - 230px);
        }
      }

      @media (max-width: 480px) {
        .flashcards-widget {
          padding: 8px 0;
        }

        .flashcards-header {
          padding: 0 16px;
        }

        .flashcards-scroll-wrapper {
          padding: 20px calc(50% - 100px);
          gap: 16px;
        }

        .flashcard-slide.inactive {
          width: 160px;
          height: 260px;
        }

        .flashcard-slide.active {
          width: 240px;
          height: 340px;
        }

        .nav-arrow {
          width: 40px;
          height: 40px;
        }

        .nav-arrow svg {
          width: 18px;
          height: 18px;
        }

        .nav-left {
          left: 12px;
        }

        .nav-right {
          right: 12px;
        }
      }
    `}</style>
  );
}
