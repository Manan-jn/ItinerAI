'use client';

import { useState, useEffect, useRef } from 'react';

interface DatePickerProps {
  onDateChange?: (dates: { startDate: Date | null; endDate: Date | null; isFlexible: boolean; flexibleOption?: string }) => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isInRange: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
}

// Flexible options for future implementation
// const FLEXIBLE_OPTIONS = [
//   { id: 'weekend', label: 'Weekend', months: ['September', 'October', 'November', 'December', 'January', 'February'] },
//   { id: '1week', label: '1 week', months: ['September', 'October', 'November', 'December', 'January', 'February'] },
//   { id: '2weeks', label: '2 weeks', months: ['September', 'October', 'November', 'December', 'January', 'February'] }
// ];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function DatePicker({ onDateChange }: DatePickerProps) {
  const [activeTab, setActiveTab] = useState<'specific' | 'flexible'>('specific');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [panelWidth, setPanelWidth] = useState(320);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Flexible dates state - commented out until implementation
  // const [flexibleDuration, setFlexibleDuration] = useState('1week');
  const [selectedMonths, setSelectedMonths] = useState<string[]>(['November']);
  const [flexibleType, setFlexibleType] = useState<'weekend' | '1week' | '2weeks'>('1week');

  // Initialize with some default dates as shown in the image
  useEffect(() => {
    const today = new Date();
    const defaultStart = new Date(today.getFullYear(), 9, 14); // Oct 14
    const defaultEnd = new Date(today.getFullYear(), 9, 18); // Oct 18
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
    setCurrentMonth(9); // October
    setCurrentYear(today.getFullYear());
  }, []);

  // Detect panel width for responsive design
  useEffect(() => {
    const detectWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setPanelWidth(width);
      }
    };

    detectWidth();
    const resizeObserver = new ResizeObserver(detectWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (onDateChange) {
      onDateChange({
        startDate,
        endDate,
        isFlexible: activeTab === 'flexible',
        flexibleOption: activeTab === 'flexible' ? `${flexibleType} in ${selectedMonths.join(', ')}` : undefined
      });
    }
  }, [startDate, endDate, activeTab, flexibleType, selectedMonths, onDateChange]);

  const getDaysInMonth = (month: number, year: number): CalendarDay[] => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: CalendarDay[] = [];
    
    // Add previous month's days
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
    
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(prevYear, prevMonth, daysInPrevMonth - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        isInRange: false,
        isRangeStart: false,
        isRangeEnd: false
      });
    }
    
    // Add current month's days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = Boolean((startDate && date.toDateString() === startDate.toDateString()) ||
                        (endDate && date.toDateString() === endDate.toDateString()));
      const isRangeStart = Boolean(startDate && date.toDateString() === startDate.toDateString());
      const isRangeEnd = Boolean(endDate && date.toDateString() === endDate.toDateString());
      const isInRange = Boolean(startDate && endDate && date >= startDate && date <= endDate && !isSelected);
      
      days.push({
        date,
        isCurrentMonth: true,
        isToday,
        isSelected,
        isInRange,
        isRangeStart,
        isRangeEnd
      });
    }
    
    // Add next month's days
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const remainingDays = 42 - days.length;
    
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(nextYear, nextMonth, day);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        isInRange: false,
        isRangeStart: false,
        isRangeEnd: false
      });
    }
    
    return days;
  };

  const handleDateClick = (day: CalendarDay) => {
    if (!day.isCurrentMonth) return;
    
    if (!startDate || (startDate && endDate)) {
      // Starting new selection
      setStartDate(day.date);
      setEndDate(null);
      setSelectingEnd(true);
    } else if (selectingEnd && startDate) {
      // Selecting end date - must be after start date
      if (day.date >= startDate) {
        setEndDate(day.date);
        setSelectingEnd(false);
      } else {
        // If selected date is before start date, make it the new start date and clear end date
        setStartDate(day.date);
        setEndDate(null);
        setSelectingEnd(true);
      }
    }
  };

  const isDateDisabled = (date: Date): boolean => {
    // If we're selecting an end date and have a start date, disable dates before start date
    return selectingEnd && startDate ? date < startDate : false;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const toggleMonth = (month: string) => {
    setSelectedMonths(prev => 
      prev.includes(month) 
        ? prev.filter(m => m !== month)
        : [...prev, month]
    );
  };

  // Date range formatting function - commented out until needed
  // const formatDateRange = () => {
  //   if (!startDate) return 'Select dates';
  //   if (!endDate) return startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  //   
  //   const startStr = startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  //   const endStr = endDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  //   return `${startStr} - ${endStr}`;
  // };

  const renderCalendar = (monthOffset: number = 0) => {
    const displayMonth = currentMonth + monthOffset;
    const displayYear = currentYear + Math.floor(displayMonth / 12);
    const normalizedMonth = ((displayMonth % 12) + 12) % 12;
    
    const days = getDaysInMonth(normalizedMonth, displayYear);
    const isSmallPanel = panelWidth < 350;
    
    return (
      <div className="flex-1">
        <div className="text-center mb-3">
          <h3 className={`font-medium text-white ${isSmallPanel ? 'text-sm' : 'text-base'}`}>
            {isSmallPanel ? MONTHS[normalizedMonth].slice(0, 3) : MONTHS[normalizedMonth]}
          </h3>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map((day, index) => (
            <div key={index} className="text-center text-xs font-medium text-gray-400 py-1">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const isDisabled = !day.isCurrentMonth || isDateDisabled(day.date);
            const buttonSize = isSmallPanel ? 'h-7 w-7 text-xs' : 'h-8 w-8 text-sm';
            
            return (
              <button
                key={index}
                onClick={() => handleDateClick(day)}
                disabled={isDisabled}
                className={`
                  ${buttonSize} font-medium rounded-full transition-all duration-200 relative flex items-center justify-center
                  ${isDisabled
                    ? 'text-gray-600 cursor-not-allowed opacity-50' 
                    : 'text-white hover:bg-gray-700 hover:scale-105'
                  }
                  ${day.isToday && !isDisabled ? 'ring-2 ring-blue-400/60' : ''}
                  ${day.isSelected 
                    ? day.isRangeStart || day.isRangeEnd
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-blue-500 text-white'
                    : ''
                  }
                  ${day.isInRange && !isDisabled ? 'bg-blue-500/20 text-blue-200 ring-1 ring-blue-500/30' : ''}
                  ${selectingEnd && startDate && day.date >= startDate && day.isCurrentMonth && !day.isSelected 
                    ? 'hover:bg-blue-500/40 hover:text-blue-100' 
                    : ''
                  }
                `}
              >
                {day.date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const isSmallPanel = panelWidth < 350;
  const isVerySmallPanel = panelWidth < 300;

  return (
    <div ref={containerRef} className="w-full bg-gradient-to-br from-gray-900/60 to-gray-900/40 border border-gray-700/50 rounded-xl backdrop-blur-sm">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700/50">
        <button
          onClick={() => setActiveTab('specific')}
          className={`flex-1 px-3 py-3 text-sm font-medium transition-all duration-300 relative overflow-hidden ${
            activeTab === 'specific'
              ? 'text-white bg-gradient-to-r from-blue-600/20 to-blue-500/10'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
          }`}
        >
          {activeTab === 'specific' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-400"></div>
          )}
          {isVerySmallPanel ? 'Specific' : 'Specific dates'}
        </button>
        <button
          onClick={() => setActiveTab('flexible')}
          className={`flex-1 px-3 py-3 text-sm font-medium transition-all duration-300 relative overflow-hidden ${
            activeTab === 'flexible'
              ? 'text-white bg-gradient-to-r from-blue-600/20 to-blue-500/10'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
          }`}
        >
          {activeTab === 'flexible' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-400"></div>
          )}
          {isVerySmallPanel ? 'Flexible' : 'Flexible dates'}
        </button>
      </div>

      <div className={`${isSmallPanel ? 'p-2' : 'p-4'}`}>
        {activeTab === 'specific' ? (
          <div>
            {/* Date Range Display */}
            <div className={`mb-4 p-3 bg-gradient-to-r from-gray-800/60 to-gray-800/40 rounded-xl border border-gray-600/30 backdrop-blur-sm ${isSmallPanel ? 'p-2' : 'p-3'}`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className={`text-gray-300 font-medium ${isSmallPanel ? 'text-xs' : 'text-sm'}`}>
                      {startDate ? startDate.toLocaleDateString('en-US', { 
                        weekday: isVerySmallPanel ? undefined : 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      }) : 'Start date'}
                    </span>
                  </div>
                  {selectingEnd && (
                    <div className="text-xs text-blue-400 animate-pulse">Select end date</div>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${endDate ? 'bg-blue-400' : 'bg-gray-600'}`}></div>
                    <span className={`text-gray-300 font-medium ${isSmallPanel ? 'text-xs' : 'text-sm'}`}>
                      {endDate ? endDate.toLocaleDateString('en-US', { 
                        weekday: isVerySmallPanel ? undefined : 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      }) : 'End date'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-700/50 rounded-lg transition-all duration-200 hover:scale-105"
              >
                <svg className={`text-gray-400 hover:text-white ${isSmallPanel ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <h2 className={`font-medium text-white ${isSmallPanel ? 'text-sm' : 'text-lg'}`}>
                {isVerySmallPanel 
                  ? `${MONTHS[currentMonth].slice(0, 3)} ${currentYear.toString().slice(-2)}` 
                  : `${MONTHS[currentMonth]} ${currentYear}`
                }
              </h2>
              
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-700/50 rounded-lg transition-all duration-200 hover:scale-105"
              >
                <svg className={`text-gray-400 hover:text-white ${isSmallPanel ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Responsive Calendar Layout */}
            <div className={`${isVerySmallPanel ? 'space-y-4' : 'flex space-x-4'}`}>
              {renderCalendar(0)}
              {!isVerySmallPanel && renderCalendar(1)}
            </div>

            {/* Action Buttons */}
            <div className={`flex justify-end space-x-2 mt-6 pt-4 border-t border-gray-700/50 ${isSmallPanel ? 'space-x-1' : 'space-x-3'}`}>
              <button 
                onClick={() => {
                  setStartDate(null);
                  setEndDate(null);
                  setSelectingEnd(false);
                }}
                className={`px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700/30 rounded-lg transition-all duration-200 ${isSmallPanel ? 'text-xs px-2 py-1' : 'text-sm px-4 py-2'}`}
              >
                Reset
              </button>
              <button className={`bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 ${isSmallPanel ? 'text-xs px-3 py-1' : 'text-sm px-6 py-2'}`}>
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Flexible Dates Tab */
          <div>

            {/* Month Selection */}
            <div className="mb-6">
              <div className={`flex flex-wrap gap-2 mb-3 ${isVerySmallPanel ? 'gap-1' : 'gap-2'}`}>
                <button
                  onClick={() => setSelectedMonths(['September', 'October', 'November', 'December', 'January', 'February'])}
                  className={`px-2 py-1 rounded-full transition-all duration-200 hover:scale-105 ${isSmallPanel ? 'text-xs px-2 py-1' : 'text-xs px-3 py-1'} ${
                    selectedMonths.length === 6 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25' 
                      : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50'
                  }`}
                >
                  ✓ All
                </button>
                {['September', 'October', 'November', 'December', 'January', 'February'].map(month => (
                  <button
                    key={month}
                    onClick={() => toggleMonth(month)}
                    className={`px-2 py-1 rounded-full transition-all duration-200 hover:scale-105 ${isSmallPanel ? 'text-xs px-2 py-1' : 'text-xs px-3 py-1'} ${
                      selectedMonths.includes(month)
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50'
                    }`}
                  >
                    {isVerySmallPanel ? month.slice(0, 3) : month}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Options */}
            <div className="mb-6">
              <div className={`flex flex-wrap gap-2 ${isVerySmallPanel ? 'gap-1' : 'gap-2'}`}>
                <button
                  onClick={() => setFlexibleType('weekend')}
                  className={`px-2 py-1 rounded-full transition-all duration-200 hover:scale-105 ${isSmallPanel ? 'text-xs px-2 py-1' : 'text-xs px-3 py-1'} ${
                    flexibleType === 'weekend'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50'
                  }`}
                >
                  Weekend
                </button>
                <button
                  onClick={() => setFlexibleType('1week')}
                  className={`px-2 py-1 rounded-full transition-all duration-200 hover:scale-105 ${isSmallPanel ? 'text-xs px-2 py-1' : 'text-xs px-3 py-1'} ${
                    flexibleType === '1week'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50'
                  }`}
                >
                  ✓ 1 week
                </button>
                <button
                  onClick={() => setFlexibleType('2weeks')}
                  className={`px-2 py-1 rounded-full transition-all duration-200 hover:scale-105 ${isSmallPanel ? 'text-xs px-2 py-1' : 'text-xs px-3 py-1'} ${
                    flexibleType === '2weeks'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50'
                  }`}
                >
                  2 weeks
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={`flex justify-end space-x-2 pt-4 border-t border-gray-700/50 ${isSmallPanel ? 'space-x-1' : 'space-x-3'}`}>
              <button 
                onClick={() => {
                  setSelectedMonths(['November']);
                  setFlexibleType('1week');
                }}
                className={`px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700/30 rounded-lg transition-all duration-200 ${isSmallPanel ? 'text-xs px-2 py-1' : 'text-sm px-4 py-2'}`}
              >
                Reset
              </button>
              <button className={`bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 ${isSmallPanel ? 'text-xs px-3 py-1' : 'text-sm px-6 py-2'}`}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
