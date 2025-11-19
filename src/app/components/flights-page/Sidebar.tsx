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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  activeSection,
  onSectionChange,
  onLogout,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <aside
      className={`
        bg-white border-r border-gray-200 flex flex-col flex-shrink-0 
        transition-all duration-500 ease-in-out overflow-hidden
        ${isCollapsed ? "w-0 border-r-0" : "w-52"}
      `}
      style={{
        minWidth: isCollapsed ? "0" : "13rem",
      }}
    >
      {/* Content wrapper with opacity transition */}
      <div
        className={`
          w-52 flex flex-col h-full
          transition-opacity duration-300 ease-in-out
          ${isCollapsed ? "opacity-0" : "opacity-100"}
        `}
      >
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200/50">
              <MdFlight className="text-white text-lg transform rotate-45" />
            </div>
            <div>
              <div className="text-gray-900 font-bold text-base leading-tight tracking-tight">
                ItinerAI
              </div>
              <div className="text-[9px] text-gray-400 font-medium tracking-wide">
                AI Travel Companion
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1.5">
            <SidebarButton
              icon={<MdHome className="w-[18px] h-[18px]" />}
              text="Dashboard"
              active={(activeSection as string) === "dashboard"}
              onClick={() => onSectionChange("dashboard")}
            />
            <SidebarButton
              icon={<MdChat className="w-[18px] h-[18px]" />}
              text="Trip Planner"
              active={activeSection === "chat"}
              onClick={() => onSectionChange("chat")}
            />
            <SidebarButton
              icon={<MdDirectionsBus className="w-[18px] h-[18px]" />}
              text="Conveyance"
              active={activeSection === "conveyance"}
              onClick={() => onSectionChange("conveyance")}
            />
            <SidebarButton
              icon={<MdHotel className="w-[18px] h-[18px]" />}
              text="Stay Finder"
              active={activeSection === "stays"}
              onClick={() => onSectionChange("stays")}
            />
          </div>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200 group"
          >
            <svg
              className="w-[18px] h-[18px] group-hover:scale-110 transition-transform"
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
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
