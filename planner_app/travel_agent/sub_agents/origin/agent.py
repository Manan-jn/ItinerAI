from google.genai import types
from google.adk.agents import LlmAgent
from google.adk.tools.agent_tool import AgentTool
from google.genai.types import GenerateContentConfig, ThinkingConfig
from google.adk.planners import BuiltInPlanner

from . import prompt
from ...tools.memory import memorize
from ...tools.search import google_search_agent
from ...shared_libraries.callbacks import logger_before_agent
from ...shared_libraries.types import safety_settings
from ...shared_libraries.callbacks import *


origin_agent = LlmAgent(
    name="origin_agent",
    description="An agent that recommends the start point(s) from where the user can start the journey.",
    model="gemini-2.5-flash",
    static_instruction=prompt.ORIGIN_AGENT_INSTR,
    instruction="""
    ### CONTEXT BLOCKS
    <USER_PROFILE>
    <user_id> {user_id?} </user_id>
    <user_profile> {user_profile?} </user_profile>
    </USER_PROFILE>

    <FINAL_TRIP>
    <final_trip> {final_trip?} </final_trip>
    </FINAL_TRIP>

    <SOURCE_POINT>
    {source_point?}
    </SOURCE_POINT>
    
    <CURRENT_DATE_TIME>
    <current_datetime> {current_datetime?} </current_datetime>
    </CURRENT_DATE_TIME>
    """,
    output_key="origin_agent",
    disallow_transfer_to_parent=False,
    disallow_transfer_to_peers=False,
    before_agent_callback=[logger_before_agent],
    generate_content_config=GenerateContentConfig(
        temperature=0.3,
        safety_settings=safety_settings,
        automatic_function_calling=types.AutomaticFunctionCallingConfig(maximum_remote_calls=100)
    ),
    # before_agent_callback=[get_demo_origins],
    tools=[memorize, AgentTool(agent=google_search_agent)],
    planner=BuiltInPlanner(
        thinking_config=ThinkingConfig(
            include_thoughts=True
        )
    )
)
