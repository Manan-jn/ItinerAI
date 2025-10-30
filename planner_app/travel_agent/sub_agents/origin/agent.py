from google.adk.agents import LlmAgent
from google.adk.tools.agent_tool import AgentTool
from google.genai.types import ThinkingConfig
from google.adk.planners import BuiltInPlanner

from . import prompt
from ...tools.memory import memorize
from ...tools.search import google_search_agent
from ...tools.big_query import conveyance_query_tool
from ...tools.places import map_tool
from ...shared_libraries.callbacks import modify_state_after_agent, logger_before_agent


origin_agent = LlmAgent(
    name="origin_agent",
    description="An agent that recommends the start point(s) from where the user can start the journey.",
    model="gemini-2.5-flash",
    static_instruction=prompt.ORIGIN_AGENT_INSTR,
    instruction="""
    ### CONTEXT BLOCKS
    <USER_PROFILE>
    <user_profile> {user_profile?} </user_profile>
    </USER_PROFILE>

    <FINAL_TRIP>
    <final_trip> {final_trip?} </final_trip>
    </FINAL_TRIP>

    <SOURCE_POINT>
    {source_point?}
    </SOURCE_POINT>
    """,
    output_key="origin_agent",
    # output_schema = SourceLocation,
    disallow_transfer_to_parent=False,
    disallow_transfer_to_peers=False,
    before_agent_callback=[logger_before_agent],
    after_agent_callback=[modify_state_after_agent, map_tool],
    tools=[memorize, conveyance_query_tool, AgentTool(agent=google_search_agent)],
    planner=BuiltInPlanner(
        thinking_config=ThinkingConfig(
            include_thoughts=True
        )
    )
)
