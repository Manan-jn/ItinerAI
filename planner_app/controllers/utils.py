from ..schema.utils_schema import ConveyanceSchema, StaySchema
from ..shared.log_config import logger
from ..shared.sql_query import fetch_flight_data

import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from shared.sql_query import fetch_flight_data, fetch_train_data, fetch_stay_data


async def get_conveyances_controller(conveyance_details: ConveyanceSchema):
    try:
        if conveyance_details.conveyance_type == "flights":
            result = await fetch_flight_data(conveyance_details.user_id, conveyance_details.start_date, conveyance_details.end_date, conveyance_details.departure_city, conveyance_details.departure_country, conveyance_details.arrival_city, conveyance_details.arrival_country)
        else:
            result = await fetch_train_data(conveyance_details.user_id, conveyance_details.start_date, conveyance_details.end_date, conveyance_details.departure_city, conveyance_details.arrival_city, conveyance_details.departure_country, conveyance_details.arrival_country)
        return result
    except Exception as e:
        logger.error(f"Error in get_conveyances_controller\nError: {str(e)}")
        return []


async def get_stays_controller(stay_details: StaySchema):
    try:
        result = await fetch_stay_data(stay_details.user_id, stay_details.start_check_in_date, stay_details.end_check_in_date, stay_details.duration, stay_details.city, stay_details.state, stay_details.country)
        return result
    except Exception as e:
        logger.error(f"Error in get_stays_controller\nError: {str(e)}")
        return []
