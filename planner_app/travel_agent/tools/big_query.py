import json
import os
from typing import Any, Literal
import dotenv
# from google.adk.agents import LlmAgent
# from google.adk.tools import AgentTool
from google.oauth2 import service_account
from google.adk.tools.bigquery import BigQueryToolset
from google.adk.tools.bigquery.config import BigQueryToolConfig
from google.adk.tools.bigquery.config import WriteMode
from google.adk.tools.bigquery import BigQueryCredentialsConfig
from google.cloud import bigquery

import os 
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from shared.sql_query import execute_sql_query
# from ...shared.sql_query import execute_sql_query

# dotenv.load_dotenv()

# tool_config = BigQueryToolConfig(write_mode=WriteMode.BLOCKED)

# key_contents_str = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
# key_contents = json.loads(key_contents_str)

# credentials = service_account.Credentials.from_service_account_info(
#     key_contents, scopes=["https://www.googleapis.com/auth/bigquery"]
# )
# # credentials = service_account.Credentials.from_service_account_file(
# #     key_path,
# #     scopes=["https://www.googleapis.com/auth/bigquery"]
# # )
# credentials_config = BigQueryCredentialsConfig(credentials=credentials)


# bigquery_tool = BigQueryToolset(
#     credentials_config=credentials_config, bigquery_tool_config=tool_config
# )

# bigquery_agent = LlmAgent(
#     model="gemini-2.5-flash",
#     name="bigquery_agent",
#     description="Agent to talk with BigQuery database.",
#     instruction="""
#     You are an expert SQL Query agent who will query the BigQuery database to get the best options for the Conveyance/Transportation & Stays for the trip.

#     You are provided with the following tools:
#     - `bigquery_tool`: to query the BigQuery database. You may use this tool parallelly (10-15 times or more if needed) to get the best options for the Conveyance/Transportation & Stays for the trip.

#     Tables Details:
#         - `itinerai-41751.flightsdata.mytable` (flights)
#         - `itinerai-41751.trainsdata.mytable` (trains)
#         - `itinerai-41751.hotelsdata.mytable` (hotels)

#     - Here's the optimal flow:
#         - first figure out the type of query: `conveyance/transportation` or `stay`.
#             - If the query is for `conveyance/transportation`, then use the `trains`, and `flights` tables.
#             - If the query is for `stay`, then use the `hotels` table.
#         - then inspect the relevant table schema(s) using a BigQuery SQL `INFORMATION_SCHEMA` call.
#         - use the schema details to compose a precise and efficient SQL query with limit of 10, tailored to the user's request, searching for matching trains, or flights.
#         - run the SQL query against the appropriate table(s) to extract the needed details/options.
#         - if the user's request is ambiguous or incomplete, request any additional necessary details before running a query.

#     Return the response as a JSON object formatted like this:
#     - If the query is for `conveyance/transportation`, then return the response as a JSON object formatted like this:
#         <RESPONSE_FORMAT>
#             {{
#                 "response_type" ENUM(conveyance, text): "conveyance" (use 'conveyance' if you are recommending the conveyance options for the trip; use 'text' when you need to conversate with the user to ask or clarify something),
#                 "message" str: "", (Your response to display to the user, keep it "" (empty string) if 'response_type' is 'conveyance'; otherwise, your response to display to the user)
#                 "available_conveyances":{{
#                     "from_city": "", (Name of the start city)
#                     "to_city": "", (Name of the end city)
#                     "flights": [
#                         {{
#                         "flight_number": "", (Flight number)
#                         "airline": "", (Name of the airline)
#                         "daparture_date": "", (Departure date in yyyy-mm-dd format)
#                         "departure_time": "", (Departure time)
#                         "arival_date": "" (Arival date in yyyy-mm-dd format)
#                         "arrival_time": "", (Arrival time)
#                         "duration": "", (Duration of the flight)
#                         "price": "", (Price of the flight)
#                         }}
#                     ],
#                     "trains": [
#                         {{
#                         "train_number": "", (Train number)
#                         "train_name": "", (Name of the train)
#                         "daparture_date": "", (Departure date in yyyy-mm-dd format)
#                         "departure_time": "", (Departure time)
#                         "arival_date": "" (Arival date in yyyy-mm-dd format)
#                         "arrival_time": "", (Arrival time)
#                         "duration": "", (Duration of the train)
#                         "price": "", (Price of the train)
#                         }}
#                     ]
#                 }}
#             }}
#         </RESPONSE_FORMAT>
#     - If the query is for `stay`, then return the response as a JSON object formatted like this:
#         <RESPONSE_FORMAT>
#         {{
#             "response_type" ENUM(stay, text): "stay" (use 'stay' if you are recommending the stay options for the trip; use 'text' when you need to conversate with the user to ask or clarify something),
#             "message" str: "", (Your response to display to the user, keep it "" (empty string) if 'response_type' is 'stay'; otherwise, your response to display to the user)
#             "available_stays": [ { ...hotel option details... } ]
#         }}
#         </RESPONSE_FORMAT>
#         - Each object should include fields such as `property_name`, `property_address`, `property_location`, `property_city`, `property_state`, `property_country`, `overall_rating`, `starting_price`, `currency`, `property_price`, and any other relevant columns from your tables.


