import React from "react";

interface SelectedTripSnippetProps {
  selectedTrip: {
    trip_title: string;
    no_of_days: number;
    estimated_budget: number;
  };
  onClear: () => void;
}

export function SelectedTripSnippet({
  selectedTrip,
  onClear,
}: SelectedTripSnippetProps) {
  return (
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-full max-w-md px-6 z-10 animate-slideUp">
      <div className="p-3 bg-white border-2 border-blue-400 rounded-xl shadow-2xl backdrop-blur-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-blue-900 text-xs truncate">
              Selected: {selectedTrip.trip_title}
            </h3>
            <p className="text-blue-700 text-[10px]">
              {selectedTrip.no_of_days} days • ${selectedTrip.estimated_budget}
            </p>
          </div>
          <button
            onClick={onClear}
            className="ml-2 w-6 h-6 flex items-center justify-center text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-all text-sm flex-shrink-0"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
