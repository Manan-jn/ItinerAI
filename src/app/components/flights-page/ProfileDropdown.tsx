import React, { useState } from "react";
import { User } from "firebase/auth";
import { CustomUserIdModal } from "../CustomUserIdModal";
import { setCustomUserId } from "../../utils/sessionManager";

interface ProfileDropdownProps {
  currentUser: User;
  showProfileDropdown: boolean;
  setShowProfileDropdown: (show: boolean) => void;
  onSettings: () => void;
  onLogout: () => void;
  onCustomUserIdSet?: (userId: string) => void; // New callback
}

export function ProfileDropdown({
  currentUser,
  showProfileDropdown,
  setShowProfileDropdown,
  onSettings,
  onLogout,
  onCustomUserIdSet,
}: ProfileDropdownProps) {
  const [showCustomUserIdModal, setShowCustomUserIdModal] = useState(false);

  const handleSaveCustomUserId = (userId: string) => {
    setCustomUserId(userId);
    console.log(`✅ Custom User ID set to: ${userId}`);

    // Notify parent to trigger onboarding flow
    if (onCustomUserIdSet) {
      onCustomUserIdSet(userId);
    } else {
      // Fallback to page reload if callback not provided
      alert(`Custom User ID set to: ${userId}\n\nPage will reload to apply changes.`);
      window.location.reload();
    }
  };

  return (
    <>
      <div className="relative profile-dropdown">
        <button
          onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center overflow-hidden">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="Profile"
                className="w-full h-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-sm font-medium text-white">
                {currentUser?.displayName?.charAt(0) ||
                  currentUser?.email?.charAt(0) ||
                  "U"}
              </span>
            )}
          </div>
          <span className="text-sm text-gray-700 hidden sm:block">
            {currentUser?.displayName?.split(" ")[0] || currentUser?.email}
          </span>
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${
              showProfileDropdown ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {showProfileDropdown && (
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-[10010]">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center overflow-hidden">
                    {currentUser?.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt="Profile"
                        className="w-full h-full object-cover rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-sm font-medium text-white">
                        {currentUser?.displayName?.charAt(0) ||
                          currentUser?.email?.charAt(0) ||
                          "U"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {currentUser?.displayName || "User"}
                    </p>
                    <p className="text-xs text-gray-500">{currentUser?.email}</p>
                  </div>
                </div>

                {/* Custom User ID Button - Small Icon */}
                <button
                  onClick={() => {
                    setShowCustomUserIdModal(true);
                    setShowProfileDropdown(false);
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors group"
                  title="Custom User ID"
                >
                  <svg
                    className="w-4 h-4 text-gray-400 group-hover:text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-2">
              <button
                onClick={() => {
                  onSettings();
                  setShowProfileDropdown(false);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
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
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>Settings</span>
              </button>

              <button
                onClick={() => {
                  onLogout();
                  setShowProfileDropdown(false);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
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
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom User ID Modal */}
      <CustomUserIdModal
        isOpen={showCustomUserIdModal}
        onClose={() => setShowCustomUserIdModal(false)}
        onSave={handleSaveCustomUserId}
      />
    </>
  );
}
