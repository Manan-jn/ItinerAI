from google.adk.agents import LlmAgent
from google.genai.types import GenerateContentConfig
from google.adk.tools.agent_tool import AgentTool

from . import prompt
from ...shared_libraries import UserProfile, Budget, RoughTravelDates, GroupDetails

user_profile_agent = LlmAgent(
    name = "user_profile_agent",
    description = "An agent that gathers first level information from the user to build the user profile",
    model = "gemini-2.5-flash",
    instruction = prompt.USER_PROFILE_AGENT_INSTR,
    output_key = "user_profile",
    output_schema = UserProfile,
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
    generate_content_config = GenerateContentConfig(
        response_mime_type = "application/json"
    ),
)

group_details_agent = LlmAgent(
    name = "group_details_agent",
    description = "Gathers group details from the user",
    model = "gemini-2.5-flash",
    instruction = prompt.GROUP_DETAILS_AGENT_INSTR,
    output_key = "group_details",
    output_schema = GroupDetails,
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
    generate_content_config = GenerateContentConfig(
        response_mime_type = "application/json"
    ),
)

budget_agent = LlmAgent(
    name = "budget_agent",
    description = "An agent that gathers information about the user's budget",
    model = "gemini-2.5-flash",
    instruction = prompt.BUDGET_AGENT_INSTR,
    output_key = "budget",
    output_schema = Budget,
)

rough_dates_agent = LlmAgent(
    name = "rough_dates_agent",
    description = "Gathers rough travel dates preferences from the user",
    model = "gemini-2.5-flash",
    instruction = prompt.ROUGH_DATES_AGENT_INSTR,
    output_key = "rough_dates",
    output_schema = RoughTravelDates,
)

onboarding_agent = LlmAgent(
    name = "onboarding_agent",
    description = "An agent that gathers first level information from the user to build the user profile",
    model = "gemini-2.5-flash",
    instruction = prompt.ONBOARDING_AGENT_INSTR,
    tools=[
        AgentTool(
            agent=user_profile_agent
        ),
        AgentTool(
            agent=group_details_agent
        ),
        AgentTool(
            agent=budget_agent
        ),
        AgentTool(
            agent=rough_dates_agent
        )
    ],
)