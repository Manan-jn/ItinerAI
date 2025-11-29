import httpx
from typing import List, Optional, Literal
from typing_extensions import Union
from pydantic import BaseModel, Field
from google.genai import types
from google.genai.types import SafetySetting


json_response_config = types.GenerateContentConfig(
    # response_mime_type="application/json"
    response_mime_type="text/plain"
)

safety_settings = [
    SafetySetting(
        category=types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    ),
    SafetySetting(
        category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    ),
    SafetySetting(
        category=types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    ),
    SafetySetting(
        category=types.HarmCategory.HARM_CATEGORY_JAILBREAK,
        threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    ),
    SafetySetting(
        category=types.HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    ),
]

http_options = types.HttpOptions(
    retry_options=types.HttpRetryOptions(
        initial_delay=5, attempts=2, exp_base=2, jitter=0.5
    ),
    # httpx_async_client=httpx.AsyncClient(
    #     timeout=30.0,
    #     limits=httpx.Limits(max_connections=100, max_keepalive_connections=100),
    # )
)


class UserProfile(BaseModel):
    """User Profile"""

    name: str = Field(description="The name of the user", default="")
    age: int = Field(description="The age of the user", default=0)
    gender: Literal["male", "female", "other", "prefer not to say"] = Field(
        description="The gender of the user", default="prefer not to say"
    )
    passport_nationality: str = Field(
        description="The passport nationality of the user", default=""
    )
    allergies: List[str] = Field(description="The allergies of the user", default=[])
    emergency_contact: List[str] = Field(
        description="The emergency contact of the user", default=[]
    )
    travel_history: List[str] = Field(
        description="The travel history of the user", default=[]
    )
    general_preferences: List[str] = Field(
        description="The general preferences of the user like food, activities, destinations etc.",
        default=[],
    )

class State(BaseModel):
    user_id: str = ""
    user_profile: Optional[UserProfile] = None
