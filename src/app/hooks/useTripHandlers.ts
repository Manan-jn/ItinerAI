import React, { Dispatch, SetStateAction } from "react";
import { storeSelectedTrip } from "../utils/tripStorage";
import type { FlashcardsWidgetRef } from "../components/flashcards/types";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  metadata?: any;
}

/**
 * Custom hook for trip selection and memory management handlers
 * Handles trip selection, memory API updates, and Firestore storage
 * 
 * @param userId - Current user ID
 * @param sessionId - Current session ID
 * @param selectedTrip - Currently selected trip
 * @param setSelectedTrip - Setter for selected trip
 * @param originalTrips - Array of original trips from API
 * @param setIsCardManuallySelected - Setter for manual selection flag
 * @param setMessages - Setter for chat messages
 * @param setIsLoading - Setter for loading state
 * @param setShowFlashcards - Setter for flashcards visibility
 * @param flashcardsRef - Ref to flashcards widget for clearing selection
 * @returns Trip handler functions
 */
export function useTripHandlers(
  userId: string,
  sessionId: string,
  selectedTrip: any,
  setSelectedTrip: Dispatch<SetStateAction<any>>,
  originalTrips: any[],
  setIsCardManuallySelected: Dispatch<SetStateAction<boolean>>,
  setMessages: Dispatch<SetStateAction<Message[]>>,
  setIsLoading: Dispatch<SetStateAction<boolean>>,
  setShowFlashcards: Dispatch<SetStateAction<boolean>>,
  flashcardsRef: React.RefObject<FlashcardsWidgetRef | null>
) {
  // Handle trip selection - map transformed trip back to original trip
  const handleTripSelect = (transformedTrip: any | null) => {
    if (transformedTrip === null) {
      setSelectedTrip(null);
      setIsCardManuallySelected(false); // Clear manual selection flag
      return;
    }

    // Find the corresponding original trip by matching trip_title
    const originalTrip = originalTrips.find(
      (trip) => trip.trip_title === transformedTrip.trip_title
    );

    if (originalTrip) {
      console.log("Selected original trip:", originalTrip);
      setSelectedTrip(originalTrip);
      setIsCardManuallySelected(true); // User manually selected this trip
    } else {
      console.warn(
        "Could not find original trip for:",
        transformedTrip.trip_title
      );
      setSelectedTrip(transformedTrip); // Fallback to transformed trip
      setIsCardManuallySelected(true); // User manually selected this trip
    }
  };

  // Handle trip memory update when a trip is selected and send button is clicked
  const handleTripMemoryUpdate = async () => {
    if (!selectedTrip || !sessionId || !userId) {
      console.error("Missing required data for trip memory update");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Sending trip to memory API and Firestore:", selectedTrip);

      // Store the selected trip in Firestore first
      await storeSelectedTrip(userId, sessionId, selectedTrip);
      console.log(
        "✅ Trip stored in Firestore successfully:",
        selectedTrip.trip_title
      );
      console.log(
        "📌 Trip remains in component state for subsequent operations"
      );

      // Send the selected trip to memory API
      const response = await fetch("/api/memory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          session_id: sessionId,
          updates: {
            final_trip: selectedTrip,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("Memory API Error:", errorData);
        throw new Error(
          `Failed to update memory: ${errorData.error || response.statusText}`
        );
      }

      const result = await response.json();
      console.log("Memory API success:", result);

      // Add a user message showing the selected trip
      const userMessage = {
        id: Date.now().toString(),
        content: `Selected trip: ${selectedTrip.trip_title}`,
        role: "user" as const,
        timestamp: new Date(),
        metadata: {
          selectedTrip: selectedTrip,
          isTripSelection: true, // Flag to indicate this is the primary trip selection
        },
      };

      setMessages((prev) => [...prev, userMessage]);

      // Close flashcards and clear visual selection
      setShowFlashcards(false);
      // NOTE: Keep selectedTrip in state - it's needed for subsequent operations
      // (date selection, conveyance flow, stays). Trip is already stored in Firestore.
      // setSelectedTrip(null); // ❌ Removed - causes null trip in date selector

      // Clear flashcards visual selection via ref
      if (flashcardsRef.current) {
        flashcardsRef.current.clearSelection();
      }

      // Make a chat API call to notify the backend about the memory update
      console.log("Making chat API call after memory update");
      const chatResponse = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          session_id: sessionId,
          message:
            "I have updated the memory with the trip selected by the user.",
        }),
      });

      if (!chatResponse.ok) {
        const errorData = await chatResponse
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("Chat API Error:", errorData);
        throw new Error(
          `Failed to call chat API: ${
            errorData.error || chatResponse.statusText
          }`
        );
      }

      const chatData = await chatResponse.json();
      console.log("Chat API response received:", chatData);

      // Extract message content from chat response
      let chatMessageContent = "";

      if (chatData.response_type === "text" && chatData.message) {
        chatMessageContent = chatData.message.message || chatData.message;
      } else if (chatData.message && typeof chatData.message === "object") {
        chatMessageContent =
          chatData.message.message || JSON.stringify(chatData.message);
      } else if (typeof chatData.message === "string") {
        chatMessageContent = chatData.message;
      } else {
        chatMessageContent = "Trip selection updated successfully.";
      }

      // Add assistant response from chat API to messages
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        content: chatMessageContent,
        role: "assistant" as const,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    } catch (error) {
      console.error("Error updating trip memory:", error);
      setIsLoading(false);
      alert("Failed to save trip selection. Please try again.");
    }
  };

  return {
    handleTripSelect,
    handleTripMemoryUpdate,
  };
}

