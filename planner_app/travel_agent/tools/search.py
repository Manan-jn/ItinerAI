from google.genai import types
from google.adk.agents import LlmAgent, ParallelAgent
from google.adk.tools.agent_tool import AgentTool
from google.adk.agents.callback_context import CallbackContext
from google.adk.tools.google_search_tool import google_search
from google.genai.types import GenerateContentConfig

from ..shared_libraries.types import safety_settings, http_options


# def _google_search_callback(callback_context: CallbackContext) -> None:
#     session = callback_context._invocation_context.session
#     url_to_short_id = {}
#     sources = {}
#     search_queries = []
#     id_counter = 1

#     for event in reversed(session.events):
#         if not (event.grounding_metadata and event.grounding_metadata.grounding_chunks):
#             continue
#         chunks_info = {}
#         search_queries = event.grounding_metadata.web_search_queries
#         for idx, chunk in enumerate(event.grounding_metadata.grounding_chunks):
#             if not chunk.web:
#                 continue
#             url = chunk.web.uri
#             title = (
#                 chunk.web.title
#                 if chunk.web.title != chunk.web.domain
#                 else chunk.web.domain
#             )
#             if url not in url_to_short_id:
#                 short_id = f"src-{id_counter}"
#                 url_to_short_id[url] = short_id
#                 sources[short_id] = {
#                     "short_id": short_id,
#                     "title": title,
#                     "url": url,
#                     "domain": chunk.web.domain,
#                     "supported_claims": [],
#                 }
#                 id_counter += 1
#             chunks_info[idx] = url_to_short_id[url]
#         if event.grounding_metadata.grounding_supports:
#             for support in event.grounding_metadata.grounding_supports:
#                 confidence_scores = support.confidence_scores or []
#                 chunk_indices = support.grounding_chunk_indices or []
#                 for i, chunk_idx in enumerate(chunk_indices):
#                     if chunk_idx in chunks_info:
#                         short_id = chunks_info[chunk_idx]
#                         confidence = (
#                             confidence_scores[i] if i < len(confidence_scores) else 0.5
#                         )
#                         text_segment = support.segment.text if support.segment else ""
#                         sources[short_id]["supported_claims"].append(
#                             {
#                                 "text_segment": text_segment,
#                                 "confidence": confidence,
#                             }
#                         )
#         break

#     google_search = {
#         "search_queries": search_queries,
#         "data":{
#             "url_to_short_id": url_to_short_id,
#             "sources": sources,
#         }
#     }

#     current_state = callback_context.state.get("google_search_detailed", [])
#     callback_context.state["google_search_detailed"] = current_state + [google_search]

# def _google_response_callback(callback_context: CallbackContext) -> None:
#     current_state = callback_context.state
#     response = current_state.get("google_search_summary", "")
#     print("google_search_summary", response)

#     if current_state.get("google_search_summary"):
#         current_state["google_search_summary"] = current_state["google_search_summary"] + [response]
#     else:
#         current_state["google_search_summary"] = [response]

google_search_agent = LlmAgent(
    model="gemini-2.5-flash-lite",
    name="google_search_agent",
    description="An agent providing Google-search results capability",
    instruction="""  
        Answer the user's question directly using `google_search` grounding tool; Provide a brief but concise response. 
        Do not ask the user to check or look up information for themselves, that's your role; do your best to be informative
        
        Always provide the summary in a structured JSON format for others to understand without missing any information in the structured format.
        """,
    tools=[google_search],
    generate_content_config=GenerateContentConfig(
        temperature=0.3, safety_settings=safety_settings, http_options=http_options,
        automatic_function_calling=types.AutomaticFunctionCallingConfig(maximum_remote_calls=100)
    ),
    include_contents="none",
    # after_agent_callback=[_google_search_callback]
)
