import React from "react";

interface TestModeIndicatorProps {
  isVisible: boolean;
}

/**
 * Displays a floating indicator when test mode is active
 * Shows in the top-right corner of the chat container
 */
export function TestModeIndicator({ isVisible }: TestModeIndicatorProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute top-4 right-4 z-40 bg-orange-100 border border-orange-300 rounded-lg px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
        <span className="text-xs font-medium text-orange-700">
          🧪 Test Mode: End Response Active
        </span>
      </div>
    </div>
  );
}
