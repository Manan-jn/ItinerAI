import React from "react";
import { User } from "firebase/auth";
import { FiChevronDown, FiUser, FiCalendar } from "react-icons/fi";
import {
  MdFlight,
  MdHotel,
  MdTrain,
  MdBeachAccess,
  MdLocalTaxi,
  MdCardGiftcard,
} from "react-icons/md";
import { ProfileDropdown } from "./ProfileDropdown";
import { TripTypeButton, SpecialFareCheckbox, QuickLink } from "./UIComponents";

interface FlightsContentProps {
  currentUser: User;
  showProfileDropdown: boolean;
  setShowProfileDropdown: (show: boolean) => void;
  onSettings: () => void;
  onLogout: () => void;
  tripType: "oneWay" | "roundTrip" | "multicity";
  setTripType: (type: "oneWay" | "roundTrip" | "multicity") => void;
  travellers: number;
  travelClass: string;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export function FlightsContent({
  currentUser,
  showProfileDropdown,
  setShowProfileDropdown,
  onSettings,
  onLogout,
  tripType,
  setTripType,
  travellers,
  travelClass,
  isSidebarCollapsed = false,
  onToggleSidebar,
}: FlightsContentProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Top Navigation Bar - Fixed */}
      <nav className="bg-white border-b border-gray-200 flex-shrink-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Side - Hamburger Menu */}
            <div>
              {/* Hamburger Menu Button */}
              {onToggleSidebar && (
                <button
                  onClick={onToggleSidebar}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-300 group"
                  title={isSidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
                >
                  <svg
                    className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Right Side - User Profile */}
            <div className="flex items-center space-x-3 ml-auto">
              <ProfileDropdown
                currentUser={currentUser}
                showProfileDropdown={showProfileDropdown}
                setShowProfileDropdown={setShowProfileDropdown}
                onSettings={onSettings}
                onLogout={onLogout}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Search Section */}
        <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Trip Type Selector */}
            <div className="flex items-center space-x-4 mb-6">
              <TripTypeButton
                active={tripType === "oneWay"}
                onClick={() => setTripType("oneWay")}
              >
                One Way
              </TripTypeButton>
              <TripTypeButton
                active={tripType === "roundTrip"}
                onClick={() => setTripType("roundTrip")}
              >
                Round Trip
              </TripTypeButton>
              <TripTypeButton
                active={tripType === "multicity"}
                onClick={() => setTripType("multicity")}
              >
                Multicity
              </TripTypeButton>
            </div>

            {/* Search Lowest Price Header */}
            <div className="text-right mb-3">
              <h2 className="text-white text-xl font-semibold">
                Search Lowest Price
              </h2>
            </div>

            {/* Search Form */}
            <div className="bg-white rounded-lg p-4 shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {/* From */}
                <div className="relative">
                  <label className="block text-[10px] text-gray-500 mb-1 uppercase font-medium">
                    FROM
                  </label>
                  <div className="flex items-center">
                    <MdFlight className="text-gray-400 mr-2" size={16} />
                    <div className="flex-1">
                      <div className="text-lg font-bold text-gray-900">
                        Delhi
                      </div>
                      <div className="text-[10px] text-gray-500">
                        [DEL] Indira Gandhi International Airport
                      </div>
                    </div>
                  </div>
                </div>

                {/* Swap Button */}
                <div className="flex items-center justify-center">
                  <button className="bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors">
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                      />
                    </svg>
                  </button>
                </div>

                {/* To */}
                <div className="relative">
                  <label className="block text-[10px] text-gray-500 mb-1 uppercase font-medium">
                    TO
                  </label>
                  <div className="flex items-center">
                    <MdFlight
                      className="text-gray-400 mr-2 transform rotate-90"
                      size={16}
                    />
                    <div className="flex-1">
                      <div className="text-lg font-bold text-gray-900">
                        Mumbai
                      </div>
                      <div className="text-[10px] text-gray-500">
                        [BOM] Chhatrapati Shivaji International A...
                      </div>
                    </div>
                  </div>
                </div>

                {/* Departure Date */}
                <div className="relative">
                  <label className="block text-[10px] text-gray-500 mb-1 uppercase font-medium">
                    DEPARTURE DATE
                  </label>
                  <div className="flex items-center">
                    <FiCalendar className="text-gray-400 mr-2" size={16} />
                    <div className="flex-1">
                      <div className="text-2xl font-bold text-gray-900">24</div>
                      <div className="text-[10px] text-gray-500">Oct 2025</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">Friday</div>
                </div>

                {/* Return Date */}
                <div className="relative">
                  <label className="block text-[10px] text-gray-500 mb-1 uppercase font-medium">
                    RETURN DATE
                  </label>
                  <div className="flex items-center text-gray-400">
                    <span className="text-xs">Book a round trip</span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    to save more
                  </div>
                </div>
              </div>

              {/* Traveller & Class + Search Button */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <FiUser className="text-gray-500" size={16} />
                    <button className="flex items-center space-x-1 hover:text-blue-600">
                      <span className="font-medium">
                        {travellers} Traveller
                      </span>
                      <FiChevronDown size={14} />
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="flex items-center space-x-1 hover:text-blue-600">
                      <span className="font-medium">{travelClass}</span>
                      <FiChevronDown size={14} />
                    </button>
                  </div>
                </div>

                <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-12 py-3 rounded-md transition-colors">
                  SEARCH
                </button>
              </div>
            </div>

            {/* Special Fares */}
            <div className="mt-4 flex items-center space-x-6">
              <span className="text-white text-sm font-medium">
                Special Fares (Optional):
              </span>
              <div className="flex items-center space-x-6">
                <SpecialFareCheckbox label="Defence Forces" />
                <SpecialFareCheckbox label="Students" />
                <SpecialFareCheckbox label="Senior Citizens" />
                <SpecialFareCheckbox label="Doctors Nurses" />
              </div>
              <div className="flex-1"></div>
              <label className="flex items-center space-x-2 text-white text-sm">
                <input type="checkbox" className="rounded" />
                <span>Book Hotel & Get up to 45% OFF*</span>
              </label>
            </div>

            {/* Discover More Button */}
            <div className="mt-4">
              <button className="bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-5 py-2 rounded-md border border-white/30 transition-colors">
                DISCOVER MORE
              </button>
            </div>
          </div>
        </div>

        {/* Quick Links Section */}
        <div className="bg-white py-6 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between overflow-x-auto">
              <QuickLink
                icon={<MdFlight size={20} />}
                text="Best Flight Deals"
              />
              <QuickLink
                icon={<MdTrain size={20} />}
                text="Metro"
                badge="NEW"
              />
              <QuickLink
                icon={<MdCardGiftcard size={20} />}
                text="Gift Cards"
              />
              <QuickLink
                icon={<MdLocalTaxi size={20} />}
                text="Forex Cash & Cards"
              />
              <QuickLink
                icon={<MdBeachAccess size={20} />}
                text="EMT Airport Experience"
              />
              <QuickLink icon={<MdCardGiftcard size={20} />} text="EMT Cards" />
              <QuickLink icon={<MdHotel size={20} />} text="EasyDarshan" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
