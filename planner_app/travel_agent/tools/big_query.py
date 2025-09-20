import os 
import dotenv
from google.adk.agents import LlmAgent
from google.adk.tools import AgentTool
from google.oauth2 import service_account
from google.adk.tools.bigquery import BigQueryToolset
from google.adk.tools.bigquery.config import BigQueryToolConfig
from google.adk.tools.bigquery.config import WriteMode
from google.adk.tools.bigquery import BigQueryCredentialsConfig

dotenv.load_dotenv()

SERVICE_ACCOUNT_FILE = "/Users/mananjain/Downloads/hack2skill-genai/planner_app/travel_agent/tools/auth.json"

tool_config = BigQueryToolConfig(
    write_mode=WriteMode.BLOCKED
)

credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE,
    scopes=["https://www.googleapis.com/auth/bigquery"]
)
credentials_config = BigQueryCredentialsConfig(credentials=credentials)


bigquery_tool = BigQueryToolset(
    credentials_config=credentials_config, bigquery_tool_config=tool_config
)

bigquery_agent = LlmAgent(
    model="gemini-2.0-flash",
    name="bigquery_agent",
    description="Agent to talk with BigQuery database.",
    instruction="""
    You are an expert SQL Query agent who will query the BigQuery database to get the best options for the Conveyance/Transportation & Stays for the trip.
    
    You are provided with the following tools:
    - `bigquery_tool`: to query the BigQuery database. You may use this tool multiple times to get the best options for the Conveyance/Transportation & Stays for the trip.

    You have access to these following BigQuery tables:
    - `busesdata.mytable`  (buses)
    - `trainsdata.mytable` (trains)
    - `flightsdata.mytable` (flights)
    - `hotelsdata.mytable` (hotels)

    PROJECT_ID: itinerai-41751
    DATASET_IDS: [itinerai-41751.busesdata, itinerai-41751.trainsdata, itinerai-41751.flightsdata, itinerai-41751.hotelsdata]
    TABLE_IDS: [itinerai-41751.busesdata.mytable, itinerai-41751.trainsdata.mytable, itinerai-41751.flightsdata.mytable, itinerai-41751.hotelsdata.mytable]

    - Here's the optimal flow:
        - first figure out the type of query: `conveyance/transportation` or `stay`.
            - If the query is for `conveyance/transportation`, then use the `buses`, `trains`, and `flights` tables.
            - If the query is for `stay`, then use the `hotels` table.
        - then inspect the relevant table schema(s) using a BigQuery SQL `INFORMATION_SCHEMA` call.
        - use the schema details to compose a precise and efficient SQL query tailored to the user's request, searching for matching buses, trains, or flights.
        - run the SQL query against the appropriate table(s) to extract the needed transportation options.`
        - if the user's request is ambiguous or incomplete, request any additional necessary details before running a query.
        
    Return the response as a JSON object formatted like this:
    - If the query is for `conveyance/transportation`, then return the response as a JSON object formatted like this:
        <format>
            {{
            "buses": [ { ...bus option details... } ],
            "trains": [ { ...train option details... } ],
            "flights": [ { ...flight option details... } ]
            }}
        </format>
        - Each object should include fields such as `departure`, `arrival`, `departure_time`, `arrival_time`, `operator`, and any other relevant columns from your tables.
    - If the query is for `stay`, then return the response as a JSON object formatted like this:
        <format>
        {{
        "hotels": [ { ...hotel option details... } ]
        }}
        </format>

    
    - your role is to only answer strictly based on the database contents.
    - provide distinct bus, train, flights, hotels options, as appropriate, in your response.
    - reference the correct tables for each mode of transport.
    - ensure responses are in valid JSON and can be directly parsed by client code.
    """,
    tools=[bigquery_tool]
)

query_tool = AgentTool(
    agent=bigquery_agent
)

# bigquery_stay_agent = LlmAgent(
#     model="gemini-2.0-flash",
#     name="bigquery_stay_agent",
#     description=(
#         "Agent to answer questions about Stay from the BigQuery database from the tables hotelsdata present under project itinerai-41751"
#         "SQL queries to get the best options for the stay for the trip."
#     ),
#     instruction=prompt.BIG_QUERY_STAY_AGENT_INSTR,
#     tools=[bigquery_tool],
# )