"use client";

interface ExtendTripPopupProps {
  isVisible: boolean;
  onYes: () => void;
  onNo: () => void;
}

export default function ExtendTripPopup({
  isVisible,
  onYes,
  onNo,
}: ExtendTripPopupProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-fadeIn">
        {/* Question */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Do you want to extend the trip duration by a day?
          </h3>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onYes}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
          >
            YES
          </button>
          <button
            onClick={onNo}
            className="px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
          >
            NO
          </button>
        </div>
      </div>
    </div>
  );
}
