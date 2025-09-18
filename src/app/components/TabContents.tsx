'use client';

import WeatherWidget from './WeatherWidget';
import TravelItinerary from './TravelItinerary';
import DatePicker from './DatePicker';

// Trip Details Tab Content
export function TripDetailsContent() {
  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-medium text-white mb-3">Trip Overview</h3>
      
      <div className="space-y-3">
        <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
          <div className="text-xs text-gray-400 mb-1">Destination</div>
          <div className="text-sm text-white">Not set</div>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
          <div className="text-xs text-gray-400 mb-1">Duration</div>
          <div className="text-sm text-white">Not set</div>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
          <div className="text-xs text-gray-400 mb-1">Budget</div>
          <div className="text-sm text-white">Not set</div>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
          <div className="text-xs text-gray-400 mb-1">Travel Style</div>
          <div className="text-sm text-white">Not set</div>
        </div>
      </div>
    </div>
  );
}

// Itinerary Tab Content
export function ItineraryContent() {
  return (
    <div className="p-3">
      <TravelItinerary />
    </div>
  );
}

// Preferences Tab Content
export function PreferencesContent() {
  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-medium text-white mb-3">Travel Preferences</h3>
      
      <div className="space-y-3">
        <div>
          <div className="text-xs text-gray-400 mb-2">Interests</div>
          <div className="flex flex-wrap gap-1">
            {['Culture', 'Food', 'Adventure', 'Relaxation'].map((interest) => (
              <span
                key={interest}
                className="px-2 py-1 bg-gray-900 border border-gray-800 rounded-full text-xs text-gray-300"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
        
        <div>
          <div className="text-xs text-gray-400 mb-2">Accommodation</div>
          <div className="space-y-1">
            {['Hotel', 'Hostel', 'Airbnb', 'Resort'].map((type) => (
              <label key={type} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="w-3 h-3 rounded border-gray-600 bg-gray-900"
                />
                <span className="text-xs text-gray-300">{type}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div>
          <div className="text-xs text-gray-400 mb-2">Transportation</div>
          <select className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 text-xs text-white">
            <option>Any</option>
            <option>Public Transport</option>
            <option>Rental Car</option>
            <option>Walking</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// Bookmarks Tab Content
export function BookmarksContent() {
  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-medium text-white mb-3">Saved Places</h3>
      
      <div className="space-y-2">
        <div className="text-center text-gray-500 text-xs py-8">
          <div className="mb-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mx-auto mb-2">
              <path
                d="M19 21L12 16L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          No bookmarks saved yet
        </div>
      </div>
    </div>
  );
}

// Weather Tab Content
export function WeatherContent() {
  return (
    <div className="p-2">
      <WeatherWidget />
    </div>
  );
}

// History Tab Content
export function HistoryContent() {
  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-medium text-white mb-3">Chat History</h3>
      
      <div className="space-y-2">
        <div className="text-center text-gray-500 text-xs py-8">
          <div className="mb-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mx-auto mb-2">
              <path
                d="M12 8V12L16 16M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          No conversation history
        </div>
      </div>
    </div>
  );
}

// Dates Tab Content
export function DatesContent() {
  return (
    <div className="p-2">
      <DatePicker 
        onDateChange={(dates) => {
          console.log('Date selection changed:', dates);
        }}
      />
    </div>
  );
}
