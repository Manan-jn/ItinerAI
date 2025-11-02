from pydantic import BaseModel, Field


class GetMemorySchema(BaseModel):
    user_id: str = Field(description="The user ID")
    session_id: str = Field(description="The session ID")


class AddMemorySchema(BaseModel):
    user_id: str = Field(description="The user ID")
    session_id: str = Field(description="The session ID")
    updates: dict = Field(description="The state changes")


class DeleteMemorySchema(BaseModel):
    user_id: str = Field(description="The user ID")
    session_id: str = Field(description="The session ID")
    memory_keys: list[str] = Field(description="The memory key to delete")
