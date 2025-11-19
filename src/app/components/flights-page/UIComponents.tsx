import React from "react";

// TripTypeButton Component
export function TripTypeButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 text-sm font-medium rounded-full transition-colors ${
        active
          ? "bg-white text-blue-600"
          : "bg-white/20 text-white hover:bg-white/30"
      }`}
    >
      {children}
    </button>
  );
}

// SpecialFareCheckbox Component
export function SpecialFareCheckbox({ label }: { label: string }) {
  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input
        type="radio"
        name="specialFare"
        className="w-4 h-4 text-blue-600 bg-white border-white focus:ring-blue-500"
      />
      <span className="text-white text-sm">{label}</span>
    </label>
  );
}

// QuickLink Component
export function QuickLink({
  icon,
  text,
  badge,
}: {
  icon: React.ReactNode;
  text: string;
  badge?: string;
}) {
  return (
    <div className="flex flex-col items-center space-y-2 cursor-pointer group">
      <div className="relative">
        <div className="text-gray-600 group-hover:text-blue-600 transition-colors">
          {icon}
        </div>
        {badge && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1 rounded">
            {badge}
          </span>
        )}
      </div>
      <span className="text-xs text-gray-700 group-hover:text-blue-600 transition-colors text-center">
        {text}
      </span>
    </div>
  );
}

// SidebarButton Component
export function SidebarButton({
  icon,
  text,
  active = false,
  onClick,
  badge,
}: {
  icon: React.ReactNode;
  text: string;
  active?: boolean;
  onClick?: () => void;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`group w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 ${
        active
          ? "bg-gradient-to-r from-blue-50 to-blue-50/50 text-blue-600 shadow-sm ring-1 ring-blue-100"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <span className={`${active ? "scale-110" : "group-hover:scale-110"} transition-transform`}>
        {icon}
      </span>
      <span className="text-sm font-medium flex-1 text-left">{text}</span>
      {badge && (
        <span className="ml-auto bg-gradient-to-r from-purple-600 to-purple-500 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
          {badge}
        </span>
      )}
    </button>
  );
}
