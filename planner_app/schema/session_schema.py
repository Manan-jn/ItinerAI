import zoneinfo
from datetime import datetime
from pydantic import BaseModel, Field


class CreateSessionSchema(BaseModel):
    user_id: str = Field(description="The user ID")
    phone_number: str = Field(description="The phone number")
    created_at: str = Field(description="The datetime", default=datetime.now(zoneinfo.ZoneInfo("Asia/Kolkata")).strftime(
        "%Y-%m-%d %H:%M:%S"
    ))

class SessionSchema(BaseModel):
    # user_id: str = Field(description="The user ID")
    # session_id: str = Field(description="The session ID")
    phone_number: str = Field(description="The phone number")
