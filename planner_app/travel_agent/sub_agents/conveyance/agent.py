from google.adk.agents import LlmAgent
from google.genai.types import GenerateContentConfig
from google.adk.tools.agent_tool import AgentTool

from . import prompt
from ...tools.memory import memorize
from ...tools.search import google_search_agent
from ...tools.big_query import query_tool
from ...tools.responses import modify_state_callback
from ...tools.places import map_tool
# from ...shared_libraries import Conveyances, SourceLocation


source_agent = LlmAgent(
    name = "source_agent",
    description = "An agent that recommends the optimal start point(s) from where the user can start the journey.",
    model = "gemini-2.5-pro",
    instruction = prompt.ORIGIN_AGENT_INSTR,
    output_key = "source_agent",
    # output_schema = SourceLocation,
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
    after_agent_callback=[modify_state_callback, map_tool],
    tools=[
        memorize,
        query_tool,
        AgentTool(agent=google_search_agent)
    ],
)

# smart_dates_agent = LlmAgent(
#     name = "smart_dates_agent",
#     description = "An agent that smartly suggests the suitable dates for the selected trip",
#     model = "gemini-2.5-pro",
#     instruction = prompt.CONVEYANCE_AGENT_INSTR,
#     output_key = "smart_dates_agent",
#     # output_schema = Conveyances,
#     disallow_transfer_to_parent=True,
#     disallow_transfer_to_peers=True,
#     after_agent_callback=[modify_state_callback],
#     sub_agents=[
#         source_agent,
#     ],
#     tools=[
#         # AgentTool(source_agent, skip_summarization=True),
#         memorize,
#         query_tool,
#         AgentTool(agent=google_search_agent)
#     ],
# )

conveyance_agent = LlmAgent(
    name = "conveyance_agent",
    description = "An agent that plans the conveyance options for the trip",
    model = "gemini-2.5-pro",
    instruction = prompt.CONVEYANCE_AGENT_INSTR,
    output_key = "conveyance_agent",
    # output_schema = Conveyances,
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
    after_agent_callback=[modify_state_callback],
    # sub_agents=[
    #     source_agent,
    # ],
    tools=[
        # AgentTool(source_agent, skip_summarization=True),
        memorize,
        query_tool,
        AgentTool(agent=google_search_agent)
    ],
)

# dummy_conveyance_agent = LlmAgent(
#     name = "conveyance_agent_1",
#     description = "An agent that plans the conveyance options for the trip",
#     model = "gemini-2.5-pro",
#     instruction = prompt.DUMMY_CONVEYANCE_AGENT_INSTR,
#     output_key = "conveyance_agent",
#     # output_schema = Conveyances,
#     disallow_transfer_to_parent=True,
#     disallow_transfer_to_peers=True,
#     after_agent_callback=[modify_state_callback],
#     # sub_agents=[
#     #     source_agent,
#     # ],
#     tools=[
#         # AgentTool(source_agent, skip_summarization=True),
#         memorize,
#         query_tool,
#         AgentTool(agent=google_search_agent)
#     ],
# )