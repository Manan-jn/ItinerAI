"use client";

import { useState, useEffect } from "react";
import { getSessionInfo, clearSession } from "../utils/sessionManager";

interface SessionDebugProps {
  isVisible?: boolean;
}

const SessionDebug: React.FC<SessionDebugProps> = ({ isVisible = false }) => {
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
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg border border-gray-600 text-xs max-w-sm z-50">
      <div className="mb-2 font-semibold">Session Debug Info</div>
      <div className="space-y-1">
        <div>
          <span className="text-gray-400">Session ID:</span>
          <div className="font-mono text-green-400 break-all">
            {sessionInfo.sessionId}
          </div>
        </div>
        <div>
          <span className="text-gray-400">User ID:</span>
          <div className="font-mono text-blue-400 break-all">
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
        className="mt-3 px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs transition-colors"
      >
        Clear Session & Reload
      </button>
    </div>
  );
};

export default SessionDebug;
