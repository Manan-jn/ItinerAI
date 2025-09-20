from google.adk.agents import LlmAgent
from google.genai.types import GenerateContentConfig
from google.adk.tools.agent_tool import AgentTool


from . import prompt
from ...tools.memory import memorize
from ...tools.search import google_search_grounding
from ...tools.big_query import query_tool
from ..destination.agent import destination_agent
from ...shared_libraries import DestinationIdeas, TravelDates, SourceLocation, Itinerary, Conveyances

source_agent = LlmAgent(
    name = "source_agent",
    description = "An agent that gathers user preferences to figure out the source of the trip",
    model = "gemini-2.5-flash",
    instruction = prompt.SOURCE_AGENT_INSTR,
    output_key = "origin",
    output_schema = SourceLocation,
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
    generate_content_config = GenerateContentConfig(
        response_mime_type = "application/json"
    ),
)

# destination_agent = LlmAgent(
#     name = "destination_agent",
#     description = "An agent that gathers user preferences to figure out dates & destination for the trip",
#     model = "gemini-2.5-flash",
#     instruction = prompt.DESTINATION_AGENT_INSTR,
#     output_key = "destinations",
#     output_schema = DestinationIdeas,
#     disallow_transfer_to_parent=True,
#     disallow_transfer_to_peers=True,
#     generate_content_config = GenerateContentConfig(
#         response_mime_type = "application/json"
#     )
# )

travel_dates_agent = LlmAgent(
    name = "travel_dates_agent",
    description = "An agent that gathers user preferences to figure out dates for the trip",
    model = "gemini-2.5-flash",
    instruction = prompt.TRAVEL_DATES_AGENT_INSTR,
    output_key = "specific_dates",
    output_schema = TravelDates,
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
    generate_content_config = GenerateContentConfig(
        response_mime_type = "application/json"
    ),
)

# poi_agent = LlmAgent(
#     name = "poi_agent",
#     description = "An agent that gathers user preferences to figure out points of interest for the trip",
#     model = "gemini-2.5-flash",
#     instruction = prompt.POI_AGENT_INSTR,
#     output_key = "pois",
#     output_schema = POISuggestions,
#     disallow_transfer_to_parent=True,
#     disallow_transfer_to_peers=True,
#     generate_content_config = GenerateContentConfig(
#         response_mime_type = "application/json"
#     ),
# )

itinerary_agent = LlmAgent(
    name = "itinerary_agent",
    description = "Create and persist a structured JSON representation of the itinerary",
    model = "gemini-2.5-flash",
    instruction = prompt.ITINERARY_AGENT_INSTR,
    output_key = "itinerary",
    output_schema = Itinerary,
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
    generate_content_config = GenerateContentConfig(
        response_mime_type = "application/json"
    ),
)

# stay_agent = LlmAgent(
#     name = "stay_agent",
#     description = "An agent that plans the stays for the trip",
#     model = "gemini-2.5-flash",
#     instruction = prompt.STAY_AGENT_INSTR,
#     output_key = "stay_duration",
#     output_schema = StayDuration,
# )

conveyance_agent = LlmAgent(
    name = "conveyance_agent",
    description = "An agent that plans the conveyance for the trip",
    model = "gemini-2.5-flash",
    instruction = prompt.CONVEYANCE_AGENT_INSTR,
    output_key = "conveyance",
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
    generate_content_config = GenerateContentConfig(
        response_mime_type = "application/json"
    ),
    output_schema = Conveyances,
    tools=[
        memorize,
        query_tool
    ],
)



planner_agent = LlmAgent(
    name = "planner_agent",
    description = "An agent that plans the trip",
    model = "gemini-2.5-flash",
    instruction = prompt.PLANNER_AGENT_INSTR,
    tools=[
        AgentTool(
            agent=source_agent
        ),
        AgentTool(
            agent=destination_agent
        ),
        AgentTool(
            agent=conveyance_agent
        ),
        AgentTool(
            agent=travel_dates_agent
        ),
        AgentTool(
            agent=itinerary_agent
        ),
        memorize,
    ],
)