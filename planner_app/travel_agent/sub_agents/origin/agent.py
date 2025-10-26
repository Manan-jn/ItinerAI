from google.adk.agents import LlmAgent
from google.adk.tools.agent_tool import AgentTool

from . import prompt
from ...tools.memory import memorize
from ...tools.search import google_search_agent
from ...tools.big_query import conveyance_query_tool
from ...tools.places import map_tool
from ...shared_libraries.callbacks import modify_state_after_agent


origin_agent = LlmAgent(
    name="origin_agent",
    description="An agent that recommends the start point(s) from where the user can start the journey.",
    model="gemini-2.5-pro",
    instruction=prompt.ORIGIN_AGENT_INSTR,
    output_key="origin_agent",
    # output_schema = SourceLocation,
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
    after_agent_callback=[modify_state_after_agent, map_tool],
    tools=[memorize, conveyance_query_tool, AgentTool(agent=google_search_agent)],
)
