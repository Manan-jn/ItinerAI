"use client";

import { useState } from "react";

interface FlightInfo {
  id: string;
  airline: string;
  airlineCode: string;
  departure: {
    time: string;
    airport: string;
    code: string;
  };
  arrival: {
    time: string;
    airport: string;
    code: string;
  };
  duration: string;
  stops: string;
  emissions: {
    amount: number;
    reduction?: number;
  };
  price: number;
  aircraft: string;
  flightNumber: string;
  logo: string;
}

interface TrainInfo {
  id: string;
  trainName: string;
  trainNumber: string;
  departure: {
    time: string;
    station: string;
    code: string;
  };
  arrival: {
    time: string;
    station: string;
    code: string;
  };
  duration: string;
  class: string;
  price: number;
  availability: string;
  logo: string;
}

interface BusInfo {
  id: string;
  operator: string;
  busType: string;
  departure: {
    time: string;
    terminal: string;
  };
  arrival: {
    time: string;
    terminal: string;
  };
  duration: string;
  amenities: string[];
  price: number;
  seatsAvailable: number;
  logo: string;
}

interface ConveyanceWidgetProps {
  isVisible: boolean;
  onToggle: () => void;
  rightPanelCollapsed?: boolean;
}

// Transportation data in JSON format for easy updates
const transportationData = {
  flights: [
    {
      id: "1",
      airline: "Akasa Air",
      airlineCode: "QP",
      departure: {
        time: "5:00 AM",
        airport: "Kempegowda International Airport Bengaluru",
        code: "BLR",
      },
      arrival: {
        time: "7:55 AM",
        airport: "Indira Gandhi International Airport",
        code: "DEL",
      },
      duration: "2 hr 55 min",
      stops: "Nonstop",
      emissions: {
        amount: 121,
        reduction: 14,
      },
      price: 6599,
      aircraft: "Boeing 737MAX 8 Passenger",
      flightNumber: "QP 1359",
      logo: "🛩️",
    },
    {
      id: "2",
      airline: "Air India Express",
      airlineCode: "IX",
      departure: {
        time: "7:05 PM",
        airport: "Bengaluru",
        code: "BLR",
      },
      arrival: {
        time: "9:55 PM",
        airport: "Delhi",
        code: "DEL",
      },
      duration: "2 hr 50 min",
      stops: "Nonstop",
      emissions: {
        amount: 160,
      },
      price: 7034,
      aircraft: "Boeing 737",
      flightNumber: "IX 1234",
      logo: "✈️",
    },
    {
      id: "3",
      airline: "IndiGo",
      airlineCode: "6E",
      departure: {
        time: "1:00 PM",
        airport: "Bengaluru",
        code: "BLR",
      },
      arrival: {
        time: "3:55 PM",
        airport: "Delhi",
        code: "DEL",
      },
      duration: "2 hr 55 min",
      stops: "Nonstop",
      emissions: {
        amount: 118,
        reduction: 16,
      },
      price: 7140,
      aircraft: "Airbus A320",
      flightNumber: "6E 5678",
      logo: "🛫",
    },
    {
      id: "4",
      airline: "SpiceJet",
      airlineCode: "SG",
      departure: {
        time: "4:25 PM",
        airport: "Bengaluru",
        code: "BLR",
      },
      arrival: {
        time: "7:20 PM",
        airport: "Delhi",
        code: "DEL",
      },
      duration: "2 hr 55 min",
      stops: "Nonstop",
      emissions: {
        amount: 0,
      },
      price: 7180,
      aircraft: "Boeing 737",
      flightNumber: "SG 9012",
      logo: "🚁",
    },
  ],
  trains: [
    {
      id: "1",
      trainName: "Rajdhani Express",
      trainNumber: "12429",
      departure: {
        time: "8:20 PM",
        station: "Bengaluru City Junction",
        code: "SBC",
      },
      arrival: {
        time: "6:00 AM+1",
        station: "New Delhi Railway Station",
        code: "NDLS",
      },
      duration: "33 hr 40 min",
      class: "3A",
      price: 3245,
      availability: "Available",
      logo: "🚄",
    },
    {
      id: "2",
      trainName: "Karnataka Express",
      trainNumber: "12628",
      departure: {
        time: "9:40 PM",
        station: "Bengaluru City Junction",
        code: "SBC",
      },
      arrival: {
        time: "7:15 AM+2",
        station: "New Delhi Railway Station",
        code: "NDLS",
      },
      duration: "33 hr 35 min",
      class: "2A",
      price: 4890,
      availability: "Waiting List 12",
      logo: "🚆",
    },
    {
      id: "3",
      trainName: "Sampark Kranti Express",
      trainNumber: "12649",
      departure: {
        time: "1:00 AM",
        station: "Yesvantpur Junction",
        code: "YPR",
      },
      arrival: {
        time: "6:30 AM+1",
        station: "Hazrat Nizamuddin",
        code: "NZM",
      },
      duration: "29 hr 30 min",
      class: "3A",
      price: 3180,
      availability: "Available",
      logo: "🚝",
    },
  ],
  buses: [
    {
      id: "1",
      operator: "VRL Travels",
      busType: "Volvo Multi-Axle A/C Sleeper",
      departure: {
        time: "9:30 PM",
        terminal: "Majestic Bus Stand",
      },
      arrival: {
        time: "11:00 AM+1",
        terminal: "Kashmere Gate ISBT",
      },
      duration: "13 hr 30 min",
      amenities: ["WiFi", "Charging Point", "Water Bottle", "Blanket"],
      price: 1850,
      seatsAvailable: 8,
      logo: "🚌",
    },
    {
      id: "2",
      operator: "SRS Travels",
      busType: "Scania Multi-Axle A/C Sleeper",
      departure: {
        time: "8:45 PM",
        terminal: "Electronic City",
      },
      arrival: {
        time: "10:15 AM+1",
        terminal: "Anand Vihar ISBT",
      },
      duration: "13 hr 30 min",
      amenities: ["WiFi", "Charging Point", "Snacks", "Reading Light"],
      price: 1950,
      seatsAvailable: 12,
      logo: "🚐",
    },
    {
      id: "3",
      operator: "Kallada Travels",
      busType: "Volvo Multi-Axle A/C Sleeper",
      departure: {
        time: "10:00 PM",
        terminal: "Shantinagar Bus Stand",
      },
      arrival: {
        time: "12:30 PM+1",
        terminal: "Majnu Ka Tilla",
      },
      duration: "14 hr 30 min",
      amenities: ["WiFi", "Charging Point", "Water Bottle", "Pillow"],
      price: 1750,
      seatsAvailable: 5,
      logo: "🚍",
    },
  ],
};

