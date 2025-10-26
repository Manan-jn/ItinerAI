"use client";

import React, { forwardRef } from "react";

export interface ItinerAIChatBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  theme?: "default" | "white" | "purple";
  inputType?: "input" | "textarea";
  className?: string;
  containerClassName?: string;
  style?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
  allowEmptySubmit?: boolean;
}

const ItinerAIChatBox = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  ItinerAIChatBoxProps
>(
  (
    {
      value,
      onChange,
      onSubmit,
      onKeyDown,
      placeholder = "Ask ItinerAI",
      disabled = false,
      isLoading = false,
      theme = "default",
      inputType = "input",
      className = "",
      containerClassName = "",
      style = {},
      containerStyle = {},
      allowEmptySubmit = false,
    },
    ref
  ) => {
    const handleInputChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      onChange(e.target.value);
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(e);
    };

    const isSubmitDisabled = isLoading || (!value.trim() && !allowEmptySubmit);

    // Theme-specific class names
    const getThemeClasses = () => {
      switch (theme) {
        case "white":
          return {
            container: "itinerai-chatbox-container-white",
            input: "itinerai-chatbox-input-white",
            button: "itinerai-chatbox-submit-btn-white",
          };
        case "purple":
          return {
            container: "chatbox-container-date",
            input: "chatbox-input-date",
            button: "chatbox-submit-btn-date",
          };
        default:
          return {
            container: "itinerai-chatbox-container",
            input: "itinerai-chatbox-input",
            button: "itinerai-chatbox-submit-btn",
          };
      }
    };

    const themeClasses = getThemeClasses();

    return (
      <>
        <form onSubmit={handleSubmit} className="relative flex justify-center">
          <div
            className={`${themeClasses.container} ${containerClassName}`}
            style={containerStyle}
          >
            {inputType === "textarea" ? (
              <textarea
                ref={ref as React.Ref<HTMLTextAreaElement>}
                rows={1}
                value={value}
                onChange={handleInputChange}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                className={`${themeClasses.input} ${className}`}
                disabled={disabled}
                style={style}
              />
            ) : (
              <input
                ref={ref as React.Ref<HTMLInputElement>}
                type="text"
                value={value}
                onChange={handleInputChange}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                className={`${themeClasses.input} ${className}`}
                disabled={disabled}
                style={style}
              />
            )}
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className={themeClasses.button}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </form>

        {/* Default Theme Styles */}
        <style jsx>{`
          .itinerai-chatbox-container {
            width: 260px;
            height: 50px;
            display: flex;
            align-items: center;
            background: linear-gradient(
              135deg,
              rgba(59, 130, 246, 0.1) 0%,
              rgba(147, 197, 253, 0.05) 100%
            );
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 25px;
            padding: 8px;
            gap: 8px;
            box-shadow: 0 4px 16px rgba(59, 130, 246, 0.15),
              0 2px 8px rgba(0, 0, 0, 0.05),
              inset 0 1px 0 rgba(255, 255, 255, 0.5);
            z-index: 10;
            animation: slideUpFade 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
            border: 1.5px solid rgba(59, 130, 246, 0.2);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            margin: 0 auto;
          }

          .itinerai-chatbox-container:focus-within {
            width: 420px;
            box-shadow: 0 8px 24px rgba(59, 130, 246, 0.25),
              0 4px 12px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.6);
            background: linear-gradient(
              135deg,
              rgba(59, 130, 246, 0.15) 0%,
              rgba(147, 197, 253, 0.08) 100%
            );
            border-color: rgba(59, 130, 246, 0.35);
          }

          .itinerai-chatbox-input {
            flex: 1;
            background: transparent;
            border: none;
            outline: none;
            padding: 0 12px;
            font-size: 0.9rem;
            color: #1f2937;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
              sans-serif;
            font-weight: 500;
            height: 34px;
            resize: none;
          }

          .itinerai-chatbox-input::placeholder {
            color: #9ca3af;
            font-weight: 400;
          }

          .itinerai-chatbox-input:focus {
            color: #111827;
          }

          .itinerai-chatbox-submit-btn {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 50%;
            width: 34px;
            height: 34px;
            min-width: 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            flex-shrink: 0;
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
          }

          .itinerai-chatbox-submit-btn:hover:not(:disabled) {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            border-color: rgba(37, 99, 235, 0.5);
            transform: scale(1.08);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          }

          .itinerai-chatbox-submit-btn:active:not(:disabled) {
            transform: scale(0.95);
          }

          .itinerai-chatbox-submit-btn:disabled {
            background: linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%);
            border-color: rgba(156, 163, 175, 0.3);
            cursor: not-allowed;
            box-shadow: none;
          }

          .itinerai-chatbox-submit-btn svg {
            transition: transform 0.2s ease;
            filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
          }

          .itinerai-chatbox-submit-btn:hover:not(:disabled) svg {
            transform: translateX(2px);
          }

          /* White Theme Styles */
          .itinerai-chatbox-container-white {
            width: 260px;
            height: 50px;
            display: flex;
            align-items: center;
            background: rgba(255, 255, 255, 0.6);
            border: 1px solid rgba(59, 130, 246, 0.2);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border-radius: 25px;
            padding: 8px;
            gap: 8px;
            box-shadow: 0 4px 16px rgba(59, 130, 246, 0.15),
              0 2px 8px rgba(0, 0, 0, 0.05),
              inset 0 1px 0 rgba(255, 255, 255, 0.5);
            z-index: 10;
            animation: slideUpFade 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            margin: 0 auto;
          }

          .itinerai-chatbox-container-white:focus-within {
            width: 420px;
            box-shadow: 0 8px 24px rgba(59, 130, 246, 0.25),
              0 4px 12px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.6);
            background: rgba(255, 255, 255, 0.8);
            border-color: rgba(59, 130, 246, 0.35);
          }

          .itinerai-chatbox-input-white {
            flex: 1;
            background: transparent;
            border: none;
            outline: none;
            padding: 0 12px;
            font-size: 0.9rem;
            color: #1e40af;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
              sans-serif;
            font-weight: 500;
            height: 34px;
            text-shadow: none;
            resize: none;
          }

          .itinerai-chatbox-input-white::placeholder {
            color: rgba(59, 130, 246, 0.5);
            font-weight: 400;
            text-shadow: none;
          }

          .itinerai-chatbox-input-white:focus {
            color: #1d4ed8;
          }

          .itinerai-chatbox-submit-btn-white {
            background: rgba(59, 130, 246, 0.8);
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 50%;
            width: 34px;
            height: 34px;
            min-width: 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            flex-shrink: 0;
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
          }

          .itinerai-chatbox-submit-btn-white:hover:not(:disabled) {
            background: rgba(59, 130, 246, 0.9);
            border-color: rgba(59, 130, 246, 0.5);
            transform: scale(1.08);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          }

          .itinerai-chatbox-submit-btn-white:active:not(:disabled) {
            transform: scale(0.95);
          }

          .itinerai-chatbox-submit-btn-white:disabled {
            background: linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%);
            border-color: rgba(156, 163, 175, 0.3);
            cursor: not-allowed;
            box-shadow: none;
          }

          .itinerai-chatbox-submit-btn-white svg {
            transition: transform 0.2s ease;
            filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
          }

          .itinerai-chatbox-submit-btn-white:hover:not(:disabled) svg {
            transform: translateX(2px);
          }

          /* Purple Theme Styles */
          .chatbox-container-date {
            width: min(260px, 100%);
            height: 50px;
            display: flex;
            align-items: center;
            background: linear-gradient(
              135deg,
              rgba(147, 51, 234, 0.1) 0%,
              rgba(219, 39, 119, 0.05) 100%
            );
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 25px;
            padding: 8px;
            gap: 8px;
            box-shadow: 0 4px 16px rgba(147, 51, 234, 0.15),
              0 2px 8px rgba(0, 0, 0, 0.05),
              inset 0 1px 0 rgba(255, 255, 255, 0.5);
            z-index: 30;
            animation: slideUpFade 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
            border: 1.5px solid rgba(147, 51, 234, 0.2);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .chatbox-container-date:focus-within {
            width: min(420px, 100%);
            box-shadow: 0 8px 24px rgba(147, 51, 234, 0.25),
              0 4px 12px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.6);
            background: linear-gradient(
              135deg,
              rgba(147, 51, 234, 0.15) 0%,
              rgba(219, 39, 119, 0.08) 100%
            );
            border-color: rgba(147, 51, 234, 0.35);
          }

          .chatbox-input-date {
            flex: 1;
            background: transparent;
            border: none;
            outline: none;
            padding: 0 12px;
            font-size: 0.9rem;
            color: #6b21a8;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
              sans-serif;
            font-weight: 500;
            height: 34px;
            resize: none;
          }

          .chatbox-input-date::placeholder {
            color: rgba(147, 51, 234, 0.5);
            font-weight: 400;
          }

          .chatbox-input-date:focus {
            color: #581c87;
          }

          .chatbox-submit-btn-date {
            background: linear-gradient(135deg, #9333ea 0%, #db2777 100%);
            border: 1px solid rgba(147, 51, 234, 0.3);
            border-radius: 50%;
            width: 34px;
            height: 34px;
            min-width: 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            flex-shrink: 0;
            box-shadow: 0 2px 8px rgba(147, 51, 234, 0.3);
          }

          .chatbox-submit-btn-date:hover:not(:disabled) {
            background: linear-gradient(135deg, #7c3aed 0%, #be185d 100%);
            border-color: rgba(124, 58, 237, 0.5);
            transform: scale(1.08);
            box-shadow: 0 4px 12px rgba(147, 51, 234, 0.4);
          }

          .chatbox-submit-btn-date:active:not(:disabled) {
            transform: scale(0.95);
          }

          .chatbox-submit-btn-date:disabled {
            background: linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%);
            border-color: rgba(156, 163, 175, 0.3);
            cursor: not-allowed;
            box-shadow: none;
          }

          .chatbox-submit-btn-date svg {
            transition: transform 0.2s ease;
            filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
          }

          .chatbox-submit-btn-date:hover:not(:disabled) svg {
            transform: translateX(2px);
          }

          @keyframes slideUpFade {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </>
    );
  }
);

ItinerAIChatBox.displayName = "ItinerAIChatBox";

export default ItinerAIChatBox;
