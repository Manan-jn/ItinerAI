"use client";

import React, { useEffect, useRef, useState } from "react";

interface Place {
  place_name: string;
  lat: string;
  long: string;
  address: string;
}

interface TripMapProps {
  places: Place[];
}

export function TripMap({ places }: TripMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!places || places.length === 0) return;

    // Load Google Maps script
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      // Check if script is already being loaded or exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // Script already exists, wait for it to load
        if (window.google && window.google.maps) {
          initializeMap();
        } else {
          existingScript.addEventListener('load', () => {
            setMapLoaded(true);
            initializeMap();
          });
        }
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setMapLoaded(true);
        initializeMap();
      };
      script.onerror = () => {
        setError("Failed to load Google Maps");
      };
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapRef.current || !window.google) return;

      try {
        // Calculate center point (average of all coordinates)
        const avgLat = places.reduce((sum, place) => sum + parseFloat(place.lat), 0) / places.length;
        const avgLng = places.reduce((sum, place) => sum + parseFloat(place.long), 0) / places.length;

        // Create map
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: avgLat, lng: avgLng },
          zoom: 6,
          styles: [
            {
              featureType: "all",
              elementType: "geometry",
              stylers: [{ color: "#f0f9ff" }]
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#bfdbfe" }]
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#ffffff" }]
            },
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ],
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        // Create bounds to fit all markers
        const bounds = new google.maps.LatLngBounds();

        // Add markers for each place
        places.forEach((place, index) => {
          const position = {
            lat: parseFloat(place.lat),
            lng: parseFloat(place.long),
          };

          // Create custom HTML marker
          const markerDiv = document.createElement('div');
          markerDiv.className = 'custom-map-marker';
          markerDiv.innerHTML = `
            <div class="marker-pin">
              <div class="marker-number">${index + 1}</div>
            </div>
            <div class="marker-label">${place.place_name}</div>
          `;

          // Add styles for custom marker
          const style = document.createElement('style');
          style.textContent = `
            .custom-map-marker {
              position: relative;
              cursor: pointer;
              transform: translate(-50%, -100%);
            }
            .marker-pin {
              width: 40px;
              height: 40px;
              border-radius: 50% 50% 50% 0;
              background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
              position: relative;
              transform: rotate(-45deg);
              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4), 0 0 0 4px rgba(255, 255, 255, 0.9);
              transition: all 0.3s ease;
            }
            .marker-number {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(45deg);
              color: white;
              font-weight: 800;
              font-size: 16px;
              font-family: system-ui, -apple-system, sans-serif;
            }
            .marker-label {
              position: absolute;
              top: 100%;
              left: 50%;
              transform: translateX(-50%);
              background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(240, 249, 255, 0.95) 100%);
              padding: 6px 12px;
              border-radius: 8px;
              white-space: nowrap;
              font-size: 12px;
              font-weight: 700;
              color: #0f172a;
              margin-top: 8px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15), 0 0 0 2px rgba(59, 130, 246, 0.2);
              border: 1px solid rgba(59, 130, 246, 0.3);
            }
            .custom-map-marker:hover .marker-pin {
              background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
              box-shadow: 0 6px 16px rgba(59, 130, 246, 0.5), 0 0 0 4px rgba(255, 255, 255, 0.9);
              transform: rotate(-45deg) scale(1.1);
            }
            .custom-map-marker:hover .marker-label {
              background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 1) 100%);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(59, 130, 246, 0.4);
            }
          `;
          if (!document.querySelector('#map-marker-styles')) {
            style.id = 'map-marker-styles';
            document.head.appendChild(style);
          }

          // Use OverlayView for custom HTML marker
          class CustomMarker extends google.maps.OverlayView {
            position: google.maps.LatLng;
            div: HTMLElement | null;

            constructor(position: google.maps.LatLng, map: google.maps.Map) {
              super();
              this.position = position;
              this.div = null;
              this.setMap(map);
            }

            onAdd() {
              this.div = markerDiv;
              const panes = this.getPanes();
              panes?.overlayMouseTarget.appendChild(this.div);

              // Add click listener
              this.div.addEventListener('click', () => {
                infoWindow.setPosition(this.position);
                infoWindow.open(map);
              });
            }

            draw() {
              if (this.div) {
                const point = this.getProjection().fromLatLngToDivPixel(this.position);
                if (point) {
                  this.div.style.left = point.x + 'px';
                  this.div.style.top = point.y + 'px';
                  this.div.style.position = 'absolute';
                }
              }
            }

            onRemove() {
              if (this.div) {
                this.div.parentNode?.removeChild(this.div);
                this.div = null;
              }
            }
          }

          // Create info window with enhanced styling
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 12px; font-family: system-ui, -apple-system, sans-serif; min-width: 200px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <div style="width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 14px; box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);">
                    ${index + 1}
                  </div>
                  <h3 style="margin: 0; font-size: 15px; font-weight: 800; color: #0f172a;">
                    ${place.place_name}
                  </h3>
                </div>
                <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                  📍 ${place.address}
                </p>
              </div>
            `,
          });

          new CustomMarker(new google.maps.LatLng(position.lat, position.lng), map);

          bounds.extend(position);
        });

        // Draw polyline connecting the places
        if (places.length > 1) {
          const path = places.map(place => ({
            lat: parseFloat(place.lat),
            lng: parseFloat(place.long),
          }));

          new google.maps.Polyline({
            path,
            geodesic: true,
            strokeColor: "#3b82f6",
            strokeOpacity: 0.8,
            strokeWeight: 3,
            map,
          });
        }

        // Fit map to show all markers
        map.fitBounds(bounds);

        // Add some padding
        const padding = { top: 50, right: 50, bottom: 50, left: 50 };
        map.fitBounds(bounds, padding);

      } catch (err) {
        console.error("Error initializing map:", err);
        setError("Failed to initialize map");
      }
    };

    loadGoogleMaps();
  }, [places]);

  if (error) {
    return (
      <div className="trip-map-error">
        <div className="error-icon">🗺️</div>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <>
      <div ref={mapRef} className="trip-map-container" />
      <style jsx>{`
        .trip-map-container {
          width: 100%;
          height: 100%;
          border-radius: 12px;
          overflow: hidden;
        }

        .trip-map-error {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.02) 100%);
          border: 2px dashed rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          color: #dc2626;
          font-size: 13px;
          padding: 20px;
          text-align: center;
        }

        .error-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }
      `}</style>
    </>
  );
}

declare global {
  interface Window {
    google: any;
  }
}
