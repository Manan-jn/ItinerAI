'use client';

import { useState, useRef } from 'react';

interface Activity {
  id: string;
  time: string;
  title: string;
  location?: string;
  description?: string;
  type: 'travel' | 'food' | 'activity' | 'rest' | 'sightseeing';
}

interface Day {
  id: string;
  date: string;
  dayNumber: number;
  activities: Activity[];
}

const initialItinerary: Day[] = [
  {
    id: 'day-1',
    date: '2024-03-15',
    dayNumber: 1,
    activities: [
      {
        id: 'act-1',
        time: '08:00',
        title: 'Departure',
        location: 'Home',
        description: 'Start journey to destination',
        type: 'travel'
      },
      {
        id: 'act-2',
        time: '12:00',
        title: 'Lunch',
        location: 'Local Restaurant',
        description: 'Try traditional cuisine',
        type: 'food'
      },
      {
        id: 'act-3',
        time: '14:30',
        title: 'City Tour',
        location: 'Downtown',
        description: 'Explore main attractions',
        type: 'sightseeing'
      },
      {
        id: 'act-4',
        time: '18:00',
        title: 'Hotel Check-in',
        location: 'Grand Hotel',
        description: 'Rest and refresh',
        type: 'rest'
      }
    ]
  },
  {
    id: 'day-2',
    date: '2024-03-16',
    dayNumber: 2,
    activities: [
      {
        id: 'act-5',
        time: '09:00',
        title: 'Museum Visit',
        location: 'National Museum',
        description: 'Learn about local history',
        type: 'activity'
      },
      {
        id: 'act-6',
        time: '13:00',
        title: 'Lunch Break',
        location: 'Cafe Central',
        description: 'Light meal and coffee',
        type: 'food'
      },
      {
        id: 'act-7',
        time: '15:00',
        title: 'Shopping',
        location: 'Market Street',
        description: 'Buy souvenirs and local crafts',
        type: 'activity'
      }
    ]
  }
];

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'travel':
      return '✈️';
    case 'food':
      return '🍽️';
    case 'activity':
      return '🎯';
    case 'rest':
      return '🏨';
    case 'sightseeing':
      return '📸';
    default:
      return '📍';
  }
};

const getActivityColor = (type: Activity['type']) => {
  switch (type) {
    case 'travel':
      return 'bg-blue-500/20 border-blue-400';
    case 'food':
      return 'bg-orange-500/20 border-orange-400';
    case 'activity':
      return 'bg-green-500/20 border-green-400';
    case 'rest':
      return 'bg-purple-500/20 border-purple-400';
    case 'sightseeing':
      return 'bg-pink-500/20 border-pink-400';
    default:
      return 'bg-gray-500/20 border-gray-400';
  }
};

