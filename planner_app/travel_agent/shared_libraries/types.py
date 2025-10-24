from typing import List, Optional, Literal
from typing_extensions import Union
from pydantic import BaseModel, Field
from google.genai import types


json_response_config = types.GenerateContentConfig(
    # response_mime_type="application/json"
    response_mime_type="text/plain"
)

class UserProfile(BaseModel):
    """ User Profile """
    name: str = Field(description='The name of the user', default='')
    age: int = Field(description='The age of the user', default=0)
    gender: Literal['male', 'female', 'other', 'prefer not to say'] = Field(description='The gender of the user', default='prefer not to say')
    passport_nationality: str = Field(description='The passport nationality of the user', default='')
    allergies: List[str] = Field(description='The allergies of the user', default=[])
    emergency_contact: List[str] = Field(description='The emergency contact of the user', default=[])
    travel_history: List[str] = Field(description='The travel history of the user', default=[])
    general_preferences: List[str] = Field(description='The general preferences of the user like food, activities, destinations etc.', default=[])
    
class GroupDetails(BaseModel):
    """ Group Details """
    trip_type: Literal['group', 'solo'] = Field(description='The type of the trip')
    group_size: int = Field(description='The size of the group')
    group_members: Optional[List[UserProfile]] = Field(description='Details of the group members', default=[])

class SourceLocation(BaseModel):
    """ A source location """
    response_type: Literal['source_point', 'text'] = Field(description="The type of the response, always 'source_point'", default='source_point')
    message: str = Field(description="The message to display to the user", default='')
    place: dict[str, str] = Field(description="The source location", default={})
class Stay(BaseModel):
    stay_id: str = Field(description="The stay id", default='')
    property_name: str = Field(description="The property name", default='')
    property_address: str = Field(description="The property address", default='')
    property_location: str = Field(description="The property location", default='')
    property_city: str = Field(description="The property city", default='')
    property_state: str = Field(description="The property state", default='')
    property_country: str = Field(description="The property country", default='')
    overall_rating: str = Field(description="The overall rating", default='')
    starting_price: int = Field(description="The starting price", default=0)
    currency: str = Field(description="The currency", default='')

class StaySuggestions(BaseModel):
    stays: List[Stay] = Field(description="The stays", default=[])

class Flight(BaseModel):
    airline: str = Field(description="The airline", default='')
    flight_number: str = Field(description="The flight number", default='')
    departure_time: str = Field(description="The departure time", default='')
    arrival_time: str = Field(description="The arrival time", default='')
    duration: str = Field(description="The duration", default='')
    price: int = Field(description="The price", default=0)
    
class Train(BaseModel):
    train_name: str = Field(description="The train name", default='')
    train_number: str = Field(description="The train number", default='')
    departure_time: str = Field(description="The departure time", default='')
    arrival_time: str = Field(description="The arrival time", default='')
    duration: str = Field(description="The duration", default='')
    price: int = Field(description="The price", default=0)
    
class Bus(BaseModel):
    bus_number: str = Field(description="The bus number", default='')
    operator: str = Field(description="The operator", default='')
    departure_time: str = Field(description="The departure time", default='')
    arrival_time: str = Field(description="The arrival time", default='')
    duration: str = Field(description="The duration", default='')
    price: int = Field(description="The price", default=0)

class Conveyances(BaseModel):
    flights: List[Flight] = Field(description="The flights", default=[])
    trains: List[Train] = Field(description="The trains", default=[])
    buses: List[Bus] = Field(description="The buses", default=[])

class Destination(BaseModel):
    """ A destination recommendation """
    city: str = Field(description="A Destination's City Name", default='')
    state: str = Field(description="The Destination's State Name", default='')
    country: str = Field(description="The Destination's Country Name", default='')
    images: List[str] = Field(description="verified URL to an image of the destination", default=[])
    highlights: str = Field(description="Short description highlighting key features", default='')
    rating: str = Field(description="Numerical rating (e.g., 4.5)", default='')
    map_url: str = Field(description="Maps URL for the destination", default='')
    estimated_budget: int = Field(description="Estimated budget for the destination in INR", default=0)
    suggested_days: int = Field(description="Suggested number of days to visit the destination (eg. 2 days, 3 days, 4 days, 5 days, 6 days, 7 days)", default=0)
    best_time_to_visit: str = Field(description="Best time to visit the destination (eg. January, February, March, April, May, June, July, August, September, October, November, December)", default='')
    
