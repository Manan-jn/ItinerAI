from typing import List, Optional, Literal
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
    city: str = Field(description="A Origin's City Name", default='')
    state: str = Field(description="The Origin's State Name", default='')
    country: str = Field(description="The Origin's Country Name", default='')
    maps_url: str = Field(description="Maps URL for the Origin", default='')

class Destination(BaseModel):
    """ A destination recommendation """
    city: str = Field(description="A Destination's City Name", default='')
    state: str = Field(description="The Destination's State Name", default='')
    country: str = Field(description="The Destination's Country Name", default='')
    images: List[str] = Field(description="verified URL to an image of the destination", default=[])
    highlights: str = Field(description="Short description highlighting key features", default='')
    rating: str = Field(description="Numerical rating (e.g., 4.5)", default='')
    maps_url: str = Field(description="Maps URL for the destination", default='')
    estimated_budget: int = Field(description="Estimated budget for the destination in INR", default=0)
    suggested_days: int = Field(description="Suggested number of days to visit the destination (eg. 2 days, 3 days, 4 days, 5 days, 6 days, 7 days)", default=0)
    best_time_to_visit: str = Field(description="Best time to visit the destination (eg. January, February, March, April, May, June, July, August, September, October, November, December)", default='')

# class DestinationIdeas(BaseModel):
#     """ A list of destination ideas """
#     places: List[Destination] = Field(description="A list of destination ideas", default=[])
    
class POI(BaseModel):
    """ A place of interest """
    place_name: str = Field(description="The name of the place of interest", default='')
    maps_url: str = Field(description="Maps URL for the place of interest", default='')
    description: str = Field(description="The description of the place of interest", default='')
    images: List[str] = Field(description="verified URLs to an image of the place of interest", default=[])
    rating: str = Field(description="Numerical rating (e.g., 4.5)", default='')
    
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
    name: str = Field(description="The name of the place", default='')
    city: str = Field(description="The city or area or districtof the place", default='')
    state: str = Field(description="The state of the place", default='')
    country: str = Field(description="The country of the place", default='')
    must_visit_spots: List[str] = Field(description="The must visit spots of the place", default=[])
    map_url: str = Field(description="The map URL of the place", default='')
    image_url: str = Field(description="The image URL of the place", default='')
    start_date: str = Field(description="The start date of the place", default='')
    end_date: str = Field(description="The end date of the place", default='')
    total_stay_duration: str = Field(description="The total stay duration of the place", default='')
    
class ClusterJourney(BaseModel):
    cluster_type: Literal['custom', 'route', 'cluster', "state_level", "country_level", "multiple_countries"] = Field(
        description="""The type of the cluster journey.
        - custom: Custom cluster journey
        - route: Trip from one place to another place, covering multiple places in between.
        - cluster: Cluster cluster journey. Trip covering multiple places (can have different states, but cities must be close to each other around 80 Kms apart) in a cluster.
        - state_level: State or Union Territory level cluster journey. Trip covering multiple cities in a same state or Union Territory (eg. Goa, Leh Ladakh..). 
        - country_level: Country level cluster journey. Trip covering multiple cities in a same country.
        - multiple_countries: Multiple countries cluster journey. Trip covering multiple cities in multiple countries."""
    )
    start_date: str = Field(description="The start date of the cluster journey", default='')
    end_date: str = Field(description="The end date of the cluster journey", default='')
    start_destination: str = Field(description="The start destination of the cluster journey", default='')
    final_destination: str = Field(description="The final destination of the cluster journey", default='')
    recommended_mode_of_transport: str = Field(description="The recommended modes of transport for the cluster journey", default='')
    estimated_cost: str = Field(description="The estimated cost of the cluster journey", default='')
    round_trip_duration: str = Field(description="The round trip duration of the cluster journey", default='')
    list_of_places: List[Place] = Field(description="The list of places to visit in the cluster journey", default=[])
    best_time_to_visit: str = Field(description="The best time to visit the cluster journey", default='')
    
class DestinationIdeas(BaseModel):
    """ A list of destination ideas """
    places: List[ClusterJourney] = Field(description="A list of destination ideas", default=[])
    
class State(BaseModel):
    user_id: str = ''
    user_profile: Optional[UserProfile] = None
    group_details: Optional[GroupDetails] = None
    budget: Optional[Budget] = None
    origin: Optional[str] = ''
    rough_dates: Optional[RoughTravelDates] = None  # Stage 1
    specific_dates: Optional[TravelDates] = None    # Stage 2
    destinations: Optional[DestinationIdeas] = None
    pois: Optional[POISuggestions] = None