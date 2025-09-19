from google.adk.agents import LlmAgent
from google.genai.types import GenerateContentConfig
from google.adk.tools.agent_tool import AgentTool
from sqlalchemy.sql import True_


from . import prompt
from ...shared_libraries import DestinationIdeas, TravelDates, POISuggestions, SourceLocation

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

destination_agent = LlmAgent(
    name = "destination_agent",
    description = "An agent that gathers user preferences to figure out dates & destination for the trip",
    model = "gemini-2.5-flash",
    instruction = prompt.DESTINATION_AGENT_INSTR,
    output_key = "destinations",
    output_schema = DestinationIdeas,
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
    generate_content_config = GenerateContentConfig(
        response_mime_type = "application/json"
    ),
)

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

poi_agent = LlmAgent(
    name = "poi_agent",
    description = "An agent that gathers user preferences to figure out points of interest for the trip",
    model = "gemini-2.5-flash",
    instruction = prompt.POI_AGENT_INSTR,
    output_key = "pois",
    output_schema = POISuggestions,
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
    generate_content_config = GenerateContentConfig(
        response_mime_type = "application/json"
    ),
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
            agent=poi_agent
        ),
        AgentTool(
            agent=travel_dates_agent
        )
    ],
)