class POI(BaseModel):
    """ A place of interest """
    place_name: str = Field(description="The name of the place of interest", default='')
    address: str = Field(description="The address of the place of interest", default='')
    poi_type: Literal['attraction', 'restaurant', 'hotel', 'club', 'cafe', 'activity','event'] = Field(description="The type of the place of interest", default='')
    description: str = Field(description="Short description highlighting key features", default='')
    rating: str = Field(description="Numerical rating (e.g., 4.5)", default='')
    map_url: str = Field(description="The maps URL of the place of interest", default='')
    lat: float = Field(description="The latitude of the place of interest", default=0.0)
    long: float = Field(description="The longitude of the place of interest", default=0.0)
    photos: List[str] = Field(description="The photos of the place of interest", default=[])
    theme: List[str] = Field(description="The themes of the place of interest", default=[])
class POISuggestions(BaseModel):
    points_of_interest: List[POI] = Field(description="A list of place of interest suggestions", default=[])
    
class RoughTravelDates(BaseModel):
    """Rough travel date preferences collected during onboarding"""
    timeframe: str = Field(description="General timeframe (e.g., 'summer 2025', 'around Christmas', 'early next year')", default='')
    flexibility: Literal['very flexible', 'somewhat flexible', 'fixed dates'] = Field(description="How flexible the user is with dates", default='very flexible')
    duration: str = Field(description="Approximate trip duration (e.g., '3-5 days', 'a week', '2 weeks')", default='')
    avoid_dates: List[str] = Field(description="Dates/periods to avoid", default=[])
    preferred_season: str = Field(description="Preferred season if any", default='')

class TravelDates(BaseModel):
    start_date: str = Field(description="The start date of the trip in YYYY-MM-DD format (eg. 2025-01-01)", default='')
    end_date: str = Field(description="The end date of the trip in YYYY-MM-DD format (eg. 2025-01-01)", default='')

class BudgetBreakdown(BaseModel):
    food: int
    travel: int
    stay: int
    other: int

class Budget(BaseModel):
    currency: Optional[str] = "INR"
    overall_estimate: int = Field(description="The overall estimate of the budget in INR", default=None)
    breakdown: Optional[BudgetBreakdown] = Field(description="(Optional) The breakdown of the budget", default=None)

class Itinerary(BaseModel):
    trip_name: str = Field(description="The name of the trip", default='')
    
class Place(BaseModel):
    place_name: str = Field(description="The name of the place", default='')
    address: str = Field(description="The address of the place", default='')
    map_url: str = Field(description="The maps URL of the place", default='')
    lat: float = Field(description="The latitude of the place", default=0.0)
    long: float = Field(description="The longitude of the place", default=0.0)
    photos: List[str] = Field(description="The photos of the place", default=[])
    
class MustDoActivity(BaseModel):
    type: Literal['place', 'activity', 'food', 'event', 'shopping', 'wellness', 'transport'] = Field(description="The type of the activity", default='')
    category: str = Field(description="The sub type of the activity", default='')
    name: str = Field(description="The specifc name based on the type and category", default='')
    description: str = Field(description="The one or two line description about what the user should do based on the type and category", default='')
    
    
class DayPlan(BaseModel):
    day_number: int = Field(description="The number of the day", default=0)
    cities: List[Place] = Field(description="The cities to visit in the day", default=[])
    must_do_activities: List[MustDoActivity] = Field(description="The must do activities in the day", default=[])

class Trip(BaseModel):
    trip_title: str = Field(description="The title of the trip", default='')
    # trip_type: Literal['road_trip', 'multi_city', 'regional', 'country_explorer'] = Field(description="The type of the trip")
    no_of_days: int = Field(description="The estimated number of days in the trip", default=0)
    estimated_budget: int = Field(description="The estimated budget of the trip per person in INR", default=0)
    best_time_to_visit: str = Field(description="The best time to visit the trip in the year", default='')
    theme: List[str] = Field(description="The themes of the trip", default=[])
    day_wise_plan: List[DayPlan] = Field(description="The day wise plan of the trip", default=[])
    
    
