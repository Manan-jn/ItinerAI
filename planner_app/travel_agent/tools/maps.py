import os
from google.genai import types
from mcp import StdioServerParameters
from google.adk.agents.llm_agent import LlmAgent
from google.genai.types import GenerateContentConfig
from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams

from ..shared_libraries.types import safety_settings, http_options

google_maps_api_key = os.environ.get("GOOGLE_MAPS_API_KEY", "")
google_maps_agent = LlmAgent(
    model='gemini-2.5-flash-lite',
    name='google_maps_agent',
    description='A helpful assistant for user questions related to locations,maps & directions',
    instruction='Answer user questions to the best of your knowledge using goolge map tools provided to you',
    tools=[
        MCPToolset(
            connection_params=StdioConnectionParams(
                server_params = StdioServerParameters(
                    command='npx',
                    args=[
                        "-y",
                        "@modelcontextprotocol/server-google-maps",
                    ],
                    env={
                        "GOOGLE_MAPS_API_KEY": google_maps_api_key
                    }
                ),
                timeout=10.0
            ),
            # You can filter for specific Maps tools if needed:
            # tool_filter=['get_directions', 'find_place_by_id']
        )
    ],
    generate_content_config=GenerateContentConfig(
        temperature=0.3, safety_settings=safety_settings, http_options=http_options,
        automatic_function_calling=types.AutomaticFunctionCallingConfig(maximum_remote_calls=100)
    ),
    include_contents="none"
)
