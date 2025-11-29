from google.genai import types
from google.adk.agents import LlmAgent
from google.adk.tools.agent_tool import AgentTool
from google.genai.types import GenerateContentConfig, ThinkingConfig
from google.adk.planners import BuiltInPlanner
from google.adk.tools.google_search_tool import google_search
# from google.adk.tools.google_api_tool
# from google.adk.tools.load_memory_tool

from . import prompt
from .tools.memory import _set_initial_state
from .tools.big_query import conveyance_query_tool, stay_query_tool
from .tools.search import google_search_agent
from .tools.maps import google_maps_agent
from .sub_agents.onboarding.agent import onboarding_agent
from .sub_agents.inspiration.agent import trip_agent
from .sub_agents.origin.agent import origin_agent
from .shared_libraries.types import safety_settings, http_options

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
    <current_datetime> {current_datetime?} </current_datetime>
    </CURRENT_DATE_TIME>
    """,
    sub_agents=[onboarding_agent, trip_agent, origin_agent],
    output_key="root_agent",
    before_agent_callback=[_set_initial_state],
    generate_content_config=GenerateContentConfig(
        temperature=0.3, safety_settings=safety_settings, http_options=http_options,
        automatic_function_calling=types.AutomaticFunctionCallingConfig(maximum_remote_calls=100)
    ),
    planner=BuiltInPlanner(
        thinking_config=ThinkingConfig(
            include_thoughts=True,
        )
    ),
)

travel_dates_agent = LlmAgent(
    name="travel_dates_agent",
    description="Agent responsible for recommmending suitable travel dates for the selected trip to the user. ",
    model="gemini-2.5-flash",
    static_instruction=prompt.TRAVEL_DATES_AGENT_INSTR,
    instruction="""
    ### CONTEXT BLOCK
    <USER_PROFILE>
    <user_id> {user_id?} </user_id>
    <user_profile> {user_profile?} </user_profile>
    </USER_PROFILE>
    
    <TRIP_BLUEPRINT>
    <trip_blueprint> {final_trip?} </trip_blueprint>
    </TRIP_BLUEPRINT>
    
    <CURRENT_DATE_TIME>
    <current_datetime> {current_datetime?} </current_datetime>
    </CURRENT_DATE_TIME>
    """,
    output_key="travel_dates_agent",
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
    generate_content_config=GenerateContentConfig(
        temperature=0.3, safety_settings=safety_settings, http_options=http_options,
        automatic_function_calling=types.AutomaticFunctionCallingConfig(maximum_remote_calls=100)
    ),
    tools=[google_search],
    planner=BuiltInPlanner(
        thinking_config=ThinkingConfig(
            include_thoughts=True,
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
    <current_datetime> {current_datetime?} </current_datetime>
    </CURRENT_DATE_TIME>
    """,
    output_key="conveyance_agent",
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
    generate_content_config=GenerateContentConfig(
        temperature=0.3, safety_settings=safety_settings, http_options=http_options,
        automatic_function_calling=types.AutomaticFunctionCallingConfig(maximum_remote_calls=100)
    ),
    tools=[conveyance_query_tool, AgentTool(agent=google_search_agent)],
    planner=BuiltInPlanner(
        thinking_config=ThinkingConfig(
            include_thoughts=True,
        )
    ),
)

stay_agent = LlmAgent(
    name="stay_agent",
    description="An agent that recommends the stay options",
    model="gemini-2.5-flash",
    static_instruction=prompt.STAY_AGENT_INSTR,
    instruction="""
    ### CONTEXT BLOCK
    <USER_PROFILE>
    <user_id> {user_id?} </user_id>
    <user_profile> {user_profile?} </user_profile>
    </USER_PROFILE>

    <FINAL_TRIP>
    <final_trip> {final_trip?} </final_trip>
    </FINAL_TRIP>

    <CURRENT_DATE_TIME>
    <current_datetime> {current_datetime?} </current_datetime>
    </CURRENT_DATE_TIME>
    """,
    output_key="stay_agent",
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
    generate_content_config=GenerateContentConfig(
        temperature=0.3, safety_settings=safety_settings, http_options=http_options, 
        automatic_function_calling=types.AutomaticFunctionCallingConfig(maximum_remote_calls=100)
    ),
    tools=[AgentTool(agent=google_search_agent), AgentTool(agent=google_maps_agent)],
    planner=BuiltInPlanner(
        thinking_config=ThinkingConfig(
            include_thoughts=True,
        )
    ),
)

