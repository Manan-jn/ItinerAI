"use client";

import { useEffect, useRef, useState } from "react";
import { ItineraryStop } from "./ItineraryWidget";

interface ItineraryMapProps {
  stops: ItineraryStop[];
  dayTitle: string;
}

// Declare google maps types
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function ItineraryMap({ stops, dayTitle }: ItineraryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // Load Google Maps script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      "AIzaSyCf5tix34FAK7eWdYArHLzklKk7FaaWIPk"
    }&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Cleanup is handled by React
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google) return;

    // Get coordinates from stops - parse from the actual API response structure
    const coordinates = stops
      .map((stop: any, index: number) => {
        // The API response includes lat/long in the schedule items
        // Try multiple possible locations for coordinates
        let lat = null;
        let lng = null;

        // Check direct properties
        if (stop.lat && stop.long) {
          lat = stop.lat;
          lng = stop.long;
        }
        // Check from_location
        else if (stop.from_location?.lat && stop.from_location?.long) {
          lat = stop.from_location.lat;
          lng = stop.from_location.long;
        }
        // Check to_location
        else if (stop.to_location?.lat && stop.to_location?.long) {
          lat = stop.to_location.lat;
          lng = stop.to_location.long;
        }
        // Parse from location string if needed
        else if (stop.location && typeof stop.location === "string") {
          // Try to extract coordinates from description or other fields
          const descMatch = stop.description?.match(/(\d+\.\d+),\s*(\d+\.\d+)/);
          if (descMatch) {
            lat = descMatch[1];
            lng = descMatch[2];
          }
        }

        if (lat && lng) {
          return {
            lat: parseFloat(lat.toString()),
            lng: parseFloat(lng.toString()),
            name: stop.name,
            index: index + 1,
          };
        }
        return null;
      })
      .filter(Boolean);

    console.log(
      `Found ${coordinates.length} coordinates from ${stops.length} stops`
    );

    if (coordinates.length === 0) {
      console.log("No coordinates found in stops, using default location");
      return;
    }

    // Calculate center
    const center =
      coordinates.length > 0
        ? {
            lat:
              coordinates.reduce((sum, coord) => sum + coord!.lat, 0) /
              coordinates.length,
            lng:
              coordinates.reduce((sum, coord) => sum + coord!.lng, 0) /
              coordinates.length,
          }
        : { lat: 0, lng: 0 };

    // Initialize map
    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 12,
      styles: [
        {
          featureType: "all",
          elementType: "geometry",
          stylers: [{ color: "#f5f5f5" }],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#c9e9ff" }],
        },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#ffffff" }],
        },
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    setMapInstance(map);

    // Add markers for each stop
    const bounds = new window.google.maps.LatLngBounds();
    coordinates.forEach((coord, idx) => {
      if (!coord) return;

      const marker = new window.google.maps.Marker({
        position: { lat: coord.lat, lng: coord.lng },
        map,
        title: coord.name,
        label: {
          text: `${idx + 1}`,
          color: "white",
          fontSize: "12px",
          fontWeight: "bold",
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor:
            idx === 0
              ? "#10b981"
              : idx === coordinates.length - 1
              ? "#ef4444"
              : "#8b5cf6",
          fillOpacity: 1,
          strokeColor: "white",
          strokeWeight: 3,
          scale: 15,
        },
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div style="padding: 8px; font-weight: 600; color: #374151;">${coord.name}</div>`,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });

      bounds.extend({ lat: coord.lat, lng: coord.lng });
    });

    // Draw path between stops
    if (coordinates.length > 1) {
      const path = coordinates
        .map((coord) => (coord ? { lat: coord.lat, lng: coord.lng } : null))
        .filter(Boolean);

      new window.google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: "#8b5cf6",
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map,
      });
    }

    // Fit bounds to show all markers
    if (coordinates.length > 1) {
      map.fitBounds(bounds);
    }
  }, [isLoaded, stops]);

  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden">
      {/* Glassmorphic overlay header */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl p-4 border-2 border-white/50">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-extrabold text-gray-900 mb-1">
                📍 Route Map
              </h4>
              <p className="text-xs text-gray-700 font-semibold">
                {stops.length} locations today
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg"></div>
              <span className="text-[10px] font-bold text-gray-600">Start</span>
              <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg ml-2"></div>
              <span className="text-[10px] font-bold text-gray-600">End</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map container */}
      <div
        ref={mapRef}
        className="w-full h-full bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50"
      ></div>

      {/* Loading state */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 via-indigo-50 to-blue-100">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm font-bold text-gray-700">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
