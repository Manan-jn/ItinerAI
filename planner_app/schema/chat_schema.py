from datetime import datetime
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    user_id: str
    session_id: str
    message: str


class ChatResponse(BaseModel):
    user_id: str
    session_id: str
    message: str
    
class ItineraryRequest(BaseModel):
    user_id: str
    session_id: str
    message: str
    current_itinerary: list[dict]
    invocation_id: str = Field(
        description="The invocation ID for internal logging of chats",
        default=f"itinerary_chat:{datetime.now().strftime('%Y%m%d%H%M%S')}",
    )