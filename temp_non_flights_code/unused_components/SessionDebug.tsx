"use client";

import { useState, useEffect } from "react";
import { getSessionInfo, clearSession } from "../utils/sessionManager";

interface SessionDebugProps {
  isVisible?: boolean;
  onClose?: () => void;
}

const SessionDebug: React.FC<SessionDebugProps> = ({
  isVisible = false,
  onClose,
}) => {
  const [sessionInfo, setSessionInfo] = useState<{
    sessionId: string;
    userId: string;
    isNewSession: boolean;
  } | null>(null);

  useEffect(() => {
    if (isVisible) {
      const info = getSessionInfo();
      setSessionInfo(info);
    }
  }, [isVisible]);

  const handleClearSession = () => {
    clearSession();
    window.location.reload();
  };

  if (!isVisible || !sessionInfo) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-gray-800 text-white p-3 rounded-lg border border-gray-600 text-xs max-w-sm z-50 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-green-400">🔧 Debug Info</div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
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
          <span className="text-gray-400">Session:</span>
          <div className="font-mono text-green-400 break-all text-xs">
            {sessionInfo.sessionId}
          </div>
        </div>
        <div>
          <span className="text-gray-400">User:</span>
          <div className="font-mono text-blue-400 break-all text-xs">
            {sessionInfo.userId}
          </div>
        </div>
        <div>
          <span className="text-gray-400">New Session:</span>
          <span
            className={
              sessionInfo.isNewSession ? "text-yellow-400" : "text-gray-300"
            }
          >
            {sessionInfo.isNewSession ? " Yes" : " No"}
          </span>
        </div>
      </div>
      <button
        onClick={handleClearSession}
        className="mt-2 px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs transition-colors w-full"
      >
        🔄 Clear & Reload
      </button>
    </div>
  );
};

export default SessionDebug;