export default function ConveyanceWidget({
  isVisible,
  onToggle,
  rightPanelCollapsed = false,
}: ConveyanceWidgetProps) {
  const [activeTransportModes, setActiveTransportModes] = useState<string[]>([
    "flights",
  ]);
  const [activeFlightType, setActiveFlightType] = useState<string>("best");
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  const [selectedTrain, setSelectedTrain] = useState<string | null>(null);
  const [selectedBus, setSelectedBus] = useState<string | null>(null);

  if (!isVisible) return null;

  const transportModes = [
    { id: "flights", name: "Flights", icon: "✈️" },
    { id: "trains", name: "Trains", icon: "🚄" },
    { id: "buses", name: "Buses", icon: "🚌" },
  ];

  const flightTypes = [
    {
      id: "best",
      name: "Best",
      description: "Ranked based on price and convenience",
    },
    { id: "cheapest", name: "Cheapest", description: "from ₹5,778" },
  ];

  const handleTransportModeToggle = (modeId: string) => {
    setActiveTransportModes((prev) => {
      if (prev.includes(modeId)) {
        // Remove mode if it exists (but keep at least one mode active)
        return prev.length > 1 ? prev.filter((id) => id !== modeId) : prev;
      } else {
        // Add mode if it doesn't exist
        return [...prev, modeId];
      }
    });
  };

  const handleFlightSelect = (flightId: string) => {
    setSelectedFlight(flightId);
  };

  const handleTrainSelect = (trainId: string) => {
    setSelectedTrain(trainId);
  };

  const handleBusSelect = (busId: string) => {
    setSelectedBus(busId);
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString()}`;
  };

  const getTabWidth = () => {
    const numActiveTabs = activeTransportModes.length;
    return `${100 / numActiveTabs}%`;
  };

  return (
    <div className="conveyance-widget">
      <div className="conveyance-header">
        <div className="header-content">
          <h3>Book Your Journey</h3>
        </div>
        <button
          onClick={onToggle}
          className="toggle-btn"
          aria-label="Close conveyance booking"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="conveyance-container">
        {/* Transportation Mode Tabs */}
        <div className="transport-tabs">
          {transportModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleTransportModeToggle(mode.id)}
              className={`transport-tab ${
                activeTransportModes.includes(mode.id) ? "active" : "inactive"
              }`}
            >
              <span className="transport-icon">{mode.icon}</span>
              <span className="transport-name">{mode.name}</span>
              <div className="tab-indicator"></div>
            </button>
          ))}
        </div>

        {/* Content Area with Multiple Tabs */}
        <div className="transport-content-container">
          {activeTransportModes.map((modeId) => (
            <div
              key={modeId}
              className="transport-content-tab"
              style={{ width: getTabWidth() }}
            >
              {modeId === "flights" && (
                <div className="flight-content">
                  {/* Flight Type Toggle */}
                  <div className="flight-type-toggle">
                    {flightTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setActiveFlightType(type.id)}
                        className={`flight-type-btn ${
                          activeFlightType === type.id ? "active" : ""
                        }`}
                      >
                        <div className="flight-type-header">
                          <span className="flight-type-name">{type.name}</span>
                          {type.id === "cheapest" && (
                            <span className="flight-type-price">
                              from ₹5,778
                            </span>
                          )}
                        </div>
                        {type.description && type.id === "best" && (
                          <span className="flight-type-desc">
                            {type.description}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Top Flights Header */}
                  <div className="flights-header">
                    <h4>Top flights</h4>
                    <div className="flights-info">
                      <span>Ranked based on price and convenience</span>
                      <div className="sort-info">
                        <span>Sorted by top flights</span>
                        <svg
                          className="sort-icon"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M7 13l3 3 7-7" />
                          <path d="M7 6l3 3 7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Flight Listings */}
                  <div className="flight-listings">
                    {transportationData.flights.map((flight) => (
                      <div
                        key={flight.id}
                        className={`flight-card ${
                          selectedFlight === flight.id ? "selected" : ""
                        }`}
                        onClick={() => handleFlightSelect(flight.id)}
                      >
                        <div className="flight-main-info">
                          <div className="airline-info">
                            <div className="airline-logo">{flight.logo}</div>
                            <div className="flight-route">
                              <div className="departure-info">
                                <span className="time">
                                  {flight.departure.time}
                                </span>
                                <span className="airport">
                                  {flight.departure.code}
                                </span>
                              </div>
                              <div className="flight-duration">
                                <div className="duration-line">
                                  <div className="duration-dot start"></div>
                                  <div className="duration-bar"></div>
                                  <div className="duration-dot end"></div>
                                </div>
                                <span className="duration-text">
                                  {flight.duration}
                                </span>
                              </div>
                              <div className="arrival-info">
                                <span className="time">
                                  {flight.arrival.time}
                                </span>
                                <span className="airport">
                                  {flight.arrival.code}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flight-details">
                            <div className="stops-info">
                              <span className="stops">{flight.stops}</span>
                            </div>
                            <div className="emissions-info">
                              <span className="emissions">
                                {flight.emissions.amount} kg CO2e
                              </span>
                              {flight.emissions.reduction && (
                                <span className="emissions-reduction">
                                  -{flight.emissions.reduction}% emissions
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flight-price">
                            <span className="price">
                              {formatPrice(flight.price)}
                            </span>
                            <button className="select-flight-btn">
                              Select flight
                            </button>
                          </div>
                        </div>

                        <div className="flight-additional-info">
                          <span className="airline-name">{flight.airline}</span>
                          <span className="aircraft">{flight.aircraft}</span>
                          <span className="flight-number">
                            {flight.flightNumber}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {modeId === "trains" && (
                <div className="train-content">
                  <div className="trains-header">
                    <h4>Available Trains</h4>
                    <div className="trains-info">
                      <span>Bengaluru to Delhi trains</span>
                    </div>
                  </div>

                  <div className="train-listings">
                    {transportationData.trains.map((train) => (
                      <div
                        key={train.id}
                        className={`train-card ${
                          selectedTrain === train.id ? "selected" : ""
                        }`}
                        onClick={() => handleTrainSelect(train.id)}
                      >
                        <div className="train-main-info">
                          <div className="train-info">
                            <div className="train-logo">{train.logo}</div>
                            <div className="train-route">
                              <div className="departure-info">
                                <span className="time">
                                  {train.departure.time}
                                </span>
                                <span className="station">
                                  {train.departure.code}
                                </span>
                              </div>
                              <div className="train-duration">
                                <div className="duration-line">
                                  <div className="duration-dot start"></div>
                                  <div className="duration-bar"></div>
                                  <div className="duration-dot end"></div>
                                </div>
                                <span className="duration-text">
                                  {train.duration}
                                </span>
                              </div>
                              <div className="arrival-info">
                                <span className="time">
                                  {train.arrival.time}
                                </span>
                                <span className="station">
                                  {train.arrival.code}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="train-details">
                            <div className="class-info">
                              <span className="class">{train.class}</span>
                            </div>
                            <div className="availability-info">
                              <span
                                className={`availability ${
                                  train.availability.includes("Available")
                                    ? "available"
                                    : "waiting"
                                }`}
                              >
                                {train.availability}
                              </span>
                            </div>
                          </div>

                          <div className="train-price">
                            <span className="price">
                              {formatPrice(train.price)}
                            </span>
                            <button className="select-train-btn">
                                Select
                            </button>
                          </div>
                        </div>

                        <div className="train-additional-info">
                          <span className="train-name">{train.trainName}</span>
                          <span className="train-number">
                            {train.trainNumber}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {modeId === "buses" && (
                <div className="bus-content">
                  <div className="buses-header">
                    <h4>Available Buses</h4>
                    <div className="buses-info">
                      <span>Bengaluru to Delhi buses</span>
                    </div>
                  </div>

                  <div className="bus-listings">
                    {transportationData.buses.map((bus) => (
                      <div
                        key={bus.id}
                        className={`bus-card ${
                          selectedBus === bus.id ? "selected" : ""
                        }`}
                        onClick={() => handleBusSelect(bus.id)}
                      >
                        <div className="bus-main-info">
                          <div className="bus-info">
                            <div className="bus-logo">{bus.logo}</div>
                            <div className="bus-route">
                              <div className="departure-info">
                                <span className="time">
                                  {bus.departure.time}
                                </span>
                                <span className="terminal">
                                  {bus.departure.terminal}
                                </span>
                              </div>
                              <div className="bus-duration">
                                <div className="duration-line">
                                  <div className="duration-dot start"></div>
                                  <div className="duration-bar"></div>
                                  <div className="duration-dot end"></div>
                                </div>
                                <span className="duration-text">
                                  {bus.duration}
                                </span>
                              </div>
                              <div className="arrival-info">
                                <span className="time">{bus.arrival.time}</span>
                                <span className="terminal">
                                  {bus.arrival.terminal}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="bus-details">
                            <div className="bus-type-info">
                              <span className="bus-type">{bus.busType}</span>
                            </div>
                            <div className="seats-info">
                              <span
                                className={`seats ${
                                  bus.seatsAvailable < 10
                                    ? "limited"
                                    : "available"
                                }`}
                              >
                                {bus.seatsAvailable} seats left
                              </span>
                            </div>
                            <div className="amenities-info">
                              <div className="amenities">
                                {bus.amenities
                                  .slice(0, 2)
                                  .map((amenity, index) => (
                                    <span key={index} className="amenity">
                                      {amenity}
                                    </span>
                                  ))}
                                {bus.amenities.length > 2 && (
                                  <span className="more-amenities">
                                    +{bus.amenities.length - 2} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="bus-price">
                            <span className="price">
                              {formatPrice(bus.price)}
                            </span>
                            <button className="select-bus-btn">Select</button>
                          </div>
                        </div>

                        <div className="bus-additional-info">
                          <span className="operator-name">{bus.operator}</span>
                          <span className="bus-type-full">{bus.busType}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .conveyance-widget {
          background: transparent;
          backdrop-filter: none;
          border-radius: 12px;
          padding: 16px;
          margin: 0 auto;
          width: 100%;
          max-width: ${rightPanelCollapsed
            ? "calc(100vw - 100px)"
            : "calc(100vw - 400px)"};
          height: 100%;
          border: none;
          box-shadow: none;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }

        .conveyance-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          padding: 0 8px;
        }

        .header-content h3 {
          color: #fff59d;
          font-size: 1.1rem;
          margin: 0;
          font-weight: 500;
          background: linear-gradient(135deg, #fff59d, #ffcc02);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .toggle-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          padding: 8px;
          border-radius: 10px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(10px);
        }

        .toggle-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          color: white;
          border-color: rgba(255, 255, 255, 0.3);
          transform: scale(1.05);
        }

        .conveyance-container {
          flex: 1;
          min-height: 480px;
          max-height: 520px;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          margin: 0 8px;
          background: rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .transport-tabs {
          display: flex;
          background: rgba(0, 0, 0, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          position: relative;
        }

        .transport-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 12px 8px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border-bottom: 2px solid transparent;
          position: relative;
          overflow: hidden;
        }

        .transport-tab::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            135deg,
            rgba(96, 165, 250, 0.1),
            rgba(59, 130, 246, 0.05)
          );
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .transport-tab:hover::before {
          opacity: 1;
        }

        .transport-tab:hover {
          color: rgba(255, 255, 255, 0.9);
          transform: translateY(-1px);
        }

        .transport-tab.active {
          color: #60a5fa;
          border-bottom-color: #60a5fa;
          background: rgba(96, 165, 250, 0.08);
          box-shadow: inset 0 -2px 0 #60a5fa, 0 2px 8px rgba(96, 165, 250, 0.2);
        }

        .transport-tab.active::before {
          opacity: 1;
        }

        .transport-tab.inactive {
          opacity: 0.7;
        }

        .transport-tab.inactive:hover {
          opacity: 1;
        }

        .tab-indicator {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #60a5fa, #3b82f6);
          transition: width 0.3s ease;
        }

        .transport-tab.active .tab-indicator {
          width: 60%;
        }

        .transport-icon {
          font-size: 1rem;
        }

        .transport-name {
          font-size: 0.8rem;
          font-weight: 400;
        }

        .transport-content-container {
          display: flex;
          height: calc(100% - 50px);
          overflow: hidden;
          position: relative;
        }

        .transport-content-tab {
          flex-shrink: 0;
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          min-width: 0;
          position: relative;
          container-type: inline-size;
        }

        .transport-content-tab:last-child {
          border-right: none;
        }

        /* Adaptive sizing based on number of active tabs */
        .transport-content-container:has(
            .transport-content-tab:nth-child(1):last-child
          )
          .transport-content-tab {
          width: 100%;
        }

        .transport-content-container:has(
            .transport-content-tab:nth-child(2):last-child
          )
          .transport-content-tab {
          width: 50%;
        }

        .transport-content-container:has(
            .transport-content-tab:nth-child(3):last-child
          )
          .transport-content-tab {
          width: 33.333%;
        }

        .transport-content {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .flight-content,
        .train-content,
        .bus-content {
          padding: 12px;
          padding-bottom: 16px;
          height: 100%;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .flight-type-toggle {
          display: flex;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
          padding: 3px;
          gap: 3px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .flight-type-btn {
          flex: 1;
          padding: 10px 14px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: left;
          position: relative;
          overflow: hidden;
        }

        .flight-type-btn::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            135deg,
            rgba(96, 165, 250, 0.1),
            rgba(59, 130, 246, 0.05)
          );
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .flight-type-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.85);
        }

        .flight-type-btn:hover::before {
          opacity: 1;
        }

        .flight-type-btn.active {
          background: linear-gradient(
            135deg,
            rgba(96, 165, 250, 0.2) 0%,
            rgba(59, 130, 246, 0.15) 100%
          );
          color: #60a5fa;
          box-shadow: 0 2px 8px rgba(96, 165, 250, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(96, 165, 250, 0.3);
        }

        .flight-type-btn.active::before {
          opacity: 1;
        }

        .flight-type-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3px;
          position: relative;
          z-index: 1;
        }

        .flight-type-name {
          font-size: 0.85rem;
          font-weight: 600;
        }

        .flight-type-price {
          font-size: 0.75rem;
          color: #10b981;
          font-weight: 600;
          background: rgba(16, 185, 129, 0.1);
          padding: 2px 6px;
          border-radius: 8px;
        }

        .flight-type-desc {
          font-size: 0.7rem;
          opacity: 0.75;
          position: relative;
          z-index: 1;
        }

        .flights-header,
        .trains-header,
        .buses-header {
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 12px;
          background: linear-gradient(
            135deg,
            rgba(96, 165, 250, 0.05) 0%,
            transparent 100%
          );
          padding: 12px;
          margin: -12px -12px 12px -12px;
          border-radius: 8px 8px 0 0;
        }

        .flights-header h4,
        .trains-header h4,
        .buses-header h4 {
          color: white;
          font-size: 0.95rem;
          font-weight: 600;
          margin: 0 0 6px 0;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .flights-info,
        .trains-info,
        .buses-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 500;
        }

        .sort-info {
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .sort-icon {
          opacity: 0.5;
          width: 12px;
          height: 12px;
        }

        .flight-listings,
        .train-listings,
        .bus-listings {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
          overflow-y: auto;
          padding-right: 6px;
          padding-bottom: 8px;
          min-height: 0;
        }

        .flight-card,
        .train-card,
        .bus-card {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.03) 0%,
            rgba(255, 255, 255, 0.01) 100%
          );
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 14px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(10px);
          flex-shrink: 0;
        }

        .flight-card::before,
        .train-card::before,
        .bus-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            135deg,
            rgba(96, 165, 250, 0.05) 0%,
            rgba(139, 92, 246, 0.03) 100%
          );
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .flight-card:hover,
        .train-card:hover,
        .bus-card:hover {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.06) 0%,
            rgba(255, 255, 255, 0.03) 100%
          );
          border-color: rgba(96, 165, 250, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(96, 165, 250, 0.1);
        }

        .flight-card:hover::before,
        .train-card:hover::before,
        .bus-card:hover::before {
          opacity: 1;
        }

        .flight-card.selected,
        .train-card.selected,
        .bus-card.selected {
          border-color: rgba(96, 165, 250, 0.5);
          background: linear-gradient(
            135deg,
            rgba(96, 165, 250, 0.1) 0%,
            rgba(59, 130, 246, 0.05) 100%
          );
          box-shadow: 0 4px 16px rgba(96, 165, 250, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .flight-card.selected::before,
        .train-card.selected::before,
        .bus-card.selected::before {
          opacity: 1;
        }

        .flight-main-info,
        .train-main-info,
        .bus-main-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
          gap: 8px;
          position: relative;
          z-index: 1;
          flex-wrap: wrap;
        }

        .airline-info,
        .train-info,
        .bus-info {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
        }

        .airline-logo,
        .train-logo,
        .bus-logo {
          font-size: 1.3rem;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(
            135deg,
            rgba(96, 165, 250, 0.15) 0%,
            rgba(59, 130, 246, 0.08) 100%
          );
          border-radius: 10px;
          border: 1px solid rgba(96, 165, 250, 0.2);
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(96, 165, 250, 0.1);
        }

        .flight-route,
        .train-route,
        .bus-route {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        .departure-info,
        .arrival-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .time {
          font-size: 0.9rem;
          font-weight: 600;
          color: white;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .airport,
        .station,
        .terminal {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.65);
          font-weight: 500;
        }

        .flight-duration,
        .train-duration,
        .bus-duration {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          flex: 1;
          min-width: 0;
        }

        .duration-line {
          display: flex;
          align-items: center;
          width: 100%;
          position: relative;
        }

        .duration-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: linear-gradient(135deg, #60a5fa, #3b82f6);
          box-shadow: 0 0 8px rgba(96, 165, 250, 0.5);
          flex-shrink: 0;
        }

        .duration-bar {
          flex: 1;
          height: 2px;
          background: linear-gradient(
            90deg,
            #60a5fa 0%,
            rgba(96, 165, 250, 0.5) 50%,
            rgba(96, 165, 250, 0.2) 100%
          );
          margin: 0 6px;
          border-radius: 1px;
          position: relative;
          overflow: hidden;
        }

        .duration-bar::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 100%
          );
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .duration-text {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
          white-space: nowrap;
        }

        .flight-details,
        .train-details,
        .bus-details {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin: 0 10px;
          align-items: flex-start;
          min-width: 0;
        }

        .stops,
        .class,
        .bus-type {
          font-size: 0.7rem;
          color: #10b981;
          font-weight: 500;
          background: rgba(16, 185, 129, 0.1);
          padding: 3px 8px;
          border-radius: 12px;
          border: 1px solid rgba(16, 185, 129, 0.2);
          white-space: nowrap;
        }

        .emissions {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.65);
          font-weight: 500;
        }

        .emissions-reduction {
          font-size: 0.65rem;
          color: #10b981;
          margin-left: 6px;
          background: rgba(16, 185, 129, 0.1);
          padding: 2px 6px;
          border-radius: 10px;
          border: 1px solid rgba(16, 185, 129, 0.15);
        }

        .availability.available,
        .seats.available {
          color: #10b981;
          font-size: 0.7rem;
          font-weight: 500;
          background: rgba(16, 185, 129, 0.1);
          padding: 3px 8px;
          border-radius: 12px;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .availability.waiting,
        .seats.limited {
          color: #f59e0b;
          font-size: 0.7rem;
          font-weight: 500;
          background: rgba(245, 158, 11, 0.1);
          padding: 3px 8px;
          border-radius: 12px;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }

        .flight-price,
        .train-price,
        .bus-price {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
          flex-shrink: 0;
        }

        .price {
          font-size: 1.1rem;
          font-weight: 700;
          color: white;
          background: linear-gradient(135deg, #fff, #e0e0e0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .select-flight-btn,
        .select-train-btn,
        .select-bus-btn {
          background: linear-gradient(
            135deg,
            rgba(96, 165, 250, 0.25) 0%,
            rgba(59, 130, 246, 0.2) 100%
          );
          color: #60a5fa;
          border: 1px solid rgba(96, 165, 250, 0.4);
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(96, 165, 250, 0.15);
          white-space: nowrap;
        }

        .select-flight-btn:hover,
        .select-train-btn:hover,
        .select-bus-btn:hover {
          background: linear-gradient(
            135deg,
            rgba(96, 165, 250, 0.35) 0%,
            rgba(59, 130, 246, 0.3) 100%
          );
          border-color: rgba(96, 165, 250, 0.6);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(96, 165, 250, 0.3);
          color: #93c5fd;
        }

        .select-flight-btn:active,
        .select-train-btn:active,
        .select-bus-btn:active {
          transform: translateY(0);
          box-shadow: 0 2px 4px rgba(96, 165, 250, 0.2);
        }

        .flight-additional-info,
        .train-additional-info,
        .bus-additional-info {
          display: flex;
          gap: 12px;
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.5);
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          position: relative;
          z-index: 1;
          flex-wrap: wrap;
        }

        .airline-name,
        .train-name,
        .operator-name {
          font-weight: 500;
          color: rgba(255, 255, 255, 0.6);
        }

        .aircraft,
        .train-number,
        .bus-type-full,
        .flight-number {
          color: rgba(255, 255, 255, 0.45);
        }

        /* Bus-specific styles */
        .amenities {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .amenity {
          font-size: 0.65rem;
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
          padding: 3px 8px;
          border-radius: 12px;
          border: 1px solid rgba(16, 185, 129, 0.25);
          font-weight: 500;
          white-space: nowrap;
        }

        .more-amenities {
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 500;
        }

        .transport-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 32px;
        }

        .placeholder-content {
          text-align: center;
          color: rgba(255, 255, 255, 0.6);
        }

        .placeholder-icon {
          font-size: 2rem;
          margin-bottom: 12px;
          display: block;
          opacity: 0.7;
        }

        .placeholder-content h4 {
          font-size: 0.9rem;
          margin: 0 0 6px 0;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
        }

        .placeholder-content p {
          font-size: 0.75rem;
          margin: 0;
          opacity: 0.6;
        }

        /* Scrollbar Styling */
        .flight-content::-webkit-scrollbar,
        .train-content::-webkit-scrollbar,
        .bus-content::-webkit-scrollbar,
        .flight-listings::-webkit-scrollbar,
        .train-listings::-webkit-scrollbar,
        .bus-listings::-webkit-scrollbar {
          width: 4px;
        }

        .flight-content::-webkit-scrollbar-track,
        .train-content::-webkit-scrollbar-track,
        .bus-content::-webkit-scrollbar-track,
        .flight-listings::-webkit-scrollbar-track,
        .train-listings::-webkit-scrollbar-track,
        .bus-listings::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
        }

        .flight-content::-webkit-scrollbar-thumb,
        .train-content::-webkit-scrollbar-thumb,
        .bus-content::-webkit-scrollbar-thumb,
        .flight-listings::-webkit-scrollbar-thumb,
        .train-listings::-webkit-scrollbar-thumb,
        .bus-listings::-webkit-scrollbar-thumb {
          background: rgba(255, 245, 157, 0.3);
          border-radius: 2px;
        }

        .flight-content::-webkit-scrollbar-thumb:hover,
        .train-content::-webkit-scrollbar-thumb:hover,
        .bus-content::-webkit-scrollbar-thumb:hover,
        .flight-listings::-webkit-scrollbar-thumb:hover,
        .train-listings::-webkit-scrollbar-thumb:hover,
        .bus-listings::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 245, 157, 0.5);
        }

        /* Container queries for narrow tabs */
        @container (max-width: 500px) {
          .flight-card,
          .train-card,
          .bus-card {
            padding: 10px;
          }

          .airline-logo,
          .train-logo,
          .bus-logo {
            width: 32px;
            height: 32px;
            font-size: 1rem;
          }

          .flight-route,
          .train-route,
          .bus-route {
            gap: 6px;
          }

          .time {
            font-size: 0.8rem;
          }

          .airport,
          .station,
          .terminal {
            font-size: 0.65rem;
          }

          .duration-text {
            font-size: 0.65rem;
          }

          .flight-details,
          .train-details,
          .bus-details {
            margin: 0 4px;
            gap: 4px;
          }

          .stops,
          .class,
          .bus-type {
            font-size: 0.65rem;
            padding: 2px 6px;
          }

          .emissions {
            font-size: 0.65rem;
          }

          .price {
            font-size: 0.95rem;
          }

          .select-flight-btn,
          .select-train-btn,
          .select-bus-btn {
            padding: 6px 10px;
            font-size: 0.7rem;
          }

          .flight-additional-info,
          .train-additional-info,
          .bus-additional-info {
            font-size: 0.65rem;
            gap: 8px;
          }

          .amenity {
            font-size: 0.6rem;
            padding: 2px 6px;
          }
        }

        @container (max-width: 350px) {
          .flight-main-info,
          .train-main-info,
          .bus-main-info {
            flex-wrap: wrap;
          }

          .airline-info,
          .train-info,
          .bus-info {
            flex: 1 1 100%;
          }

          .flight-details,
          .train-details,
          .bus-details {
            flex: 1 1 auto;
            flex-direction: row;
            gap: 8px;
            margin: 4px 0;
          }

          .flight-price,
          .train-price,
          .bus-price {
            flex-direction: row;
            justify-content: space-between;
            flex: 1 1 100%;
            width: 100%;
          }
        }

        /* Adaptive styles for smaller widths when multiple tabs open */
        @media (max-width: 1200px) {
          .airline-logo,
          .train-logo,
          .bus-logo {
            width: 36px;
            height: 36px;
            font-size: 1.1rem;
          }

          .time {
            font-size: 0.85rem;
          }

          .flight-route,
          .train-route,
          .bus-route {
            gap: 8px;
          }

          .flight-details,
          .train-details,
          .bus-details {
            margin: 0 6px;
          }

          .price {
            font-size: 1rem;
          }

          .select-flight-btn,
          .select-train-btn,
          .select-bus-btn {
            padding: 6px 12px;
            font-size: 0.7rem;
          }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .conveyance-widget {
            padding: 10px;
            max-width: calc(100vw - 32px);
          }

          .conveyance-container {
            min-height: 360px;
            max-height: 400px;
            margin: 0 4px;
          }

          .transport-content-container {
            flex-direction: column;
            height: calc(100% - 50px);
          }

          .transport-content-tab {
            border-right: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            width: 100% !important;
            height: auto;
            flex: 1;
          }

          .transport-content-tab:last-child {
            border-bottom: none;
          }

          .flight-route,
          .train-route,
          .bus-route {
            gap: 8px;
          }

          .flight-main-info,
          .train-main-info,
          .bus-main-info {
            flex-wrap: wrap;
          }

          .airline-info,
          .train-info,
          .bus-info {
            flex: 1 1 100%;
            min-width: 100%;
          }

          .flight-details,
          .train-details,
          .bus-details {
            flex: 1 1 auto;
            margin: 8px 0;
          }

          .flight-price,
          .train-price,
          .bus-price {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            flex: 1 1 100%;
            width: 100%;
          }

          .transport-tab {
            padding: 10px 6px;
          }

          .transport-name {
            font-size: 0.75rem;
          }

          .airline-logo,
          .train-logo,
          .bus-logo {
            width: 32px;
            height: 32px;
            font-size: 1rem;
          }
        }

        @media (max-width: 480px) {
          .conveyance-widget {
            padding: 8px;
            max-width: calc(100vw - 20px);
          }

          .transport-content-container {
            flex-direction: column;
          }

          .transport-content-tab {
            width: 100% !important;
            height: auto;
            flex: 1;
          }

          .transport-tab {
            padding: 8px 4px;
            flex-direction: column;
            gap: 2px;
          }

          .transport-icon {
            font-size: 0.9rem;
          }

          .transport-name {
            font-size: 0.7rem;
          }

          .flight-content {
            padding: 12px;
          }

          .flight-card {
            padding: 10px;
          }

          .airline-logo {
            width: 28px;
            height: 28px;
            font-size: 1rem;
          }

          .time {
            font-size: 0.8rem;
          }

          .price {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}
