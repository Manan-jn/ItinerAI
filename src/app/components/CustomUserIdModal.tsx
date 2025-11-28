"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface CustomUserIdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: string) => void;
  onClear?: () => void; // NEW: Callback for clearing and logging out
}

export function CustomUserIdModal({
  isOpen,
  onClose,
  onSave,
  onClear,
}: CustomUserIdModalProps) {
  const [customUserId, setCustomUserId] = useState("");
  const [currentCustomId, setCurrentCustomId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Ensure component only renders on client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      // Load existing custom user ID if set
      const existingId = localStorage.getItem("itinerai_custom_user_id");
      setCurrentCustomId(existingId);
      setCustomUserId(existingId || "");
    }
  }, [isOpen]);

  const handleSave = () => {
    if (customUserId.trim()) {
      // Clear session storage to force fresh start
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("itinerai_session_id");
        sessionStorage.removeItem("itinerai_user_id");
      }

      onSave(customUserId.trim());
      onClose();
    }
  };

  const handleClear = () => {
    // Clear local state
    setCustomUserId("");
    setCurrentCustomId(null);

    if (typeof window !== "undefined") {
      // Clear custom user ID from localStorage
      localStorage.removeItem("itinerai_custom_user_id");

      // Clear session storage
      sessionStorage.removeItem("itinerai_session_id");
      sessionStorage.removeItem("itinerai_user_id");

    }

    // Close modal
    onClose();

    // Call parent's onClear callback to trigger logout and redirect
    if (onClear) {
      onClear();
    } else {
      // Fallback: reload page if no callback provided
      console.warn("⚠️ No onClear callback provided, falling back to page reload");
      alert("Custom User ID cleared. Page will reload to apply changes.");
      window.location.reload();
    }
  };

  // Don't render on server-side or when not open
  if (!mounted || !isOpen) return null;

  // Render modal using portal to escape overflow-hidden constraints
  const modalContent = (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10030] flex items-center justify-center p-4"
      onClick={onClose}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Custom User ID
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/20 transition-colors"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentCustomId && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-600 font-medium mb-1">
                Current Custom User ID:
              </p>
              <p className="text-sm text-blue-900 font-mono break-all">
                {currentCustomId}
              </p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Custom User ID
            </label>
            <input
              type="text"
              value={customUserId}
              onChange={(e) => setCustomUserId(e.target.value)}
              placeholder="e.g., user-123, test-user, etc."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder-gray-400"
              autoFocus
            />
            <p className="mt-2 text-xs text-gray-500">
              This custom user ID will be used instead of the auto-generated ID
              for all API calls. Leave empty to use the default ID.
            </p>
          </div>

          {/* Warning */}
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex gap-2">
              <svg
                className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p className="text-xs font-medium text-yellow-800 mb-1">
                  Important Notice:
                </p>
                <p className="text-xs text-yellow-700">
                  Setting a custom user ID will reload the page and start a new
                  session with this ID. Any unsaved data will be lost.
                </p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={!customUserId.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              Set Custom ID
            </button>
            {currentCustomId && (
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors"
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at document body level, escaping any overflow-hidden parents
  return createPortal(modalContent, document.body);
}