itinerary_agent = LlmAgent(
    name="itinerary_agent",
    description="An agent that recommends the complete itinerary.",
    model="gemini-2.5-flash",
    static_instruction=prompt.ITINERARY_AGENT_INSTR,
    instruction="""
    ### CONTEXT BLOCK
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
    <current_datetime> {current_datetime?} </current_datetime>
    </CURRENT_DATE_TIME>
    """,
    output_key="itinerary_agent",
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
    generate_content_config=GenerateContentConfig(
        temperature=0.3, safety_settings=safety_settings, http_options=http_options,
        automatic_function_calling=types.AutomaticFunctionCallingConfig(maximum_remote_calls=100)
    ),
    tools=[AgentTool(agent=google_search_agent), AgentTool(agent=google_maps_agent)],
    planner=BuiltInPlanner(
        thinking_config=ThinkingConfig(
            include_thoughts=True,
        )
    ),
    include_contents="none"
)

pre_trip_agent = LlmAgent(
    name="pre_trip_agent",
    description="An agent that recommends the pre-trip brief for the user's final itinerary.",
    model="gemini-2.5-pro",
    static_instruction=prompt.PRE_TRIP_AGENT_INSTR,
    instruction="""
    ### CONTEXT BLOCK
    <USER_PROFILE>
    <user_id> {user_id?} </user_id>
    <user_profile> {user_profile?} </user_profile>
    </USER_PROFILE>

    <FINAL_ITINERARY>
    <final_itinerary> {final_itinerary?} </final_itinerary>
    </FINAL_ITINERARY>
    
    <CURRENT_DATE_TIME>
    <current_datetime> {current_datetime?} </current_datetime>
    </CURRENT_DATE_TIME>
    """,
    output_key="pre_trip_agent",
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
    generate_content_config=GenerateContentConfig(
        temperature=0.3, safety_settings=safety_settings, http_options=http_options,
        automatic_function_calling=types.AutomaticFunctionCallingConfig(maximum_remote_calls=100)
    ),
    tools=[AgentTool(agent=google_search_agent), AgentTool(agent=google_maps_agent)],
    planner=BuiltInPlanner(
        thinking_config=ThinkingConfig(
            include_thoughts=True,
        )
    ),
    include_contents="none",
)

in_trip_agent = LlmAgent(
    name="in_trip_agent",
    description="An agent that handles all the modifications in the itinerary following the constraints",
    model="gemini-2.5-pro",
    static_instruction=prompt.IN_TRIP_AGENT_INSTR,
    instruction="""
    ### CONTEXT BLOCK
    <USER_PROFILE>
    <user_id> {user_id?} </user_id>
    <user_profile> {user_profile?} </user_profile>
    </USER_PROFILE>

    <CURRENT_ITINERARY>
    <final_itinerary> {final_itinerary?} </final_itinerary>
    </CURRENT_ITINERARY>
    
    <CURRENT_DATE_TIME>
    <current_datetime> {current_datetime?} </current_datetime>
    </CURRENT_DATE_TIME>
    """,
    output_key="in_trip_agent",
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
    generate_content_config=GenerateContentConfig(
        temperature=0.3, safety_settings=safety_settings, http_options=http_options,
        automatic_function_calling=types.AutomaticFunctionCallingConfig(maximum_remote_calls=100)
    ),
    tools=[AgentTool(agent=google_search_agent), AgentTool(agent=google_maps_agent)],
    planner=BuiltInPlanner(
        thinking_config=ThinkingConfig(
            include_thoughts=True,
        )
    ),
)