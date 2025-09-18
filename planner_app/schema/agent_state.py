from typing import TypedDict, List, Optional, Literal
from pydantic import BaseModel

class UserProfile(BaseModel):
    user_id: Optional[str] = None
    passport_nationality: Optional[str] = None
    food_preferences: Optional[List[str]] = None
    seat_preference: Optional[List[str]] = None
    allergies: Optional[List[str]] = None
    emergency_contact: Optional[List[str]] = None
    travel_history: Optional[List[str]] = None

class BudgetBreakdown(BaseModel):
    food: int
    travel: int
    stay: int
    other: int

class Budget(BaseModel):
    currency: Optional[str] = "INR"
    overall_estimate: int
    breakdown: Optional[BudgetBreakdown] = None

class State(BaseModel):
    user_id: str
    # user_profile: Optional[List[UserProfile]] = []
    # user_profile: dict = {}
    user_profile: Optional[UserProfile] = None
    trip_type: Literal['group', 'solo'] = 'solo'
    budget: Optional[Budget] = None