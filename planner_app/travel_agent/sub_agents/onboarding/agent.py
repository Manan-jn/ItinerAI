from google.genai import types
from google.adk.agents import LlmAgent
from google.genai.types import GenerateContentConfig, ThinkingConfig
from google.adk.planners import BuiltInPlanner


from . import prompt
from ...tools.memory import memorize
from ...shared_libraries.types import safety_settings

onboarding_agent = LlmAgent(
    name="onboarding_agent",
    description="An agent that gathers first level information from the user to build the user profile",
    model="gemini-2.5-flash",
    output_key="onboarding_agent",
    static_instruction=prompt.ONBOARDING_AGENT_INSTR,
    instruction="""
    ### CONTEXT BLOCKS
    <USER_PROFILE>
    {user_profile?}
    </USER_PROFILE>
    
    <CURRENT_DATE_TIME>
    <current_datetime> {current_datetime?} </current_datetime>
    </CURRENT_DATE_TIME>
    """,
    disallow_transfer_to_parent=False,
    disallow_transfer_to_peers=False,
    planner=BuiltInPlanner(
        thinking_config=ThinkingConfig(
            include_thoughts=True
        )
    ),
    generate_content_config=GenerateContentConfig(
        temperature=0.3,
        safety_settings=safety_settings,
        automatic_function_calling=types.AutomaticFunctionCallingConfig(maximum_remote_calls=100)
    ),
    tools=[memorize],
)
