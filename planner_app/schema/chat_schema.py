from datetime import datetime
from pydantic import BaseModel, Field
from typing import Literal

class ChatRequest(BaseModel):
    user_id: str
    session_id: str
    message: str
    invocation_id: str = Field(
        description="The invocation ID for internal logging of chats",
        default=f"itinerary_chat:{datetime.now().strftime('%Y%m%d%H%M%S')}",
    )
    
class ItineraryRequest(BaseModel):
    user_id: str
    session_id: str
    current_itinerary: list[dict]
    request_type: Literal["add", "remove", "generate"]
    role: Literal["user", "admin"]
    current_day: int
    trip_duration: int
    user_message: str = Field(description="The message from the user", default="")
    invocation_id: str = Field(
        description="The invocation ID for internal logging of chats",
        default=f"itinerary_chat:{datetime.now().strftime('%Y%m%d%H%M%S')}",
    )