import React, { useMemo } from "react";

interface DateSelectorSnippetProps {
  selectedDate: string; // YYYY-MM-DD format
  tripTitle?: string;
  tripDuration?: number;
}

export function DateSelectorSnippet({
  selectedDate,
  tripTitle,
  tripDuration = 6,
}: DateSelectorSnippetProps) {
  // Parse the selected date
  const parsedDate = useMemo(() => {
    const date = new Date(selectedDate + "T00:00:00");
    return {
      date,
      day: date.getDate(),
      month: date.getMonth(),
      year: date.getFullYear(),
      dayOfWeek: date.toLocaleDateString("en-US", { weekday: "short" }),
      monthName: date.toLocaleDateString("en-US", { month: "short" }),
      fullMonthName: date.toLocaleDateString("en-US", { month: "long" }),
    };
  }, [selectedDate]);

  // Calculate end date based on trip duration
  const endDate = useMemo(() => {
    const date = new Date(selectedDate + "T00:00:00");
    date.setDate(date.getDate() + tripDuration - 1);
    return {
      date,
      day: date.getDate(),
      month: date.getMonth(),
      monthName: date.toLocaleDateString("en-US", { month: "short" }),
    };
  }, [selectedDate, tripDuration]);

  // Generate mini calendar for the month
  const calendarDays = useMemo(() => {
    const year = parsedDate.year;
    const month = parsedDate.month;
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startOffset = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days: Array<{
      day: number | null;
      isSelected: boolean;
      isInRange: boolean;
      isRangeStart: boolean;
      isRangeEnd: boolean;
    }> = [];

    // Add empty cells for offset
    for (let i = 0; i < startOffset; i++) {
      days.push({
        day: null,
        isSelected: false,
        isInRange: false,
        isRangeStart: false,
        isRangeEnd: false,
      });
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const startDateObj = new Date(selectedDate + "T00:00:00");
      const endDateObj = new Date(startDateObj);
      endDateObj.setDate(startDateObj.getDate() + tripDuration - 1);

      const isRangeStart = day === parsedDate.day;
      const isRangeEnd = endDate.month === month && day === endDate.day;
      const isInRange =
        currentDate >= startDateObj && currentDate <= endDateObj;

      days.push({
        day,
        isSelected: day === parsedDate.day,
        isInRange,
        isRangeStart,
        isRangeEnd,
      });
    }

    return days;
  }, [parsedDate, selectedDate, tripDuration, endDate]);

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-gray-600">
        Your selected travel dates:
      </p>

      <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header with Month/Year */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-3 py-2 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-800">
              {parsedDate.fullMonthName} {parsedDate.year}
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {tripDuration} days trip
              </span>
            </div>
          </div>
        </div>

        {/* Mini Calendar */}
        <div className="p-3">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
              <div
                key={idx}
                className="text-center text-[9px] font-semibold text-gray-400"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((dayInfo, idx) => (
              <div
                key={idx}
                className={`
                  aspect-square flex items-center justify-center text-[10px] rounded-md transition-all
                  ${
                    dayInfo.day === null
                      ? "bg-transparent"
                      : dayInfo.isRangeStart
                      ? "bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold shadow-sm"
                      : dayInfo.isRangeEnd
                      ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold shadow-sm"
                      : dayInfo.isInRange
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "text-gray-600"
                  }
                `}
              >
                {dayInfo.day}
              </div>
            ))}
          </div>
        </div>

        {/* Trip Info Footer */}
        <div className="px-3 pb-3">
          <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <svg
                    className="w-3 h-3 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="font-semibold text-blue-700">
                    {parsedDate.dayOfWeek}, {parsedDate.monthName}{" "}
                    {parsedDate.day}
                  </span>
                </div>
                <span className="text-gray-400">→</span>
                <span className="font-semibold text-purple-700">
                  {endDate.monthName} {endDate.day}
                </span>
              </div>
            </div>
            {tripTitle && (
              <p className="text-[9px] text-gray-600 mt-1 truncate">
                {tripTitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
