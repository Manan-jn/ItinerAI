"use client";

import { useState, useEffect } from "react";
import {
  getSessionInfo,
  clearSession,
  regenerateSessionForUser,
} from "../utils/sessionManager";
import { useAuth } from "../contexts/AuthContext";

interface SessionDebugFlightsProps {
  isVisible?: boolean;
  onClose?: () => void;
  onSessionRegenerated?: (newSessionId: string, userId: string) => void;
}

const SessionDebugFlights: React.FC<SessionDebugFlightsProps> = ({
  isVisible = false,
  onClose,
  onSessionRegenerated,
}) => {
  const { currentUser } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<{
    sessionId: string;
    userId: string;
    isNewSession: boolean;
  } | null>(null);

  useEffect(() => {
    if (isVisible) {
      const info = getSessionInfo();
      // For authenticated users, show the Firebase UID as user ID
      const displayInfo = {
        ...info,
        userId: currentUser ? currentUser.uid : info.userId,
      };
      setSessionInfo(displayInfo);
    }
  }, [isVisible, currentUser]);

  const handleClearSession = () => {
    if (currentUser) {
      // For authenticated users, only regenerate session ID while keeping user ID
      const { sessionId: newSessionId, userId } = regenerateSessionForUser(
        currentUser.uid
      );

      // Update local state
      setSessionInfo((prev) =>
        prev
          ? {
              ...prev,
              sessionId: newSessionId,
              isNewSession: true,
            }
          : null
      );

      // Notify parent component about the session regeneration
      if (onSessionRegenerated) {
        onSessionRegenerated(newSessionId, userId);
      }

      console.log("Session regenerated for authenticated user:", {
        newSessionId,
        userId,
        userEmail: currentUser.email,
      });
    } else {
      // For non-authenticated users, clear everything and reload
      clearSession();
      window.location.reload();
    }
  };

  if (!isVisible || !sessionInfo) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-white border border-gray-200 text-gray-900 p-3 rounded-lg text-xs max-w-sm z-50 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-blue-600">🔧 Debug Info</div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Close debug panel"
          >
            <svg
              className="w-3 h-3"
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
      <div className="space-y-1">
        <div>
          <span className="text-gray-500">Session:</span>
          <div className="font-mono text-green-600 break-all text-xs">
            {sessionInfo.sessionId}
          </div>
        </div>
        <div>
          <span className="text-gray-500">User:</span>
          <div className="font-mono text-blue-600 break-all text-xs">
            {sessionInfo.userId}
          </div>
          {currentUser && (
            <div className="text-[10px] text-gray-400 mt-1">
              🔐 Authenticated ({currentUser.email})
            </div>
          )}
        </div>
        <div>
          <span className="text-gray-500">New Session:</span>
          <span
            className={
              sessionInfo.isNewSession ? "text-yellow-600" : "text-gray-400"
            }
          >
            {sessionInfo.isNewSession ? " Yes" : " No"}
          </span>
        </div>
      </div>
      <button
        onClick={handleClearSession}
        className="mt-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors w-full"
        title={
          currentUser
            ? "Regenerate session ID (keeps user ID)"
            : "Clear session and reload"
        }
      >
        🔄 {currentUser ? "Regenerate Session" : "Clear & Reload"}
      </button>
    </div>
  );
};

export default SessionDebugFlights;
