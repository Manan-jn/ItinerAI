from ..schema.chat_schema import ItineraryRequest
from ..exceptions.base import AppException

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
        print(f"Error in get_itinerary_user_query: {e}")
        raise AppException(message=str(e))