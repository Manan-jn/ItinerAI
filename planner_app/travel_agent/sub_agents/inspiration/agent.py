from google.adk.agents import LlmAgent, SequentialAgent
from google.adk.tools.agent_tool import AgentTool
from google.genai.types import GenerateContentConfig
from google.adk.tools.google_search_tool import google_search

from . import prompt
from ...tools.memory import memorize
from ...tools.places import map_tool
from ...tools.search import google_search_agent
from ...shared_libraries import TripSuggestions, POISuggestions
from ...shared_libraries.callbacks import (
    logger_before_agent,
    modify_state_after_agent,
    modify_output_after_agent,
)

trip_agent = LlmAgent(
    name="trip_agent",
    description="An agent who recommends trips to the user",
    model="gemini-2.5-pro",
    instruction=prompt.TRIP_AGENT_INSTR,
    output_key="trip_suggestions",
    # output_schema = TripSuggestions,
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
    generate_content_config = GenerateContentConfig(
        # response_mime_type = "application/json",
        temperature=0.3
    ),
    before_agent_callback=[logger_before_agent],
    after_agent_callback=[
        modify_state_after_agent,
        map_tool,
        modify_output_after_agent,
    ],
    tools = [google_search]
)

poi_agent = LlmAgent(
    name="poi_agent",
    description="An agent who recommends points of interest to the user",
    model="gemini-2.5-pro",
    instruction=prompt.POI_AGENT_INSTR,
    output_key="points_of_interest",
    output_schema=POISuggestions,
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
    generate_content_config=GenerateContentConfig(
        response_mime_type="application/json"
    ),
    after_agent_callback=[map_tool],
    # tools=[
    #     google_search_agent
    # ]
)

# inspiration_agent = LlmAgent(
#     name = "inspiration_agent",
#     description = "An agent who recommends inspiration to the user",
#     model = "gemini-2.5-flash",
#     instruction = prompt.INSPIRATION_AGENT_INSTR,
#     output_key = "inspiration",
#     tools=[
#         AgentTool(destination_agent),
#         AgentTool(poi_agent),
#         memorize
#     ],
#     after_agent_callback=[map_tool]
# )

# inspiration_agent = SequentialAgent(
#     name = "inspiration_agent",
#     description = "An agent who recommends inspiration to the user",
#     sub_agents=[
#         destination_agent,
#         poi_agent,
#     ],
#     after_agent_callback=[map_tool]
# )
