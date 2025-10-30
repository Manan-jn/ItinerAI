"use client";

import React, { useState } from "react";
import { FiPlay, FiLoader, FiCheck, FiAlertCircle } from "react-icons/fi";
import { testPreFetchConveyance, getTestConfiguration } from "../utils/testPreFetchTrigger";
import { useAuth } from "../contexts/AuthContext";

/**
 * Pre-Fetch Test Trigger Component
 * Dummy button to test the parallelized pre-fetch conveyance system
 * Uses final_response.json as test data with fixed date: 2025-12-12
 */
export default function PreFetchTestTrigger() {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [showDetails, setShowDetails] = useState(false);

  const handleTestTrigger = async () => {
    if (!currentUser?.uid) {
      alert("❌ User not authenticated. Please log in first.");
      return;
    }

    setIsLoading(true);
    setStatus("loading");

    try {
      // Use actual user ID and a test session ID
      const testSessionId = `test-session-${Date.now()}`;

      console.log("\n" + "═".repeat(70));
      console.log("🧪 STARTING PRE-FETCH TEST");
      console.log("═".repeat(70));

      await testPreFetchConveyance(currentUser.uid, testSessionId);

      setStatus("success");
      console.log("\n✅ Test completed successfully!");
    } catch (error) {
      setStatus("error");
      console.error("❌ Test failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const testConfig = getTestConfiguration();

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Main Trigger Button */}
      <button
        onClick={handleTestTrigger}
        disabled={isLoading || !currentUser?.uid}
        className={`
          flex items-center gap-2 px-4 py-3 rounded-lg font-medium
          transition-all duration-300 shadow-lg hover:shadow-xl
          ${
            isLoading
              ? "bg-blue-500 text-white cursor-wait"
              : status === "success"
              ? "bg-green-500 text-white"
              : status === "error"
              ? "bg-red-500 text-white"
              : "bg-purple-600 text-white hover:bg-purple-700"
          }
          ${!currentUser?.uid ? "opacity-50 cursor-not-allowed" : ""}
        `}
        title={!currentUser?.uid ? "Please log in first" : "Test pre-fetch conveyance system"}
      >
        {isLoading ? (
          <>
            <FiLoader className="animate-spin" size={18} />
            <span>Testing...</span>
          </>
        ) : status === "success" ? (
          <>
            <FiCheck size={18} />
            <span>Success!</span>
          </>
        ) : status === "error" ? (
          <>
            <FiAlertCircle size={18} />
            <span>Failed</span>
          </>
        ) : (
          <>
            <FiPlay size={18} />
            <span>Test Pre-Fetch</span>
          </>
        )}
      </button>

      {/* Info Panel */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="
          absolute bottom-16 right-0 text-xs text-gray-600
          hover:text-gray-800 underline
        "
      >
        {showDetails ? "Hide Details" : "Show Details"}
      </button>

      {/* Details Panel */}
      {showDetails && (
        <div
          className="
            absolute bottom-24 right-0 w-80 bg-white rounded-lg shadow-xl
            border border-gray-200 p-4 text-xs space-y-3 max-h-96 overflow-y-auto
          "
        >
          <div className="font-bold text-gray-900 border-b pb-2">
            🧪 Pre-Fetch Test Configuration
          </div>

          <div>
            <div className="font-semibold text-gray-700">Trip Details:</div>
            <div className="text-gray-600 ml-2 space-y-1">
              <div>Title: {testConfig.trip.trip_title}</div>
              <div>Days: {testConfig.trip.no_of_days}</div>
              <div>Budget: ₹{testConfig.trip.estimated_budget}</div>
            </div>
          </div>

          <div>
            <div className="font-semibold text-gray-700">Test Date:</div>
            <div className="text-gray-600 ml-2">
              {testConfig.testDate} (December 12, 2025)
            </div>
          </div>

          <div>
            <div className="font-semibold text-gray-700">
              Days Requiring Conveyance ({testConfig.daysRequiringConveyance.length}):
            </div>
            <div className="text-gray-600 ml-2 space-y-1">
              {testConfig.daysRequiringConveyance.map((day, idx) => (
                <div key={idx} className="bg-blue-50 p-1 rounded">
                  Day {day.day}: {day.from} → {day.to}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
            <div className="font-semibold text-yellow-900">⚠️ Note:</div>
            <div className="text-yellow-800 text-xs">
              This is a dummy test trigger. It will pre-fetch data for all days
              requiring conveyance in parallel. Check Firestore and browser console
              for results.
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-2">
            <div className="font-semibold text-blue-900">📍 Firestore Location:</div>
            <div className="text-blue-800 text-xs font-mono">
              Collection: pre_fetch_data_conveyance_stays
              <br />
              Document: {currentUser?.uid || "user-id"}
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded p-2">
            <div className="font-semibold text-green-900">✅ Expected Composite Keys:</div>
            <div className="text-green-800 text-xs font-mono space-y-1">
              {testConfig.daysRequiringConveyance.map((day, idx) => {
                const date = new Date("2025-12-12");
                date.setDate(date.getDate() + (day.day - 1));
                const dateStr = date.toISOString().split("T")[0];
                return (
                  <div key={idx}>
                    {day.from}|{day.to}|{dateStr}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Status Indicator */}
      {status !== "idle" && (
        <div className="absolute -top-8 right-0 text-xs font-medium">
          {status === "loading" && (
            <span className="text-blue-600">⏳ Running test...</span>
          )}
          {status === "success" && (
            <span className="text-green-600">✅ Test passed!</span>
          )}
          {status === "error" && (
            <span className="text-red-600">❌ Test failed. Check console.</span>
          )}
        </div>
      )}
    </div>
  );
}
