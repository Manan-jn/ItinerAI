import json

from ..schema.chat_schema import *
from ..exceptions.base import AppException
from ..shared.log_config import logger

async def get_conveyance_user_query(request: ConveyanceRequest):
    try:
        if request.user_query:
            message = f"""{{ "role": "user", "from_city": "{request.from_city}", "from_country": "{request.from_country}", "to_city": "{request.to_city}", "to_country": "{request.to_country}", "date": "{request.date}", "user_query": "{request.user_query}" }}"""
        else:
            message = f"""{{ "role": "admin", "from_city": "{request.from_city}", "from_country": "{request.from_country}", "to_city": "{request.to_city}", "to_country": "{request.to_country}", "date": "{request.date}" }}"""
    
        return message
    except Exception as e:
        logger.error(f"Error in get_conveyance_user_query\nError: {str(e)}")
        raise AppException(message=str(e))

async def get_stay_user_query(request: StayRequest):
    try:
        if request.user_query:
            message = f"""{{ "role": "user", "city": "{request.city}", "country": "{request.country}", "check_in_date": "{request.check_in_date}", "check_out_date": "{request.check_out_date}", "user_query": "{request.user_query}" }}"""
        else:
            message = f"""{{ "role": "admin", "city": "{request.city}", "country": "{request.country}", "check_in_date": "{request.check_in_date}", "check_out_date": "{request.check_out_date}" }}"""
        return message
    except Exception as e:
        logger.error(f"Error in get_stay_user_query\nError: {str(e)}")
        raise AppException(message=str(e))

async def get_travel_dates_user_query(request: TravelDatesRequest):
    try:
        if request.role == "admin":
            message = f"Recommend the travel dates for the month - {request.current_month}"
        else:
            message = request.user_message
        
        user_query = f"""{{ "current_month": "{request.current_month}", "message": {{ "role": "{request.role}", "query": "{message}" }} }}"""
        return user_query
    except Exception as e:
        logger.error(f"Error in get_travel_dates_user_query\nError: {str(e)}")
        raise AppException(message=str(e))

async def get_itinerary_user_query(request: ItineraryRequest):
    try:
        current_day = request.current_day
        trip_duration = request.trip_duration
        current_itinerary = request.current_itinerary
        
        if request.request_type == "add":
            if current_itinerary[current_day-1].get("conveyance_details") and current_itinerary[current_day-1]['conveyance_details']["is_required"]:
                user_query = f"User added a new day, to take a detour to {current_itinerary[current_day-1]['conveyance_details']['to_city']}. Recommend the itinerary for Day {current_day}, based on the updated `current_itinerary` accordingly."
            else:
                user_query = f"User added a new day, to explore the same city in the `current_itinerary`. Recommend the itinerary for Day {current_day}, based on the updated `current_itinerary` accordingly."
        elif request.request_type == "remove":
            user_query = f"User removed the day(s) from the itinerary. Recommend the itinerary for Day {current_day} based on the updated `current_itinerary` accordingly."
        elif request.request_type == "generate":
            if request.role == "admin":
                user_query = f"Recommend the itinerary for the Day {current_day} of the trip, based on the updated `current_itinerary`"
            else:
                user_query = request.user_message
        
        user_query = f"""{{ "current_day": {current_day}, "trip_duration": {trip_duration}, "message": {{ "role": "{request.role}", "query": "{user_query}" }} }}"""
        return user_query
    except Exception as e:
        logger.error(f"Error in get_itinerary_user_query\nError: {str(e)}")
        raise AppException(message=str(e))
    
async def get_in_trip_user_query(request: InTripRequest):
    try:
        request = request.model_dump()
        if len(request["change_of_events"]):
            change_of_events = json.dumps(request["change_of_events"])
            query = f"Update the itinerary based on the provided change of the events"
            if request["user_message"]:
                query += f". Also, address the user's query: {request['user_message']}"
            
            user_query = f"""{{ "change_of_events": {change_of_events}, "message": {{ "role": "admin", "query": "{query}" }} }}"""
        elif request["user_message"]:
            user_query = f"""{{ "message": {{ "role": "user", "query": "{request['user_message']}" }} }}"""
        else:
            return "" 
        
        return user_query
    except Exception as e:
        logger.error(f"Error in get_in_trip_user_query\nError: {str(e)}")
        raise AppException(message=str(e))
    