from google.adk.agents import LlmAgent
from google.genai.types import GenerateContentConfig, ThinkingConfig
from google.adk.planners import BuiltInPlanner


from . import prompt
from ...tools.memory import memorize
from ...shared_libraries.callbacks import modify_state_after_agent, logger_before_agent

# from ...shared_libraries import OnboardingAgent

onboarding_agent = LlmAgent(
    name="onboarding_agent",
    description="An agent that gathers first level information from the user to build the user profile",
    model="gemini-2.5-pro",
    output_key="onboarding_agent",
    # output_schema = OnboardingAgent,
    instruction=prompt.ONBOARDING_AGENT_INSTR,
    disallow_transfer_to_parent=False,
    disallow_transfer_to_peers=False,
    before_agent_callback=[logger_before_agent],
    after_agent_callback=[modify_state_after_agent],
    planner=BuiltInPlanner(
        thinking_config=ThinkingConfig(
            include_thoughts=False
        )
    ),
    generate_content_config=GenerateContentConfig(
        # response_mime_type = "application/json"
        temperature=0.3
    ),
    tools=[memorize],
)
