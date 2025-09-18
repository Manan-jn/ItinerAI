'use client';

import { useState, useEffect, useRef } from 'react';

interface PeopleSelectorProps {
  onSelectionChange?: (selection: {
    rooms: number;
    adults: number;
    children: number;
    isFlexible: boolean;
  }) => void;
}

export default function PeopleSelector({ onSelectionChange }: PeopleSelectorProps) {
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [isFlexible, setIsFlexible] = useState(false);
  const [panelWidth, setPanelWidth] = useState(320);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Notify parent of changes
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange({
        rooms,
        adults,
        children,
        isFlexible
      });
    }
  }, [rooms, adults, children, isFlexible, onSelectionChange]);

  const isSmallPanel = panelWidth < 350;
  const isVerySmallPanel = panelWidth < 300;

  const incrementValue = (value: number, setter: (val: number) => void, max: number = 10) => {
    if (value < max) {
      setter(value + 1);
    }
  };

  const decrementValue = (value: number, setter: (val: number) => void, min: number = 0) => {
    if (value > min) {
      setter(value - 1);
    }
  };

  const CounterRow = ({ 
    label, 
    subtitle, 
    value, 
    onIncrement, 
    onDecrement, 
    disabled = false 
  }: {
    label: string;
    subtitle?: string;
    value: number;
    onIncrement: () => void;
    onDecrement: () => void;
    disabled?: boolean;
  }) => (
    <div className={`flex items-center justify-between py-3 transition-all duration-300 relative ${
      disabled ? 'opacity-40' : 'opacity-100'
    }`}>
      {disabled && (
        <div className="absolute inset-0 bg-gray-800/20 rounded-lg pointer-events-none"></div>
      )}
      <div className="flex-1 relative z-10">
        <div className={`font-medium flex items-center gap-2 ${disabled ? 'text-gray-500' : 'text-white'} ${isSmallPanel ? 'text-sm' : 'text-base'}`}>
          {label}
          {disabled && (
            <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6v2m0-6v2m-3-2h6M9 21h6a2 2 0 002-2V5a2 2 0 00-2-2H9a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          )}
        </div>
        {subtitle && (
          <div className={`${disabled ? 'text-gray-600' : 'text-gray-400'} ${isSmallPanel ? 'text-xs' : 'text-sm'}`}>
            {subtitle}
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-3 relative z-10">
        <button
          onClick={disabled ? undefined : onDecrement}
          disabled={disabled}
          className={`rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
            isSmallPanel ? 'w-7 h-7 text-sm' : 'w-8 h-8'
          } ${
            disabled 
              ? 'border-gray-700 text-gray-600 cursor-not-allowed' 
              : 'border-gray-600 text-gray-300 hover:border-blue-500 hover:text-blue-400 hover:scale-105'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        
        <span className={`font-semibold min-w-[2rem] text-center ${disabled ? 'text-gray-500' : 'text-white'} ${isSmallPanel ? 'text-lg' : 'text-xl'}`}>
          {value}
        </span>
        
        <button
          onClick={disabled ? undefined : onIncrement}
          disabled={disabled}
          className={`rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
            isSmallPanel ? 'w-7 h-7 text-sm' : 'w-8 h-8'
          } ${
            disabled 
              ? 'border-gray-700 text-gray-600 cursor-not-allowed' 
              : 'border-gray-600 text-gray-300 hover:border-blue-500 hover:text-blue-400 hover:scale-105'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <div 
      ref={containerRef}
      className="w-full bg-gradient-to-br from-gray-900/60 to-gray-900/40 border border-gray-700/50 rounded-xl backdrop-blur-sm"
    >
      {/* Header */}
      <div className={`p-4 border-b border-gray-700/50 ${isSmallPanel ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold text-white ${isSmallPanel ? 'text-sm' : 'text-base'}`}>
            {isVerySmallPanel ? 'Guests' : 'Guests & Rooms'}
          </h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className={`text-gray-400 ${isSmallPanel ? 'text-xs' : 'text-sm'}`}>
              {adults + children} {adults + children === 1 ? 'guest' : 'guests'}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`${isSmallPanel ? 'p-3' : 'p-4'}`}>
        {/* Flexibility Toggle */}
        <div className="mb-4">
          <label className="flex items-center space-x-3 cursor-pointer group">
            <div className="relative flex-shrink-0">
              <input
                type="checkbox"
                checked={isFlexible}
                onChange={(e) => {
                  console.log('Flexible room toggle changed:', e.target.checked);
                  setIsFlexible(e.target.checked);
                }}
                className="sr-only"
              />
              <div className={`relative rounded-full transition-all duration-300 shadow-inner ${
                isFlexible ? 'bg-blue-600 shadow-blue-400/50' : 'bg-gray-700 shadow-gray-500/30'
              } ${isSmallPanel ? 'w-10 h-5' : 'w-11 h-6'}`}>
                <div 
                  className={`absolute top-0.5 bg-white rounded-full transition-all duration-300 ease-in-out shadow-sm ${
                    isSmallPanel ? 'w-4 h-4' : 'w-5 h-5'
                  } ${
                    isFlexible 
                      ? isSmallPanel ? 'left-5' : 'left-6'
                      : 'left-0.5'
                  }`} 
                />
              </div>
            </div>
            <div className="flex-1">
              <span className={`font-medium group-hover:text-white transition-colors ${
                isFlexible ? 'text-blue-300' : 'text-gray-300'
              } ${isSmallPanel ? 'text-sm' : 'text-base'}`}>
                {isVerySmallPanel ? 'Flexible rooms' : 'Flexible on room preferences'}
              </span>
              <div className={`text-xs mt-0.5 transition-colors ${
                isFlexible ? 'text-blue-400' : 'text-gray-500'
              }`}>
                {isFlexible ? 'ON - Room selection disabled' : 'OFF - All options available'}
              </div>
            </div>
          </label>
          {isFlexible && (
            <div className={`mt-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg transition-all duration-300 ${isSmallPanel ? 'p-2' : 'p-3'}`}>
              <p className={`text-blue-300 ${isSmallPanel ? 'text-xs' : 'text-sm'}`}>
                ✨ We'll suggest the best room configuration for your group
              </p>
            </div>
          )}
        </div>

        {/* Room Selection */}
        <div className="space-y-1">
          <CounterRow
            label="Rooms"
            value={rooms}
            onIncrement={() => incrementValue(rooms, setRooms, 5)}
            onDecrement={() => decrementValue(rooms, setRooms, 1)}
            disabled={isFlexible}
          />

          <div className="border-t border-gray-800/50 my-2"></div>

          <CounterRow
            label="Adults"
            value={adults}
            onIncrement={() => incrementValue(adults, setAdults, 20)}
            onDecrement={() => decrementValue(adults, setAdults, 1)}
            disabled={false}
          />

          <CounterRow
            label="Children"
            subtitle="0 - 17 Years Old"
            value={children}
            onIncrement={() => incrementValue(children, setChildren, 10)}
            onDecrement={() => decrementValue(children, setChildren, 0)}
            disabled={false}
          />
        </div>

        {/* Additional Info */}
        {children > 0 && (
          <div className={`mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg ${isSmallPanel ? 'p-2' : 'p-3'}`}>
            <p className={`text-blue-300 ${isSmallPanel ? 'text-xs' : 'text-sm'}`}>
              Please provide right number of children along with their right age for best options and prices.
            </p>
          </div>
        )}

        {/* Apply Button */}
        <div className="mt-6 pt-4 border-t border-gray-700/50">
          <button className={`w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 ${
            isSmallPanel ? 'text-sm py-2 px-4' : 'text-base py-3 px-6'
          }`}>
            APPLY
          </button>
        </div>
      </div>
    </div>
  );
}
