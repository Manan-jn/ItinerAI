from google.genai import types
from google.adk.agents import LlmAgent
from google.genai.types import GenerateContentConfig, ThinkingConfig
from google.adk.planners import BuiltInPlanner
from google.adk.tools.google_search_tool import google_search

from . import prompt
from ...shared_libraries.callbacks import *
from ...shared_libraries.types import safety_settings

trip_agent = LlmAgent(
    name="trip_agent",
    description="An agent who recommends trips to the user",
    model="gemini-2.5-pro",
    static_instruction=prompt.TRIP_AGENT_INSTR,
    instruction="""
    ### CONTEXT BLOCKS
    <FINAL_TRIP>
    {final_trip?}
    </FINAL_TRIP>

    <USER_PROFILE>
    <user_profile> {user_profile?} </user_profile>
    </USER_PROFILE>
    
    <CURRENT_DATE_TIME>
    <current_datetime> {current_datetime?} </current_datetime>
    </CURRENT_DATE_TIME>
    """,
    output_key="trip_agent",
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
    generate_content_config=GenerateContentConfig(
        temperature=0.3,
        safety_settings=safety_settings,
        automatic_function_calling=types.AutomaticFunctionCallingConfig(
            maximum_remote_calls=100
        ),
    ),
    planner=BuiltInPlanner(thinking_config=ThinkingConfig(include_thoughts=True)),
    tools=[google_search],
)
