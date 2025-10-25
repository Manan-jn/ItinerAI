"use client";

import { useState, useEffect, useRef } from "react";

interface PlacesSelectorProps {
  onPlacesChange?: (places: {
    preferred: Place[];
    searchQuery: string;
  }) => void;
}

interface Place {
  id: string;
  name: string;
  country: string;
  image: string;
  weather: {
    temperature: number;
    condition: string;
    icon: string;
  };
  category: "preferred" | "rest";
}

// Mock data for demonstration
const MOCK_PLACES: Place[] = [
  // Preferred Places
  {
    id: "1",
    name: "Paris",
    country: "France",
    image:
      "https://images.unsplash.com/photo-1549144511-f099e773c147?w=400&h=300&fit=crop&auto=format",
    weather: { temperature: 18, condition: "Cloudy", icon: "☁️" },
    category: "preferred",
  },
  {
    id: "2",
    name: "Tokyo",
    country: "Japan",
    image:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop",
    weather: { temperature: 22, condition: "Sunny", icon: "☀️" },
    category: "preferred",
  },
  {
    id: "3",
    name: "New York",
    country: "USA",
    image:
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop",
    weather: { temperature: 25, condition: "Clear", icon: "🌤️" },
    category: "preferred",
  },
  {
    id: "4",
    name: "Bali",
    country: "Indonesia",
    image:
      "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=400&h=300&fit=crop",
    weather: { temperature: 28, condition: "Tropical", icon: "🌴" },
    category: "preferred",
  },
  // Rest Places
  {
    id: "5",
    name: "London",
    country: "UK",
    image:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop",
    weather: { temperature: 15, condition: "Rainy", icon: "🌧️" },
    category: "rest",
  },
  {
    id: "6",
    name: "Dubai",
    country: "UAE",
    image:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop",
    weather: { temperature: 35, condition: "Hot", icon: "🌡️" },
    category: "rest",
  },
  {
    id: "7",
    name: "Sydney",
    country: "Australia",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
    weather: { temperature: 20, condition: "Partly Cloudy", icon: "⛅" },
    category: "rest",
  },
  {
    id: "8",
    name: "Rome",
    country: "Italy",
    image:
      "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&h=300&fit=crop",
    weather: { temperature: 23, condition: "Pleasant", icon: "🌞" },
    category: "rest",
  },
  {
    id: "9",
    name: "Barcelona",
    country: "Spain",
    image:
      "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400&h=300&fit=crop",
    weather: { temperature: 26, condition: "Warm", icon: "☀️" },
    category: "rest",
  },
  {
    id: "10",
    name: "Amsterdam",
    country: "Netherlands",
    image:
      "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400&h=300&fit=crop",
    weather: { temperature: 17, condition: "Cool", icon: "🌥️" },
    category: "rest",
  },
];

