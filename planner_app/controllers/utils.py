from ..schema.utils_schema import ConveyanceSchema
from ..shared.sql_query import execute_sql_query

async def get_conveyances_controller(conveyance_details:ConveyanceSchema):
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
        
        result = await execute_sql_query(sql_query_flights) + await execute_sql_query(sql_query_trains)
        return result
    except Exception as e:
        print("Error in get_conveyance_controller: ", str(e))
        return []