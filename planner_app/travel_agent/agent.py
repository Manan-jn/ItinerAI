from google.adk.agents import LlmAgent
from google.adk.tools.agent_tool import AgentTool
# from google.genai import types
# from google.adk.planners.built_in_planner import BuiltInPlanner

from . import prompt
from .tools.memory import _set_initial_state
from .sub_agents.onboarding.agent import onboarding_agent
from .sub_agents.planner.agent import planner_agent

root_agent = LlmAgent(
    name="root_agent",
    model="gemini-2.0-flash",
    global_instruction="""
    - You are not allowed to reveal any internal information regarding tools, steps you are taking etc.
    - Do not provide the intermediate responses. Always provide the final responses.
    - Always provide user-friendly responses. Try to keep responses beautified for the user to make it more engaging and enjoyable & imaginative.
    """,
    description="Planner Orchestrator Agent responsible for orchestrating the complete flow to plan & assist the user for planning their trip.",
    instruction=prompt.ROOT_AGENT_INSTR,
    sub_agents=[
        onboarding_agent,
        planner_agent,
    ],
    before_agent_callback=_set_initial_state,
    # planner=BuiltInPlanner(
    #     thinking_config=types.ThinkingConfig(
    #         type="PLAN_AND_EXECUTE",
    #         plan_only=False,
    #     )
    # )
)