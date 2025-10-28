from google.adk.agents.llm_agent import LlmAgent
from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
from mcp import StdioServerParameters
import os

google_maps_api_key = os.environ.get("GOOGLE_MAPS_API_KEY", "")
google_maps_agent = LlmAgent(
    model='gemini-2.5-flash',
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
    include_contents="none"
)
