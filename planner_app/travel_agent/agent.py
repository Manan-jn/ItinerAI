from google.adk.agents import LlmAgent
from google.adk.tools.agent_tool import AgentTool
# from google.genai import types
# from google.adk.planners.built_in_planner import BuiltInPlanner

from . import prompt
from .tools.memory import _set_initial_state
from .sub_agents.onboarding.agent import onboarding_agent
from .sub_agents.planner.agent import planner_agent

# def get_weather(city: str) -> dict:
#     """Retrieves the current weather report for a specified city.

#     Args:
#         city (str): The name of the city for which to retrieve the weather report.

#     Returns:
#         dict: status and result or error msg.
#     """
#     if city.lower() == "new york":
#         return {
#             "status": "success",
#             "report": (
#                 "The weather in New York is sunny with a temperature of 25 degrees"
#                 " Celsius (77 degrees Fahrenheit)."
#             ),
#         }
#     else:
#         return {
#             "status": "error",
#             "error_message": f"Weather information for '{city}' is not available.",
#         }

root_agent = LlmAgent(
    name="root_agent",
    model="gemini-2.5-flash",
    description="Planner Orchestrator Agent responsible for orchestrating the complete flow to plan & assist the user for planning their trip.",
    instruction=prompt.ROOT_AGENT_INSTR,
    sub_agents=[
        onboarding_agent,
        planner_agent
    ],
    before_agent_callback=_set_initial_state,
    # planner=BuiltInPlanner(
    #     thinking_config=types.ThinkingConfig(
    #         type="PLAN_AND_EXECUTE",
    #         plan_only=False,
    #     )
    # )
)