from google.adk.agents import LlmAgent, ParallelAgent
from google.adk.tools.agent_tool import AgentTool
from google.adk.agents.callback_context import CallbackContext
from google.adk.tools.google_search_tool import google_search
from google.genai.types import GenerateContentConfig


def _google_search_callback(callback_context: CallbackContext) -> None:
    session = callback_context._invocation_context.session
    url_to_short_id = {}
    sources = {}
    id_counter = 1
    
    for event in reversed(session.events):
        if not (event.grounding_metadata and event.grounding_metadata.grounding_chunks):
            continue
        chunks_info = {}
        search_queries = event.grounding_metadata.web_search_queries
        for idx, chunk in enumerate(event.grounding_metadata.grounding_chunks):
            if not chunk.web:
                continue
            url = chunk.web.uri
            title = (
                chunk.web.title
                if chunk.web.title != chunk.web.domain
                else chunk.web.domain
            )
            if url not in url_to_short_id:
                short_id = f"src-{id_counter}"
                url_to_short_id[url] = short_id
                sources[short_id] = {
                    "short_id": short_id,
                    "title": title,
                    "url": url,
                    "domain": chunk.web.domain,
                    "supported_claims": [],
                }
                id_counter += 1
            chunks_info[idx] = url_to_short_id[url]
        if event.grounding_metadata.grounding_supports:
            for support in event.grounding_metadata.grounding_supports:
                confidence_scores = support.confidence_scores or []
                chunk_indices = support.grounding_chunk_indices or []
                for i, chunk_idx in enumerate(chunk_indices):
                    if chunk_idx in chunks_info:
                        short_id = chunks_info[chunk_idx]
                        confidence = (
                            confidence_scores[i] if i < len(confidence_scores) else 0.5
                        )
                        text_segment = support.segment.text if support.segment else ""
                        sources[short_id]["supported_claims"].append(
                            {
                                "text_segment": text_segment,
                                "confidence": confidence,
                            }
                        )
        break
    
    google_search = {
        "search_queries": search_queries,
        "data":{
            "url_to_short_id": url_to_short_id,
            "sources": sources,
        }
    }
    
    current_state = callback_context.state.get("google_search_detailed", [])
    callback_context.state["google_search_detailed"] = current_state + [google_search]

# _search_engine = LlmAgent(
#     model="gemini-2.5-flash",
#     name="search_engine",
#     description="An agent providing Google-search grounding capability",
#     instruction=""" You are a professional search assistant with Google Search capabilities who uses the `google_search` tool multiple times to gather maximum amount of information. Refer the <CONTEXT/> & <EXAMPLE_FLOW/> for more details.
    
#     <CONTEXT>
#     This contains the complete context about the user and the current state.
#     <user_profile> {user_profile?} </user_profile>
#     <group_details> {group_detail?} </group_details>
#     <budget> {budget?} </budget>
#     <rough_dates> {rough_dates?} </rough_dates>
#     <origin> {origin?} </origin>
#     <destinations> {destinations?} </destinations>
#     <travel_dates> {travel_dates?} </travel_dates>
#     </CONTEXT>
    
#     - Here's the optimal flow:
#         - Figure out the following things:
#             - Locations
#             - Items
#             - Activities
#             - Food
#             - Weather
#             - Any other information that is relevant to the question
#         - show them interesting things to do for the selected location
#         - use `google_search` tool to search the following:
#             - Images of the <places>, <items> or <activities>
#             - Latest news and events (of locations, food, activities, etc.)
#             - Map locations of the <places>
#             - Any other information that is relevant to the question
            
#     <EXAMPLE_FLOW>
#     User Query:
#     User Query:
#     "I want to go to Paris and see the Eiffel Tower."

#     Extracted Tags:
#         - Names: (none)
#         - Places: Paris, Eiffel Tower
#         - Things: (none)
#         - Activities: see Eiffel Tower

#     Search Queries:

#         Places (Paris):
#         - "Top attractions in Paris"
#         - "Best time to visit Paris"

#         Places (Eiffel Tower):
#         - "How to visit the Eiffel Tower"
#         - "Eiffel Tower ticket prices"

#         Activities (see Eiffel Tower):
#         - "Best times to see the Eiffel Tower"
#         - "Photography spots near Eiffel Tower"
#     <EXAMPLE_FLOW/>
#     """,
#     tools=[google_search],
#     output_key="google_search_summary",
#     generate_content_config=GenerateContentConfig(
#         temperature=0.7
#     ),
#     after_agent_callback=_google_search_callback
# )

def create_search_engine(engine_id: int = 1):
    return LlmAgent(
        model="gemini-2.5-flash",
        name=f"_search_engine_{engine_id}",
        description="An agent providing Google-search grounding capability",
        instruction=""" You are a professional search assistant with Google Search capabilities who uses the `google_search` tool multiple times to gather maximum amount of information. Refer the <CONTEXT/> & <EXAMPLE_FLOW/> for more details.
        
        <CONTEXT>
        This contains the complete context about the user and the current state.
        <user_profile> {user_profile?} </user_profile>
        <group_details> {group_detail?} </group_details>
        <budget> {budget?} </budget>
        <rough_dates> {rough_dates?} </rough_dates>
        <origin> {origin?} </origin>
        <destinations> {destinations?} </destinations>
        <travel_dates> {travel_dates?} </travel_dates>
        </CONTEXT>
        
        - Here's the optimal flow:
            - Figure out the following things:
                - Locations
                - Items
                - Activities
                - Food
                - Weather
                - Any other information that is relevant to the question
            - show them interesting things to do for the selected location
            - use `google_search` tool to search the following:
                - Images of the <places>, <items> or <activities>
                - Latest news and events (of locations, food, activities, etc.)
                - Map locations of the <places>
                - Any other information that is relevant to the question
                
        <EXAMPLE_FLOW>
        User Query:
        User Query:
        "I want to go to Paris and see the Eiffel Tower."

        Extracted Tags:
            - Names: (none)
            - Places: Paris, Eiffel Tower
            - Things: (none)
            - Activities: see Eiffel Tower

        Search Queries:

            Places (Paris):
            - "Top attractions in Paris"
            - "Best time to visit Paris"

            Places (Eiffel Tower):
            - "How to visit the Eiffel Tower"
            - "Eiffel Tower ticket prices"

            Activities (see Eiffel Tower):
            - "Best times to see the Eiffel Tower"
            - "Photography spots near Eiffel Tower"
        <EXAMPLE_FLOW/>
        """,
        tools=[google_search],
        output_key="google_search_summary",
        generate_content_config=GenerateContentConfig(
            temperature=0.7
        ),
        after_agent_callback=_google_search_callback
    )

_search_agent = ParallelAgent(
    name="search_agent",
    description="An agent providing Google-search grounding capability",
    sub_agents=[create_search_engine(1), create_search_engine(2), create_search_engine(3)]
)

google_search_grounding = AgentTool(
    agent=_search_agent
)