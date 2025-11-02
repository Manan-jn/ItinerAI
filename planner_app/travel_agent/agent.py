from google.adk.agents import LlmAgent
from google.adk.tools.agent_tool import AgentTool
from google.genai.types import GenerateContentConfig, ThinkingConfig, SafetySetting
from google.adk.planners import BuiltInPlanner
import logging

from . import prompt
from .tools.memory import _set_initial_state
from .tools.big_query import conveyance_query_tool, stay_query_tool
from .tools.memory import memorize
from .tools.search import google_search_agent
from .tools.maps import google_maps_agent
from .tools.places import map_tool
from .sub_agents.onboarding.agent import onboarding_agent
from .sub_agents.inspiration.agent import trip_agent
from .sub_agents.origin.agent import origin_agent
from .shared_libraries.types import safety_settings
# from ..shared.log_config import logger

# logger.setLevel(logging.DEBUG)

# from .shared_libraries.callbacks import (
#     logger_before_agent,
#     modify_state_after_agent,
#     modify_output_after_agent,
# )

root_agent = LlmAgent(
    name="root_agent",
    model="gemini-2.5-pro",
    description="Orchestrator Agent responsible for planning end-to-end dream vacation trip for the user.",
    static_instruction=prompt.ROOT_AGENT_INSTR,
    instruction=""" 
    ### CONTEXT BLOCK
    <CURRENT_STATE>
    <user_id> {user_id?} </user_id>
    <user_profile> {user_profile?} </user_profile>
    <final_trip> {final_trip?} </final_trip>
    <start_point> {start_point?} </start_point>
    </CURRENT_STATE>
    
    <CURRENT_DATE_TIME>
    <current_date_time> {current_datetime?} </current_date_time>
    </CURRENT_DATE_TIME>
    """,
    sub_agents=[onboarding_agent, trip_agent, origin_agent],
    output_key="root_agent",
    before_agent_callback=[_set_initial_state],
    # after_agent_callback=[modify_state_after_agent],
    generate_content_config=GenerateContentConfig(
        temperature=0.3, safety_settings=safety_settings
    ),
    planner=BuiltInPlanner(
        thinking_config=ThinkingConfig(
            include_thoughts=True,
            # thinking_budget=2048
        )
    ),
)

conveyance_agent = LlmAgent(
    name="conveyance_agent",
    description="An agent that recommends the conveyance options",
    model="gemini-2.5-flash",
    static_instruction=prompt.CONVEYANCE_AGENT_INSTR,
    instruction="""
    ### CURRENT CONTEXT
    <USER_PROFILE>
    <user_id> {user_id?} </user_id>
    <user_profile> {user_profile?} </user_profile>
    </USER_PROFILE>

    <FINAL_TRIP>
    <final_trip> {final_trip?} </final_trip>
    </FINAL_TRIP>
    
    <CURRENT_DATE_TIME>
    <current_date_time> {current_datetime?} </current_date_time>
    </CURRENT_DATE_TIME>
    """,
    output_key="conveyance_agent",
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
    # after_agent_callback=[modify_state_after_agent],
    generate_content_config=GenerateContentConfig(
        temperature=0.3, safety_settings=safety_settings
    ),
    tools=[conveyance_query_tool, AgentTool(agent=google_search_agent)],
    planner=BuiltInPlanner(
        thinking_config=ThinkingConfig(
            include_thoughts=True,
            # thinking_budget=2048
        )
    ),
)

stay_agent = LlmAgent(
    name="stay_agent",
    description="An agent that recommends the stay options",
    model="gemini-2.5-flash",
    static_instruction=prompt.STAY_AGENT_INSTR,
    instruction="""
    ### CURRENT CONTEXT
    <USER_PROFILE>
    <user_id> {user_id?} </user_id>
    <user_profile> {user_profile?} </user_profile>
    </USER_PROFILE>

    <FINAL_TRIP>
    <final_trip> {final_trip?} </final_trip>
    </FINAL_TRIP>

    <CURRENT_DATE_TIME>
    <current_date_time> {current_datetime?} </current_date_time>
    </CURRENT_DATE_TIME>
    """,
    output_key="stay_agent",
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
    # after_agent_callback=[modify_state_after_agent],
    generate_content_config=GenerateContentConfig(
        temperature=0.3, safety_settings=safety_settings
    ),
    tools=[stay_query_tool, AgentTool(agent=google_search_agent), AgentTool(agent=google_maps_agent)],
    planner=BuiltInPlanner(
        thinking_config=ThinkingConfig(
            include_thoughts=True,
            # thinking_budget=2048
        )
    ),
)

itinerary_agent = LlmAgent(
    name="itinerary_agent",
    description="An agent that recommends the complete itinerary.",
    model="gemini-2.5-pro",
    static_instruction=prompt.ITINERARY_AGENT_INSTR,
    instruction="""
    ### DATA REFERENCES
    <USER_PROFILE>
    <user_id> {user_id?} </user_id>
    <user_profile> {user_profile?} </user_profile>
    </USER_PROFILE>

    <INITIAL_TRIP_LAYOUT>
    <initial_trip_layout> {final_trip?} </initial_trip_layout>
    </INITIAL_TRIP_LAYOUT>

    <USER_START_LOCATION>
    <user_start_location> {source_point?} </user_start_location>
    </USER_START_LOCATION>

    <TRIP_DATES>
    <trip_dates> {trip_dates?} </trip_dates>
    </TRIP_DATES>

    <CURRENT_ITINERARY>
    <final_itinerary> {current_itinerary?} </final_itinerary>
    </CURRENT_ITINERARY>
    
    <CURRENT_DATE_TIME>
    <current_date_time> {current_datetime?} </current_date_time>
    </CURRENT_DATE_TIME>
    """,
    output_key="itinerary_agent",
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
    generate_content_config=GenerateContentConfig(
        temperature=0.3, safety_settings=safety_settings
    ),
    tools=[AgentTool(agent=google_search_agent), AgentTool(agent=google_maps_agent)],
    after_agent_callback=[
        # modify_state_after_agent,
        # modify_output_after_agent,
    ],
    planner=BuiltInPlanner(
        thinking_config=ThinkingConfig(
            include_thoughts=True,
            # thinking_budget=2048
        )
    ),
)

# root_agent = onboarding_agent
# root_agent = stay_agent
# root_agent = google_maps_agent
# root_agent = conveyance_agent
# root_agent = trip_agent
# root_agent = itinerary_agent
# root_agent = bigquery_agent
# {
#     "role":"user",
#     "query": "Hi"
# }