export default function TravelItinerary() {
  const [itinerary, setItinerary] = useState<Day[]>(initialItinerary);
  const [expandedDay, setExpandedDay] = useState<string | null>('day-1'); // Start with first day expanded
  // Removed unused state variables: editingActivity, setEditingActivity, draggedActivity, setDraggedActivity
  const scrollRef = useRef<HTMLDivElement>(null);

  const toggleDay = (dayId: string) => {
    setExpandedDay(expandedDay === dayId ? null : dayId);
  };

  const addNewDay = () => {
    const newDayNumber = itinerary.length + 1;
    const newDay: Day = {
      id: `day-${newDayNumber}`,
      date: new Date(Date.now() + (newDayNumber - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dayNumber: newDayNumber,
      activities: [
        {
          id: `act-new-${Date.now()}`,
          time: '09:00',
          title: 'New Activity',
          location: 'To be planned',
          description: 'Plan your activities for this day',
          type: 'activity'
        }
      ]
    };
    setItinerary([...itinerary, newDay]);
    setExpandedDay(newDay.id); // Auto-expand new day
  };

  const addActivity = (dayId: string) => {
    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      time: '10:00',
      title: 'New Activity',
      location: 'Location',
      description: 'Add description...',
      type: 'activity'
    };

    setItinerary(prev => prev.map(day => 
      day.id === dayId 
        ? { ...day, activities: [...day.activities, newActivity] }
        : day
    ));
  };

  const deleteActivity = (dayId: string, activityId: string) => {
    setItinerary(prev => prev.map(day => 
      day.id === dayId 
        ? { ...day, activities: day.activities.filter(act => act.id !== activityId) }
        : day
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTotalActivities = () => {
    return itinerary.reduce((total, day) => total + day.activities.length, 0);
  };

  // Removed unused function: getDayProgress

  return (
    <div className="w-full" ref={scrollRef}>
      {/* Header Stats */}
      <div className="mb-3 p-3 bg-gray-900/50 border border-gray-800 rounded-lg">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-white">Travel Plan</h2>
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
            <span className="text-xs text-gray-400">{itinerary.length} days</span>
          </div>
        </div>
        <div className="text-xs text-gray-400">
          {getTotalActivities()} activities planned
        </div>
      </div>

      <div className="space-y-1">
        {/* Itinerary Days */}
        {itinerary.map((day, dayIndex) => {
          const isExpanded = expandedDay === day.id;
          const isLast = dayIndex === itinerary.length - 1;

          return (
            <div key={day.id} className="relative">
              {/* Day Header */}
              <div
                onClick={() => toggleDay(day.id)}
                className={`p-3 bg-gray-900/50 hover:bg-gray-900/70 border border-gray-800 rounded-lg cursor-pointer transition-all duration-200 ${
                  isExpanded ? 'border-blue-500/50 bg-blue-500/5' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg font-semibold text-sm transition-all duration-200 ${
                      isExpanded 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {day.dayNumber}
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">Day {day.dayNumber}</div>
                      <div className="text-gray-400 text-xs">{formatDate(day.date)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">{day.activities.length}</span>
                    {isExpanded && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addActivity(day.id);
                        }}
                        className="p-1 text-green-400 hover:bg-green-500/20 rounded transition-all duration-200"
                        title="Add Activity"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    )}
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Day Activities */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isExpanded ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="bg-gray-900/30 rounded-lg p-3 ml-3">
                  <div className="space-y-2">
                    {day.activities.map((activity, activityIndex) => {
                      const isLastActivity = activityIndex === day.activities.length - 1;
                      
                      return (
                        <div key={activity.id} className="relative flex items-start space-x-3 group/activity">
                          {/* Timeline */}
                          <div className="flex flex-col items-center">
                            <div className={`flex items-center justify-center w-6 h-6 rounded border ${getActivityColor(activity.type)} text-xs`}>
                              {getActivityIcon(activity.type)}
                            </div>
                            {!isLastActivity && (
                              <div className="w-px h-6 bg-gray-700 mt-1"></div>
                            )}
                          </div>

                          {/* Activity Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                                  {activity.time}
                                </span>
                                <span className="text-white text-sm font-medium">
                                  {activity.title}
                                </span>
                              </div>
                              <button
                                onClick={() => deleteActivity(day.id, activity.id)}
                                className="opacity-0 group-hover/activity:opacity-100 p-0.5 text-red-400 hover:text-red-300 transition-all duration-200"
                                title="Delete"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            
                            {activity.location && (
                              <div className="flex items-center space-x-1 mb-1">
                                <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-gray-400 text-xs">{activity.location}</span>
                              </div>
                            )}
                            
                            {activity.description && (
                              <p className="text-gray-300 text-xs leading-relaxed">
                                {activity.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Connecting Line to Next Day */}
              {!isLast && !isExpanded && (
                <div className="flex justify-center py-1">
                  <div className="w-px h-2 bg-gray-700"></div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add New Day Button */}
        <button
          onClick={addNewDay}
          className="w-full p-3 border border-dashed border-gray-700 hover:border-blue-500/50 rounded-lg text-gray-400 hover:text-blue-400 transition-all duration-200 text-sm"
        >
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Day</span>
          </div>
        </button>
      </div>
    </div>
  );
}
