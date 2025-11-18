import React from "react";
import { MdChat } from "react-icons/md";
import { User } from "firebase/auth";

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    role: "user" | "assistant";
    timestamp: Date;
    metadata?: {
      selectedTrip?: {
        trip_title: string;
        no_of_days: number;
        estimated_budget: number;
      };
    };
  };
  currentUser: User | null;
}

export function ChatMessage({ message, currentUser }: ChatMessageProps) {
  return (
    <div
      className={`flex items-start gap-3 ${
        message.role === "user" ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          message.role === "user"
            ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-md"
            : "bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300"
        }`}
      >
        {message.role === "user" ? (
          currentUser?.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt="Profile"
              className="w-full h-full object-cover rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-white text-sm font-medium">
              {currentUser?.displayName?.charAt(0) ||
                currentUser?.email?.charAt(0) ||
                "U"}
            </span>
          )
        ) : (
          <MdChat className="text-gray-600 text-sm" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={`max-w-[70%] ${
          message.role === "user"
            ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg"
            : "bg-white text-gray-900 border border-gray-200 shadow-sm"
        } rounded-2xl px-4 py-3`}
      >
        {message.metadata?.selectedTrip ? (
          <div className="space-y-2">
            <p className="text-xs font-medium opacity-90">Selected Trip:</p>
            <div className="bg-white/10 rounded-lg p-3 border border-white/20">
              <h4 className="font-semibold text-sm mb-1">
                {message.metadata.selectedTrip.trip_title}
              </h4>
              <div className="flex items-center gap-3 text-xs opacity-90">
                <span>{message.metadata.selectedTrip.no_of_days} days</span>
                <span>•</span>
                <span>₹{message.metadata.selectedTrip.estimated_budget}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
          </p>
        )}
      </div>
    </div>
  );
}
