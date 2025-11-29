from pydantic import BaseModel, Field, model_validator

class GetMemorySchema(BaseModel):
    user_id: str = Field(description="The user ID", default=None)
    session_id: str = Field(description="The session ID", default=None)
    phone_number: str = Field(description="The phone number", default=None)

    @model_validator(mode="before")
    def validate_identity(cls, values):
        user = values.get("user_id")
        session = values.get("session_id")
        phone = values.get("phone_number")

        if phone:
            return values
        if user and session:
            return values

        raise ValueError(
            "You must provide either phone_number OR both user_id and session_id."
        )

class AddMemorySchema(BaseModel):
    user_id: str = Field(description="The user ID")
    session_id: str = Field(description="The session ID")
    updates: dict = Field(description="The state changes")


class DeleteMemorySchema(BaseModel):
    user_id: str = Field(description="The user ID")
    session_id: str = Field(description="The session ID")
    memory_keys: list[str] = Field(description="The memory key to delete")
