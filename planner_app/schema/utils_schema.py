from pydantic import BaseModel, Field
from typing import *


class ConveyanceSchema(BaseModel):
    departure_city: str = Field(description="City of departure")
    arrival_city: str = Field(description="City of arrival")
    from_date: str = Field(description="Start date in YYYY-MM-DD format")
    to_date: str = Field(description="Start date in YYYY-MM-DD format")

class StaySchema(BaseModel):
    city: str = Field(description="City of departure")
    from_date: str = Field(description="Start date in YYYY-MM-DD format")
    to_date: str = Field(description="Start date in YYYY-MM-DD format")
