from datetime import datetime
from pydantic import BaseModel, Field


class CreateSessionSchema(BaseModel):
    user_id: str = Field(description="The user ID")

class SessionSchema(BaseModel):
    user_id: str = Field(description="The user ID")
    session_id: str = Field(description="The session ID")
