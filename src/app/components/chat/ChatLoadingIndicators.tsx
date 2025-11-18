import React from "react";
import { MdChat, MdExplore } from "react-icons/md";

interface ChatLoadingIndicatorsProps {
  isLoading: boolean;
  isParsingTrips: boolean;
}

export function ChatLoadingIndicators({
  isLoading,
  isParsingTrips,
}: ChatLoadingIndicatorsProps) {
  return (
    <>
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 flex items-center justify-center">
            <MdChat className="text-gray-600 text-sm" />
          </div>
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl px-4 py-3 min-w-[120px]">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gradient-to-r from-blue-600 to-blue-800 rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
              <span className="text-xs text-gray-500 ml-2">Thinking...</span>
            </div>
          </div>
        </div>
      )}

      {/* Trip Parsing indicator */}
      {isParsingTrips && (
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 border border-purple-300 flex items-center justify-center">
            <MdExplore className="text-purple-600 text-sm" />
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 shadow-sm rounded-2xl px-4 py-3 min-w-[200px]">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
              <span className="text-xs text-purple-700 font-medium">
                Preparing your trip suggestions...
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
