"use client";

interface ConveyanceRequirementPopupProps {
  isVisible: boolean;
  dayNumber: number;
  onYes: () => void;
  onNo: () => void;
}

export default function ConveyanceRequirementPopup({
  isVisible,
  dayNumber,
  onYes,
  onNo,
}: ConveyanceRequirementPopupProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 animate-fadeIn">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full mb-4">
            <span className="text-3xl">🚗</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Day {dayNumber} Planning
          </h2>
          <p className="text-base font-semibold text-gray-700">
            Do you need conveyance for this day?
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={onYes}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 text-lg"
          >
            YES
          </button>
          <button
            onClick={onNo}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 text-lg"
          >
            NO
          </button>
        </div>
      </div>
    </div>
  );
}