class TripSuggestions(BaseModel):
    """ A list of recommended trip ideas """
    response_type: Literal['trip', 'text'] = Field(description="The type of the response, always 'trip'", default='trip')
    message: str = Field(description="The message to display to the user", default='')
    trips: List[Trip] = Field(description="A list of recommended trip ideas, keep it [] (empty list) if 'response_type' is 'text'", default=[])
    
    
class AttractionEvent(BaseModel):
    """An Attraction."""
    event_type: str = Field(default="visit")
    description: str = Field(
        description="A title or description of the activity or the attraction visit"
    )
    address: str = Field(description="Full address of the attraction")
    start_time: str = Field(description="Time in HH:MM format, e.g. 16:00")
    end_time: str = Field(description="Time in HH:MM format, e.g. 16:00")
    booking_required: bool = Field(default=False)
    price: Optional[str] = Field(description="Some events may cost money")


class FlightEvent(BaseModel):
    """A Flight Segment in the itinerary."""
    event_type: str = Field(default="flight")
    description: str = Field(description="A title or description of the Flight")
    booking_required: bool = Field(default=True)
    departure_airport: str = Field(description="Airport code, i.e. SEA")
    arrival_airport: str = Field(description="Airport code, i.e. SAN")
    flight_number: str = Field(description="Flight number, e.g. UA5678")
    boarding_time: str = Field(description="Time in HH:MM format, e.g. 15:30")
    seat_number: str = Field(description="Seat Row and Position, e.g. 32A")
    departure_time: str = Field(description="Time in HH:MM format, e.g. 16:00")
    arrival_time: str = Field(description="Time in HH:MM format, e.g. 20:00")
    price: Optional[str] = Field(description="Total air fare")
    booking_id: Optional[str] = Field(
        description="Booking Reference ID, e.g LMN-012-STU"
    )


class HotelEvent(BaseModel):
    """A Hotel Booking in the itinerary."""
    event_type: str = Field(default="hotel")
    description: str = Field(description="A name, title or a description of the hotel")
    address: str = Field(description="Full address of the attraction")
    check_in_time: str = Field(description="Time in HH:MM format, e.g. 16:00")
    check_out_time: str = Field(description="Time in HH:MM format, e.g. 15:30")
    room_selection: str = Field()
    booking_required: bool = Field(default=True)
    price: Optional[str] = Field(description="Total hotel price including all nights")
    booking_id: Optional[str] = Field(
        description="Booking Reference ID, e.g ABCD12345678"
    )


class ItineraryDay(BaseModel):
    """A single day of events in the itinerary."""
    day_number: int = Field(
        description="Identify which day of the trip this represents, e.g. 1, 2, 3... etc."
    )
    date: str = Field(description="The Date this day YYYY-MM-DD format")
    events: list[Union[FlightEvent, HotelEvent, AttractionEvent]] = Field(
        default=[], description="The list of events for the day"
    )


class Itinerary(BaseModel):
    """A multi-day itinerary."""
    trip_name: str = Field(
        description="Simple one liner to describe the trip. e.g. 'San Diego to Seattle Getaway'"
    )
    start_date: str = Field(description="Trip Start Date in YYYY-MM-DD format")
    end_date: str = Field(description="Trip End Date in YYYY-MM-DD format")
    origin: str = Field(description="Trip Origin, e.g. San Diego")
    destination: str = (Field(description="Trip Destination, e.g. Seattle"),)
    days: list[ItineraryDay] = Field(
        default_factory=list, description="The multi-days itinerary"
    )
    
class OnboardingAgent(BaseModel):
    response_type: Literal['text'] = Field(description="The type of the response, always 'text'", default='text')
    message: str = Field(description="The message to display to the user", default='')

class State(BaseModel):
    user_id: str = ''
    user_profile: Optional[UserProfile] = None
    group_details: Optional[GroupDetails] = None
    budget: Optional[Budget] = None
    origin: Optional[str] = ''
    rough_dates: Optional[RoughTravelDates] = None  # Stage 1
    specific_dates: Optional[TravelDates] = None    # Stage 2
    # destinations: Optional[DestinationIdeas] = None
    trips: Optional[TripSuggestions] = None
    pois: Optional[POISuggestions] = None
    google_search_grounding: Optional[str] = None