from google.adk.agents import LlmAgent

from . import prompt
from ...tools.memory import memorize

onboarding_agent = LlmAgent(
    name = "onboarding_agent",
    description = "An agent that gathers first level information from the user to build the user profile",
    model = "gemini-2.5-flash",
    instruction = prompt.ONBOARDING_AGENT_INSTR,
    tools=[
        memorize
    ],
)