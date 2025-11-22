"use client";

import React, { useEffect, useRef } from "react";
import { useNotifications } from "../contexts/NotificationsContext";

interface NotificationsDropdownProps {
  theme?: "light" | "dark";
}

export function NotificationsDropdown({ theme = "light" }: NotificationsDropdownProps) {
  const {
    notifications,
    unreadCount,
    isDropdownOpen,
    setIsDropdownOpen,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    bellIconRef,
  } = useNotifications();

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isDropdownOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        bellIconRef.current &&
        !bellIconRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isDropdownOpen, setIsDropdownOpen, bellIconRef]);

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const isDark = theme === "dark";

  return (
    <div className="relative notifications-dropdown" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        ref={bellIconRef as React.RefObject<HTMLButtonElement>}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`relative p-2 rounded-lg transition-all duration-200 ${
          isDark
            ? "hover:bg-white/10"
            : "hover:bg-gray-100"
        }`}
        title="Notifications"
      >
        <svg
          className={`w-5 h-5 ${isDark ? "text-gray-300" : "text-gray-600"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isDropdownOpen && (
        <div
          className={`absolute right-0 mt-2 w-80 max-h-[400px] rounded-xl shadow-2xl overflow-hidden z-[10010] ${
            isDark
              ? "bg-gray-900/95 backdrop-blur-xl border border-white/10"
              : "bg-white border border-gray-200"
          }`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between px-4 py-3 border-b ${
              isDark ? "border-white/10" : "border-gray-100"
            }`}
          >
            <div className="flex items-center gap-2">
              <h3
                className={`text-sm font-semibold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span
                  className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                    isDark
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAllAsRead();
                    }}
                    className={`text-[11px] font-medium transition-colors ${
                      isDark
                        ? "text-blue-400 hover:text-blue-300"
                        : "text-blue-600 hover:text-blue-700"
                    }`}
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearNotifications();
                  }}
                  className={`text-[11px] font-medium transition-colors ${
                    isDark
                      ? "text-gray-400 hover:text-gray-300"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-[320px] custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <svg
                  className={`w-12 h-12 mb-3 ${
                    isDark ? "text-gray-600" : "text-gray-300"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <p
                  className={`text-sm font-medium ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  No notifications yet
                </p>
                <p
                  className={`text-xs mt-1 ${
                    isDark ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  Responses will appear here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-white/5">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                    }}
                    className={`px-4 py-3 cursor-pointer transition-all duration-200 ${
                      notification.read
                        ? isDark
                          ? "bg-transparent hover:bg-white/5"
                          : "bg-transparent hover:bg-gray-50"
                        : isDark
                        ? "bg-blue-500/10 hover:bg-blue-500/15"
                        : "bg-blue-50/50 hover:bg-blue-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Unread Indicator */}
                      <div className="flex-shrink-0 mt-1.5">
                        <span
                          className={`block w-2 h-2 rounded-full transition-colors ${
                            notification.read
                              ? isDark
                                ? "bg-gray-600"
                                : "bg-gray-300"
                              : "bg-blue-500 animate-pulse"
                          }`}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm leading-relaxed ${
                            notification.read
                              ? isDark
                                ? "text-gray-400"
                                : "text-gray-600"
                              : isDark
                              ? "text-white"
                              : "text-gray-900"
                          }`}
                        >
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-[10px] ${
                              isDark ? "text-gray-500" : "text-gray-400"
                            }`}
                          >
                            {formatTimestamp(notification.timestamp)}
                          </span>
                          {notification.source && (
                            <>
                              <span
                                className={`text-[10px] ${
                                  isDark ? "text-gray-600" : "text-gray-300"
                                }`}
                              >
                                &bull;
                              </span>
                              <span
                                className={`text-[10px] ${
                                  isDark ? "text-gray-500" : "text-gray-400"
                                }`}
                              >
                                {notification.source}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"};
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"};
        }
      `}</style>
    </div>
  );
}

export default NotificationsDropdown;
