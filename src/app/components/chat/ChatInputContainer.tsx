import React from "react";
import { SelectedTripSnippet } from "./SelectedTripSnippet";
import ItinerAIChatBox from "../ItinerAIChatBox";

interface ChatInputContainerProps {
  // Selected Trip props
  selectedTrip: any;
  showFlashcards: boolean;
  isCardManuallySelected: boolean;
  onClearSelection: () => void;

  // Chat input props
  textareaRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;

  // State props
  isInitializingSession: boolean;
  testEndResponse: boolean;
  isLoading: boolean;
}

/**
 * Container component for the chat input area at the bottom of the chat interface
 * Includes the selected trip snippet and the ItinerAIChatBox
 */
export function ChatInputContainer({
  selectedTrip,
  showFlashcards,
  isCardManuallySelected,
  onClearSelection,
  textareaRef,
  chatInput,
  onChatInputChange,
  onSubmit,
  onKeyDown,
  isInitializingSession,
  testEndResponse,
  isLoading,
}: ChatInputContainerProps) {
  return (
    <div className="flex-shrink-0 bg-gradient-to-t from-white to-blue-50/20 border-t border-blue-100 px-6 py-6 relative">
      {/* Selected Trip Snippet */}
      {selectedTrip && showFlashcards && isCardManuallySelected && (
        <SelectedTripSnippet
          selectedTrip={selectedTrip}
          onClear={onClearSelection}
        />
      )}

      <div className="max-w-4xl mx-auto">
        <ItinerAIChatBox
          ref={textareaRef}
          value={chatInput}
          onChange={onChatInputChange}
          onSubmit={onSubmit}
          onKeyDown={onKeyDown}
          placeholder={
            isInitializingSession
              ? "Initializing session..."
              : testEndResponse
              ? "🧪 TEST MODE: Next message will trigger date selector"
              : selectedTrip && showFlashcards && isCardManuallySelected
              ? "Click send to confirm trip selection"
              : "Ask ItinerAI"
          }
          disabled={
            isInitializingSession ||
            isLoading ||
            (selectedTrip && showFlashcards && isCardManuallySelected)
          }
          isLoading={isLoading || isInitializingSession}
          theme="default"
          inputType="textarea"
          allowEmptySubmit={
            selectedTrip && showFlashcards && isCardManuallySelected
          }
        />
      </div>
    </div>
  );
}
