from datetime import datetime
from pydantic import BaseModel, Field


class SessionSchema(BaseModel):
    user_id: str = Field(description="The user ID")
    session_id: str = Field(description="The session ID")


class AddMemorySchema(BaseModel):
    user_id: str = Field(description="The user ID")
    session_id: str = Field(description="The session ID")
    updates: dict = Field(description="The state changes")
    invocation_id: str = Field(
        description="The invocation ID for internal logging of chats",
        default=f"add_memory:{datetime.now().strftime('%Y%m%d%H%M%S')}",
    )


class DeleteMemorySchema(BaseModel):
    user_id: str = Field(description="The user ID")
    session_id: str = Field(description="The session ID")
    memory_keys: list[str] = Field(description="The memory key to delete")
    invocation_id: str = Field(
        description="The invocation ID for internal logging of chats",
        default=f"delete_memory:{datetime.now().strftime('%Y%m%d%H%M%S')}",
    )
