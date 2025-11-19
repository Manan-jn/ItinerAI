import React from "react";
import { MdChat } from "react-icons/md";

interface WelcomeScreenProps {
  isInitializingSession: boolean;
  onNudgeClick: (nudge: string) => void;
}

const DEFAULT_NUDGES = [
  "Plan a 7-day trip to Japan",
  "Best restaurants in Paris",
  "Budget backpacking through Europe",
  "Family vacation ideas for summer",
];

export function WelcomeScreen({
  isInitializingSession,
  onNudgeClick,
}: WelcomeScreenProps) {
  if (isInitializingSession) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl animate-spin opacity-20"></div>
            <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Initializing your session...
          </h2>
          <p className="text-gray-500 text-sm">
            Please wait while we set things up
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
      <div className="text-center mb-6">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl rotate-6 animate-pulse opacity-20"></div>
          <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <MdChat className="text-white text-3xl" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.01em'
        }}>
          How can I help you today?
        </h2>
        <p className="text-gray-500 text-sm font-medium">
          Ask me anything about your travel plans or use the toggles above
        </p>
      </div>

      {/* Nudges */}
      <div className="w-full max-w-2xl px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DEFAULT_NUDGES.map((nudge, index) => (
            <button
              key={index}
              onClick={() => onNudgeClick(nudge)}
              className="px-4 py-3 text-sm text-left text-gray-700 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 hover:shadow-md transition-all group"
            >
              <span className="text-blue-600 group-hover:text-blue-700 mr-2">
                →
              </span>
              {nudge}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