#     - your role is to only answer strictly based on the database contents.
#     - provide distinct bus, train, flights, hotels options, as appropriate, in your response.
#     - reference the correct tables for each mode of transport.
#     - strictly stick with the response format provided within the <RESPONSE_FORMAT/> block, do not deviate from the format.
#     """,
#     tools=[bigquery_tool],
#     output_key="bigquery_response",
# )

# query_tool = AgentTool(
#     agent=bigquery_agent
# )

# client = bigquery.Client(project="itinerai-41751", credentials=credentials)

async def conveyance_query_tool(
    conveyance_type: Literal["flights", "trains"],
    departure_city: str,
    arrival_city: str,
    preferred_start_date: str,
    preferred_end_date: str,
) -> dict:
    """
    Tool to get records from the BigQuery Database.
    
    Args:
        conveyance_type (Literal["flights", "trains"]): 
            Type of transportation to query data for — either "flights" or "trains".
        departure_city (str): 
            Name of the departure city.
        arrival_city (str): 
            Name of the arrival city.
        preferred_start_date (str): 
            Earliest acceptable departure date (in 'YYYY-MM-DD' format).
        preferred_end_date (str): 
            Latest acceptable departure date (in 'YYYY-MM-DD' format).
            
    Returns:
        dict:
            Returns a dictionary containing 'status' & 'response' 
    """
    try:
        table_name = "itinerai-41751.flightsdata.dectable" if conveyance_type == 'flights' else "itinerai-41751.trainsdata.mytable"
        tranportation_hub = "airport" if conveyance_type == 'flights' else "station"
        QUERY = f"""
        SELECT * 
        FROM `{table_name}` 
        WHERE
            LOWER(departure_{tranportation_hub}.city) = LOWER("{departure_city}")
            AND LOWER(arrival_{tranportation_hub}.city) = LOWER("{arrival_city}")
            AND departure_date BETWEEN "{preferred_start_date}" AND "{preferred_end_date}"
        LIMIT 10
        """
        result = await execute_sql_query(QUERY)
        return {
            "status": "success",
            "response": result
        }
    except Exception as e:
        print("Error in conveyace_query_tool: ", str(e))
        return {"status": "error", "error": str(e)}
    
async def stay_query_tool(
    city: str,
    check_in_date: str,
    check_out_date: str,
) -> dict:
    """
    Tool to get records from the BigQuery Database.
    
    Args:
        city (str): 
            Name of the city.
        check_in_date (str): 
            Check-in date (in 'YYYY-MM-DD' format).
        check_out_date (str): 
            Check-out date (in 'YYYY-MM-DD' format).
            
    Returns:
        dict:
            Returns a dictionary containing 'status' & 'response' 
    """
    try:
        QUERY = f"""
        SELECT * 
        FROM `itinerai-41751.hotelsdata.dectable`
        WHERE
            LOWER(city) = LOWER("{city}")
            AND available_from_date >= "{check_in_date}"
            AND available_until_date >= "{check_out_date}"
        LIMIT 15
        """
        result = await execute_sql_query(QUERY)
        return {
            "status": "success",
            "response": result
        }
    except Exception as e:
        print("Error in stay_query_tool: ", str(e))
        return {"status": "error", "error": str(e)}    


# print(query_tool('trains', 'agra', 'new delhi', '2025-12-01', '2025-12-31'))
# print(stay_query_tool('agra', '2025-12-01', '2025-12-03'))