export default function PlacesSelector({
  onPlacesChange,
}: PlacesSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [places] = useState<Place[]>(MOCK_PLACES);
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
    if (onPlacesChange) {
      onPlacesChange({
        preferred: places.filter((place) => place.category === "preferred"),
        searchQuery,
      });
    }
  }, [places, searchQuery, onPlacesChange]);

  // const isSmallPanel = panelWidth < 350;
  const isMediumPanel = panelWidth >= 350 && panelWidth < 500;
  const isLargePanel = panelWidth >= 500;

  // Determine number of columns based on panel width
  const getColumnClass = () => {
    if (isLargePanel) return "grid grid-cols-2 gap-3";
    if (isMediumPanel) return "grid grid-cols-1 gap-3";
    return "space-y-3";
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const filteredPlaces = places.filter(
    (place) =>
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const preferredPlaces = filteredPlaces.filter(
    (place) => place.category === "preferred"
  );
  const otherPlaces = filteredPlaces.filter(
    (place) => place.category === "rest"
  );

  const PlaceCard = ({ place }: { place: Place }) => (
    <div className="group bg-gray-800/40 hover:bg-gray-700/50 border border-gray-700/50 hover:border-gray-600/50 rounded-lg transition-all duration-200 overflow-hidden hover:shadow-lg hover:shadow-black/20">
      {/* Place Image */}
      <div
        className={`relative overflow-hidden ${isLargePanel ? "h-20" : "h-24"}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={place.image}
          alt={place.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            // Fallback for broken images
            e.currentTarget.src = `https://via.placeholder.com/400x300/374151/9CA3AF?text=${encodeURIComponent(
              place.name
            )}`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

        {/* Weather overlay */}
        <div className="absolute top-2 right-2 flex items-center space-x-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
          <span className="text-sm">{place.weather.icon}</span>
          <span className="text-xs text-white font-medium">
            {place.weather.temperature}°C
          </span>
        </div>

        {/* Category indicator for preferred places */}
        {place.category === "preferred" && (
          <div className="absolute top-2 left-2 bg-blue-500/90 backdrop-blur-sm rounded-full px-2 py-1">
            <svg
              className="w-3 h-3 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Place Info */}
      <div className={`${isLargePanel ? "p-2" : "p-3"}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4
              className={`font-semibold text-white truncate mb-1 ${
                isLargePanel ? "text-xs" : "text-sm"
              }`}
            >
              {place.name}
            </h4>
            <div
              className={`flex items-center space-x-1 text-gray-400 ${
                isLargePanel ? "text-xs" : "text-xs"
              }`}
            >
              <svg
                className="w-3 h-3 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="truncate">{place.country}</span>
            </div>
            <div
              className={`flex items-center space-x-1 mt-1 text-gray-300 ${
                isLargePanel ? "text-xs" : "text-xs"
              }`}
            >
              <span>{place.weather.condition}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="w-full bg-gradient-to-br from-gray-900/60 to-gray-900/40 border border-gray-700/50 rounded-xl backdrop-blur-sm"
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Places</h3>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
            <span className="text-xs text-gray-400">
              {preferredPlaces.length} preferred
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="space-y-3">
          {/* Search Field */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">
              Search Places
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search cities, countries..."
                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-800/60 border border-gray-600/50 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Preferred Places Section */}
          {preferredPlaces.length > 0 && (
            <div className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-blue-500/20 rounded-lg p-3">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <label className="text-sm font-semibold text-blue-300">
                      Preferred Places
                    </label>
                  </div>
                  <div className="px-2 py-1 bg-blue-500/20 rounded-full">
                    <span className="text-xs text-blue-300 font-medium">
                      {preferredPlaces.length} places
                    </span>
                  </div>
                </div>
                <svg
                  className="w-4 h-4 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div
                className={`${getColumnClass()} max-h-80 overflow-y-auto pr-1`}
              >
                {preferredPlaces.map((place) => (
                  <PlaceCard key={place.id} place={place} />
                ))}
              </div>
            </div>
          )}

          {/* Rest Places Section */}
          {otherPlaces.length > 0 && (
            <div className="bg-gradient-to-r from-gray-500/5 to-gray-600/5 border border-gray-500/20 rounded-lg p-3">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <label className="text-sm font-semibold text-gray-300">
                      Rest Places
                    </label>
                  </div>
                  <div className="px-2 py-1 bg-gray-500/20 rounded-full">
                    <span className="text-xs text-gray-300 font-medium">
                      {otherPlaces.length} places
                    </span>
                  </div>
                </div>
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div
                className={`${getColumnClass()} max-h-96 overflow-y-auto pr-1`}
              >
                {otherPlaces.map((place) => (
                  <PlaceCard key={place.id} place={place} />
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {filteredPlaces.length === 0 && searchQuery && (
            <div className="text-center py-8">
              <svg
                className="w-12 h-12 text-gray-600 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p className="text-sm text-gray-500">No places found</p>
              <p className="text-xs text-gray-600 mt-1">
                Try searching for cities or countries
              </p>
            </div>
          )}

          {/* Apply Button */}
          <div className="pt-4 border-t border-gray-700/50">
            <button className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] text-sm py-2.5 px-4">
              <div className="flex items-center justify-center space-x-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>APPLY</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
