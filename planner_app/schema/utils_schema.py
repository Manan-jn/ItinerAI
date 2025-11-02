from pydantic import BaseModel, Field
from typing import *


class ConveyanceSchema(BaseModel):
    user_id: str = Field(description="User ID")
    conveyance_type: Literal["flights", "trains"] = Field(description="Type of conveyance")
    departure_city: str = Field(description="City of departure")
    departure_country: str = Field(description="Country of departure")
    arrival_city: str = Field(description="City of arrival")
    arrival_country: str = Field(description="Country of arrival")
    start_date: str = Field(description="Departure start date in YYYY-MM-DD format")
    end_date: str = Field(description="Departure end date in YYYY-MM-DD format")

class StaySchema(BaseModel):
    user_id: str = Field(description="User ID")
    city: str = Field(description="City of stay")
    state: str = Field(description="State of stay")
    country: str = Field(description="Country of stay")
    start_check_in_date: str = Field(description="Check-in date in YYYY-MM-DD format")
    end_check_in_date: str = Field(description="End check-in date in YYYY-MM-DD format")
    duration: int = Field(description="Duration of stay in days")
