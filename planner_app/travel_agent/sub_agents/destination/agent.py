from google.adk.agents import LlmAgent, SequentialAgent
from google.genai.types import GenerateContentConfig


from . import prompt
from ...tools.search import google_search_grounding
from ...shared_libraries import DestinationIdeas

recommendation_agent = LlmAgent(
    name = "recommendation_agent",
    description = "An agent that gathers user preferences to figure out dates & destination for the trip",
    model = "gemini-2.0-flash",
    instruction = prompt.RECOMMENDATION_AGENT_INSTR,
    output_key = "temp_destinations",
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
    generate_content_config = GenerateContentConfig(
        response_mime_type = "text/plain"
    ),
    tools = [google_search_grounding]
)

destination_builder_agent = LlmAgent(
    name = "destination_agent",
    description = "An agent that gathers user preferences to figure out dates & destination for the trip",
    model = "gemini-2.0-flash",
    instruction = prompt.DESTINATION_AGENT_INSTR,
    output_key = "destinations",
    output_schema = DestinationIdeas,
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
    generate_content_config = GenerateContentConfig(
        response_mime_type = "application/json"
    )
)

destination_agent = SequentialAgent(
    name = "destination_agent",
    description = "An agent that gathers user preferences to figure out dates & destination for the trip",
    sub_agents = [
        recommendation_agent,
        destination_builder_agent
    ]
)