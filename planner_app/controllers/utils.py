from ..schema.utils_schema import ConveyanceSchema, StaySchema
from ..shared.logging import logger

import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from shared.sql_query import execute_sql_query


async def get_conveyances_controller(conveyance_details: ConveyanceSchema):
    try:
        sql_query_flights = f"""
        SELECT *
        FROM `itinerai-41751.flightsdata.dectable`
        WHERE
            LOWER(departure_airport.city) = LOWER("{conveyance_details.departure_city}")
            AND 
            LOWER(arrival_airport.city) = LOWER("{conveyance_details.arrival_city}")
            AND 
            departure_date BETWEEN
                "{conveyance_details.from_date}"
                AND
                "{conveyance_details.to_date}"
        """
        sql_query_trains = f"""
        SELECT *
        FROM `itinerai-41751.trainsdata.mytable`
        WHERE
            LOWER(departure_station.city) = LOWER("{conveyance_details.departure_city}")
            AND 
            LOWER(arrival_station.city) = LOWER("{conveyance_details.arrival_city}")
            AND 
            departure_date BETWEEN
                "{conveyance_details.from_date}"
                AND
                "{conveyance_details.to_date}"
        """

        if conveyance_details.conveyance_type == "flights":
            result = await execute_sql_query(sql_query_flights)
        else:
            result = await execute_sql_query(sql_query_trains)
        return result
    except Exception as e:
        logger.warning(f"Error in get_conveyances_controller\nError: {str(e)}")
        return []


async def get_stays_controller(stay_details: StaySchema):
    try:
        sql_query = f"""
        SELECT * 
        FROM `itinerai-41751.hotelsdata.dectable`
        WHERE
            LOWER(city) = LOWER("{stay_details.city}")
            AND available_from_date >= "{stay_details.from_date}"
            AND available_until_date >= "{stay_details.to_date}"
        """
        result = await execute_sql_query(sql_query)
        return result
    except Exception as e:
        logger.warning(f"Error in get_stays_controller\nError: {str(e)}")
        return []
