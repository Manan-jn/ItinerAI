// Chat types and interfaces
export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  metadata?: {
    selectedTrip?: any;
  };
}

export interface ChatWidgetHandlers {
  onShowFlashcardsToggle: () => void;
  onShowFlightsToggle: () => void;
  onShowItineraryToggle: () => void;
  onShowDateSelectorToggle: () => void;
  onDebugToggle: () => void;
  onClearFlashcardsSelection: () => void;
}

