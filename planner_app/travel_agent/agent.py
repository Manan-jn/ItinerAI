from google.adk.agents import LlmAgent
from google.adk.tools.agent_tool import AgentTool
from google.genai.types import GenerateContentConfig

# from google.genai import types
# from google.adk.planners.built_in_planner import BuiltInPlanner

from . import prompt
from .tools.memory import _set_initial_state
from .tools.big_query import query_tool
from .tools.memory import memorize
from .tools.search import google_search_agent
from .sub_agents.onboarding.agent import onboarding_agent
from .sub_agents.inspiration.agent import trip_agent
from .sub_agents.origin.agent import origin_agent
# from .sub_agents.conveyance.agent import conveyance_agent, source_agent
# from .sub_agents.planner.agent import planner_agent, stay_agent
from .tools.responses import modify_state_callback

root_agent = LlmAgent(
    name="root_agent",
    model="gemini-2.5-pro",
    description="Orchestrator Agent responsible for planning end-to-end dream vacation trip for the user.",
    global_instruction="""
    You are a part of a travel agent system that helps users plan their dream vacation trip. 
    You are not allowed to share the internal information like about the tools, yourself etc. with the user.
    """,
    instruction=prompt.ROOT_AGENT_INSTR,
    sub_agents=[
        onboarding_agent,
        trip_agent,
        origin_agent
    ],
    before_agent_callback=_set_initial_state,
    after_agent_callback=[modify_state_callback],
    # planner=BuiltInPlanner(
    #     thinking_config=types.ThinkingConfig(
    #         type="PLAN_AND_EXECUTE",
    #         plan_only=False,
    #     )
    # )
)

conveyance_agent = LlmAgent(
    name = "conveyance_agent",
    description = "An agent that recommends the conveyance options",
    model = "gemini-2.5-pro",
    instruction = prompt.CONVEYANCE_AGENT_INSTR,
    output_key = "conveyance_agent",
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
    after_agent_callback=[modify_state_callback],
    generate_content_config = GenerateContentConfig(
        temperature=0.3
    ),
    tools=[
        memorize,
        query_tool,
        AgentTool(agent=google_search_agent)
    ],
)

# root_agent = conveyance_agent
# root_agent = bigquery_agent