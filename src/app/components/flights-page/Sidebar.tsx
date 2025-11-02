import React from "react";
import {
  MdFlight,
  MdHome,
  MdChat,
  MdExplore,
  MdBook,
  MdPeople,
  MdHotel,
  MdDirectionsBus,
} from "react-icons/md";
import { SidebarButton } from "./UIComponents";

type SectionType =
  | "conveyance"
  | "stays"
  | "dashboard"
  | "chat"
  | "explore"
  | "itinerary"
  | "friends";

interface SidebarProps {
  activeSection: SectionType;
  onSectionChange: (section: SectionType) => void;
  onLogout: () => void;
}

export function Sidebar({
  activeSection,
  onSectionChange,
  onLogout,
}: SidebarProps) {
  return (
    <aside className="w-52 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <MdFlight className="text-blue-500 text-2xl transform rotate-45" />
          <div className="ml-2">
            <div className="text-blue-600 font-bold text-base leading-tight">
              ItinerAI
            </div>
            <div className="text-[8px] text-gray-500 -mt-0.5">
              Your AI Travel Companion
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Header - Clean */}
      <div className="p-4 border-b border-gray-200">
        <div className="h-4"></div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-3">
        <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
          MAIN
        </h4>
        <div className="space-y-1">
          <SidebarButton
            icon={<MdHome className="w-4 h-4" />}
            text="Dashboard"
            active={(activeSection as string) === "dashboard"}
            onClick={() => onSectionChange("dashboard")}
          />
          <SidebarButton
            icon={<MdChat className="w-4 h-4" />}
            text="Chat"
            active={activeSection === "chat"}
            onClick={() => onSectionChange("chat")}
          />
          <SidebarButton
            icon={<MdDirectionsBus className="w-4 h-4" />}
            text="Conveyance"
            active={activeSection === "conveyance"}
            onClick={() => onSectionChange("conveyance")}
          />
          <SidebarButton
            icon={<MdHotel className="w-4 h-4" />}
            text="Stays"
            active={activeSection === "stays"}
            onClick={() => onSectionChange("stays")}
          />
        </div>

        {/* Discover Section */}
        <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mt-5 mb-2">
          DISCOVER
        </h4>
        <div className="space-y-1">
          <SidebarButton
            icon={<MdExplore className="w-4 h-4" />}
            text="Explore"
            active={activeSection === "explore"}
            onClick={() => onSectionChange("explore")}
          />
          <SidebarButton
            icon={<MdBook className="w-4 h-4" />}
            text="Itinerary"
            active={activeSection === "itinerary"}
            onClick={() => onSectionChange("itinerary")}
            badge="NEW!"
          />
          <SidebarButton
            icon={<MdPeople className="w-4 h-4" />}
            text="Friends"
            active={activeSection === "friends"}
            onClick={() => onSectionChange("friends")}
          />
        </div>
      </div>

      {/* Logout */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-red-500 hover:bg-red-50 transition-all"
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
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span className="text-xs">Logout</span>
        </button>
      </div>
    </aside>
  );
}
