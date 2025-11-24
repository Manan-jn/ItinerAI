import React from "react";
import { MdChat } from "react-icons/md";
import { User } from "firebase/auth";
import { SuggestedTripsSnippet } from "./SuggestedTripsSnippet";
import { DateSelectorSnippet } from "./DateSelectorSnippet";
import { ConveyanceSnippet } from "./ConveyanceSnippet";
import { StaysSnippet } from "./StaysSnippet";
import { ItinerarySnippet } from "./ItinerarySnippet";
import { BookingSnippet } from "./BookingSnippet";
import { PreTripSnippet } from "./PreTripSnippet";

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
      suggestedTrips?: Array<{
        trip_title: string;
        no_of_days: number;
        estimated_budget: number;
        image?: string;
        theme?: string[];
        themes?: string[];
        best_time_to_visit?: string;
      }>;
      isTripSelection?: boolean; // Flag to indicate this is the primary trip selection message
      // Date selector snippet metadata
      isDateSelection?: boolean; // Flag to indicate this is the date selection assistant message
      selectedDate?: string; // YYYY-MM-DD format
      tripTitle?: string;
      tripDuration?: number;
      // Conveyance snippet metadata
      isConveyanceSelection?: boolean;
      conveyanceOptions?: Array<{
        id: string;
        type: "flight" | "train";
        number: string;
        operator: string;
        departureTime: string;
        arrivalTime: string;
        duration: string;
        price: number;
        from_city: string;
        to_city: string;
      }>;
      conveyanceDayNumber?: number;
      conveyanceRouteInfo?: string;
      // Stays snippet metadata
      isStaysSelection?: boolean;
      stayOptions?: Array<{
        stay_id: string;
        property_name: string;
        property_address: string;
        overall_rating: number;
        starting_price: number;
        city: string;
        image?: string;
        amenities?: string[];
        property_type?: string;
      }>;
      staysDayNumber?: number;
      staysCityName?: string;
      // Itinerary snippet metadata
      isItinerarySelection?: boolean;
      itineraries?: Array<{
        day_number: number;
        date?: string;
        title?: string;
        summary?: string;
        themes?: string[];
        schedule: Array<{
          activity_type: string;
          sub_type?: string;
          start_time: string;
          end_time: string;
          description: string;
          place_name?: string;
          address?: string;
          fare?: number;
          duration_minutes?: number;
          from_location?: {
            place_name: string;
            address?: string;
          };
          to_location?: {
            place_name: string;
            address?: string;
          };
        }>;
        estimated_total_cost?: number;
        conveyance_details?: {
          is_required: boolean;
          from_city?: string;
          to_city?: string;
          type?: string;
          operator?: string;
          number?: string;
        };
        stay_details?: {
          is_required: boolean;
          city?: string;
          property_name?: string;
        };
      }>;
      itineraryTripTitle?: string;
      itineraryTotalDays?: number;
      // Booking snippet metadata
      isBookingComplete?: boolean;
      bookingTripTitle?: string;
      bookingTotalDays?: number;
      bookingTotalBudget?: number;
      bookingUserBudget?: number;
      bookingBudgetBreakdown?: {
        overall: Partial<Record<string, number>>;
      };
      bookingTravelActivitiesCount?: number;
      // Pre-trip snippet metadata
      isPreTripReady?: boolean;
      preTripTripTitle?: string;
      preTripMarkdownContent?: string;
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
        {message.metadata?.selectedTrip && message.metadata?.isTripSelection ? (
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
        ) : message.metadata?.isDateSelection && message.metadata?.selectedDate ? (
          <DateSelectorSnippet
            selectedDate={message.metadata.selectedDate}
            tripTitle={message.metadata.tripTitle}
            tripDuration={message.metadata.tripDuration}
          />
        ) : message.metadata?.isConveyanceSelection && message.metadata?.conveyanceOptions ? (
          <ConveyanceSnippet
            conveyanceOptions={message.metadata.conveyanceOptions}
            dayNumber={message.metadata.conveyanceDayNumber}
            routeInfo={message.metadata.conveyanceRouteInfo}
          />
        ) : message.metadata?.isStaysSelection && message.metadata?.stayOptions ? (
          <StaysSnippet
            stayOptions={message.metadata.stayOptions}
            dayNumber={message.metadata.staysDayNumber}
            cityName={message.metadata.staysCityName}
          />
        ) : message.metadata?.isItinerarySelection && message.metadata?.itineraries ? (
          <ItinerarySnippet
            itineraries={message.metadata.itineraries}
            tripTitle={message.metadata.itineraryTripTitle}
            totalDays={message.metadata.itineraryTotalDays}
          />
        ) : message.metadata?.isBookingComplete && message.metadata?.bookingBudgetBreakdown ? (
          <BookingSnippet
            tripTitle={message.metadata.bookingTripTitle || "Your Trip"}
            totalDays={message.metadata.bookingTotalDays || 1}
            totalBudget={message.metadata.bookingTotalBudget || 0}
            userBudget={message.metadata.bookingUserBudget}
            budgetBreakdown={message.metadata.bookingBudgetBreakdown as any}
            travelActivitiesCount={message.metadata.bookingTravelActivitiesCount || 0}
          />
        ) : message.metadata?.isPreTripReady && message.metadata?.preTripMarkdownContent ? (
          <PreTripSnippet
            tripTitle={message.metadata.preTripTripTitle || "Your Trip"}
            markdownContent={message.metadata.preTripMarkdownContent}
          />
        ) : message.metadata?.suggestedTrips ? (
          <SuggestedTripsSnippet trips={message.metadata.suggestedTrips} />
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
          </p>
        )}
      </div>
    </div>
  );
}
