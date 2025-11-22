import React from "react";

interface TransportOption {
  id: string;
  type: "flight" | "train";
  number: string;
  operator: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  from_city: string;
  to_city: string;
  day?: number;
  date?: string;
}

interface ConveyanceSnippetProps {
  conveyanceOptions: TransportOption[];
  dayNumber?: number;
  routeInfo?: string; // e.g., "New Delhi to Mumbai"
}

export function ConveyanceSnippet({
  conveyanceOptions,
  dayNumber,
  routeInfo,
}: ConveyanceSnippetProps) {
  // Show only first 4 options
  const displayOptions = conveyanceOptions.slice(
    0,
    Math.min(conveyanceOptions.length, 4)
  );

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-600">
        {dayNumber
          ? `AI recommended conveyance options for Day ${dayNumber}:`
          : "AI recommended conveyance options:"}
        {routeInfo && <span className="text-gray-500 ml-1">({routeInfo})</span>}
      </p>
      <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
        {displayOptions.map((option, index) => (
          <div
            key={option.id || index}
            className="bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition-all duration-200 hover:shadow-md"
          >
            <div className="flex gap-3 p-3">
              {/* Transport Icon */}
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center border border-blue-100">
                {option.type === "flight" ? (
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                )}
              </div>

              {/* Transport Details */}
              <div className="flex-1 min-w-0">
                {/* Operator and Number */}
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm text-gray-900 truncate">
                    {option.operator}
                  </h4>
                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-mono">
                    {option.number}
                  </span>
                </div>

                {/* Time and Route */}
                <div className="flex items-center gap-2 text-xs text-gray-700 mb-2">
                  <span className="font-medium">{option.departureTime}</span>
                  <div className="flex items-center gap-1 text-gray-400">
                    <div className="w-8 h-px bg-gray-300"></div>
                    <span className="text-[10px]">{option.duration}</span>
                    <div className="w-8 h-px bg-gray-300"></div>
                  </div>
                  <span className="font-medium">{option.arrivalTime}</span>
                </div>

                {/* Route Cities */}
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                  <span>{option.from_city}</span>
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                  <span>{option.to_city}</span>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        option.type === "flight"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-purple-50 text-purple-700 border border-purple-200"
                      }`}
                    >
                      {option.type === "flight" ? "Flight" : "Train"}
                    </span>
                  </div>
                  <span className="font-semibold text-sm text-green-600">
                    ₹{option.price.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {conveyanceOptions.length > 4 && (
        <p className="text-xs text-gray-500 italic">
          Showing {displayOptions.length} of {conveyanceOptions.length} options
        </p>
      )}
    </div>
  );
}
