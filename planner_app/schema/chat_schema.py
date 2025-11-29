import zoneinfo
from datetime import datetime
from pydantic import BaseModel, Field, model_validator
from typing import Annotated, List, Literal, Union

class ChatRequest(BaseModel):
    user_id: str
    session_id: str
    message: str
    invocation_id: str = Field(
        description="The invocation ID for internal logging of chats",
        default=f"itinerary_chat:{datetime.now().strftime('%Y%m%d%H%M%S')}",
    )
    datetime: str = Field(
        default=datetime.now(zoneinfo.ZoneInfo("Asia/Kolkata")).strftime(
            "%Y-%m-%d %H:%M:%S"
        )
    )

class ConveyanceRequest(BaseModel):
    user_id: str
    session_id: str
    from_city: str
    from_country: str
    to_city: str
    to_country: str
    date: str
    user_query: str = Field(default="")
    datetime: str = Field(
        default=datetime.now(zoneinfo.ZoneInfo("Asia/Kolkata")).strftime(
            "%Y-%m-%d %H:%M:%S"
        )
    )
    
class StayRequest(BaseModel):
    user_id: str
    session_id: str
    city: str
    country: str
    check_in_date: str
    check_out_date: str
    user_query: str = Field(default="")
    datetime: str = Field(
        default=datetime.now(zoneinfo.ZoneInfo("Asia/Kolkata")).strftime(
            "%Y-%m-%d %H:%M:%S"
        )
    )

class TravelDatesRequest(BaseModel):
    user_id: str
    session_id: str
    role: Literal["user", "admin"]
    current_month: str
    user_message: str = Field(description="The message from the user", default="")
    datetime: str = Field(
        default=datetime.now(zoneinfo.ZoneInfo("Asia/Kolkata")).strftime(
            "%Y-%m-%d %H:%M:%S"
        )
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
    datetime: str = Field(
        default=datetime.now(zoneinfo.ZoneInfo("Asia/Kolkata")).strftime(
            "%Y-%m-%d %H:%M:%S"
        )
    )


class PreTripRequest(BaseModel):
    user_id: str
    session_id: str
    datetime: str = Field(
        default=datetime.now(zoneinfo.ZoneInfo("Asia/Kolkata")).strftime(
            "%Y-%m-%d %H:%M:%S"
        )
    )


class FlightScheduleChangeEvent(BaseModel):
    event_type: Literal["FLIGHT_SCHD_CHG"] = "FLIGHT_SCHD_CHG"
    flight_number: str
    updated_arrival_date: str
    updated_arrival_time: str
    updated_departure_date: str
    updated_departure_time: str
    flight_update_message: str = Field(
        description="The update message on the flight",
        default="The flight has been delayed from its scheduled time.",
    )


class BadWeatherEvent(BaseModel):
    event_type: Literal["WEATHER_CHG"] = "WEATHER_CHG"
    city: str
    country: str
    date: str
    weather_condition: str = Field(
        description="The weather condition in the city",
        default="Weather conditions are bad.",
    )


class InTripRequest(BaseModel):
    user_id: str
    session_id: str
    change_of_events: List[
        Annotated[
            Union[FlightScheduleChangeEvent, BadWeatherEvent],
            Field(discriminator="event_type"),
        ]
    ] = Field(default=[])
    user_message: str = Field(description="The message from the user", default="")
    datetime: str = Field(
        default=datetime.now(zoneinfo.ZoneInfo("Asia/Kolkata")).strftime(
            "%Y-%m-%d %H:%M:%S"
        )
    )
    # location_history: list[dict] = Field(description="The timeline of the user's location", default=[])

class GoogleServicesRequest(BaseModel):
    user_id: str = Field(default=None)
    session_id: str = Field(default=None)   
    phone_number: str = Field(default=None)
    query: str
    datetime: str = Field(
        default=datetime.now(zoneinfo.ZoneInfo("Asia/Kolkata")).strftime(
            "%Y-%m-%d %H:%M:%S"
        )
    )
    
    @model_validator(mode="before")
    def validate_identity(cls, values):
        user = values.get("user_id")
        session = values.get("session_id")
        phone = values.get("phone_number")

        # Rule: Accept phone_number OR (user_id + session_id)
        if phone:
            return values
        if user and session:
            return values

        raise ValueError(
            "You must provide either phone_number OR both user_id and session_id."
        )