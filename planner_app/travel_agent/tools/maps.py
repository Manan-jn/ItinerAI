from google.adk.agents import LlmAgent
from google.adk.tools.google_maps_grounding_tool import google_maps_grounding

google_maps_agent = LlmAgent(
    model="gemini-2.5-flash",
    name="google_maps_agent",
    description="An agent providing Google-maps results capability",
    instruction="""  
    Answer the user's question directly using `google_maps_grounding` grounding tool; Provide a brief but concise response. 
    Do not ask the user to check or look up information for themselves, that's your role; do your best to be informative
    
    Always provide the summary in a structured JSON format for others to understand without missing any information in the structured format.
    """,
    tools=[google_maps_grounding],
    include_contents="none",
    # after_agent_callback=[_google_search_callback]
)