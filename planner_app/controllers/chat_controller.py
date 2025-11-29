from google.adk.apps.app import App, EventsCompactionConfig
from google.genai.types import HttpRetryOptions
from google.adk.apps.llm_event_summarizer import LlmEventSummarizer
from google.adk.models import Gemini
from google.adk.runners import Runner
from google.genai.types import Content, Part
from tenacity import retry, stop_after_attempt, wait_exponential_jitter
from contextvars import ContextVar

from ..exceptions.base import AppException
from ..schema.chat_schema import *
from ..travel_agent.agent import *
from ..shared.post_processor import string_to_json
from ..models import SessionManager
from ..services.chat_services import *
from ..shared.log_config import logger
from ..travel_agent.tools.places import map_helper
from ..travel_agent.tools.search import google_search_agent
from ..travel_agent.tools.maps import google_maps_agent
from ..services.firebase import get_firebase_data
from .temp import * 

retry_attempt = ContextVar('retry_attempt', default=1)

def before_retry(retry_state):
    print(f"Retry attempt: {retry_state.attempt_number}")
    retry_attempt.set(retry_state.attempt_number)

_events_compaction_config = EventsCompactionConfig(
    compaction_interval=3,
    overlap_size=1,
    summarizer=LlmEventSummarizer(
        Gemini(
            model="gemini-2.5-flash",
            retry_options=HttpRetryOptions(
                initial_delay=5, attempts=3, exp_base=2, jitter=0.5
            ),
        )
    ),
)

@retry(stop=stop_after_attempt(3), wait=wait_exponential_jitter(initial=5, exp_base=2, jitter=0.5), before=before_retry)
async def root_agent_controller(request: ChatRequest, session_manager: SessionManager):
    try:

        runner = Runner(
            app=App(
                name="agents",
                root_agent=root_agent
            ),
            session_service=session_manager.session_service,
        )

        user_message = Content(role="user", parts=[Part(text=request.message)])

        async for event in runner.run_async(
            user_id=request.user_id,
            session_id=request.session_id,
            new_message=user_message,
            state_delta={"current_datetime": request.datetime},
        ):
            if event.is_final_response():
                if event.content and event.content.parts:
                    final_text = [
                        part.text
                        for part in event.content.parts
                        if part.text and not part.thought
                    ]
                    logger.info(f"Final text list length: {len(final_text)}")
                    final_text_response = "".join(final_text)

        agent_json_response = await string_to_json(final_text_response)
        agent_json_response = await map_helper(agent_json_response)
        return agent_json_response or final_text_response
    except Exception as e:
        logger.error(f"Error in root_agent_controller", exc_info=True)
        raise AppException(message=str(e))


@retry(stop=stop_after_attempt(3), wait=wait_exponential_jitter(initial=5, exp_base=2, jitter=0.5))
async def travel_dates_agent_controller(request: TravelDatesRequest, session_manager: SessionManager):
    try:
        runner = Runner(
            app=App(
                name="agents",
                root_agent=travel_dates_agent,
            ),
            session_service=session_manager.session_service,
        )
        user_query = await get_travel_dates_user_query(request)
        user_message = Content(role="user", parts=[Part(text=user_query)])
        async for event in runner.run_async(
            user_id=request.user_id,
            session_id=request.session_id,
            new_message=user_message,
            state_delta={"current_datetime": request.datetime},
        ):
            if event.is_final_response():
                if event.content and event.content.parts:
                    final_text = [
                        part.text
                        for part in event.content.parts
                        if part.text and not part.thought
                    ]
                    final_text_response = "".join(final_text)

        agent_json_response = await string_to_json(final_text_response)
        return agent_json_response or final_text_response
    except Exception as e:
        logger.error(f"Error in travel_dates_agent_controller", exc_info=True)
        raise AppException(message=str(e))

@retry(stop=stop_after_attempt(3), wait=wait_exponential_jitter(initial=5, exp_base=2, jitter=0.5))
async def conveyance_agent_controller(
    request: ConveyanceRequest, session_manager: SessionManager
):
    try:
        runner = Runner(
            app=App(
                name="agents",
                root_agent=conveyance_agent,
            ),
            session_service=session_manager.session_service,
        )

        user_query = await get_conveyance_user_query(request)
        user_message = Content(role="user", parts=[Part(text=user_query)])
        async for event in runner.run_async(
            user_id=request.user_id,
            session_id=request.session_id,
            new_message=user_message,
            state_delta={"current_datetime": request.datetime},
        ):
            if event.is_final_response():
                if event.content and event.content.parts:
                    final_text = [
                        part.text
                        for part in event.content.parts
                        if part.text and not part.thought
                    ]
                    final_text_response = "".join(final_text)

        agent_json_response = await string_to_json(final_text_response)
        return agent_json_response or final_text_response
    except Exception as e:
        logger.error(f"Error in conveyance_agent_controller", exc_info=True)
        raise AppException(message=str(e))


@retry(stop=stop_after_attempt(3), wait=wait_exponential_jitter(initial=5, exp_base=2, jitter=0.5))
async def stay_agent_controller(request: StayRequest, session_manager: SessionManager):
    try:
        runner = Runner(
            app=App(
                name="agents",
                root_agent=stay_agent,
            ),
            session_service=session_manager.session_service,
        )

        user_query = await get_stay_user_query(request)
        user_message = Content(role="user", parts=[Part(text=user_query)])
        async for event in runner.run_async(
            user_id=request.user_id,
            session_id=request.session_id,
            new_message=user_message,
            state_delta={"current_datetime": request.datetime},
        ):
            if event.is_final_response():
                if event.content and event.content.parts:
                    final_text = [
                        part.text
                        for part in event.content.parts
                        if part.text and not part.thought
                    ]
                    final_text_response = "".join(final_text)

        agent_json_response = await string_to_json(final_text_response)
        return agent_json_response or final_text_response
    except Exception as e:
        logger.error(f"Error in stay_agent_controller", exc_info=True)
        raise AppException(message=str(e))


@retry(stop=stop_after_attempt(3), wait=wait_exponential_jitter(initial=5, exp_base=2, jitter=0.5))
async def itinerary_chat_controller(
    request: ItineraryRequest, session_manager: SessionManager
):
    try:
        user_query = await get_itinerary_user_query(request)
        user_message = Content(role="user", parts=[Part(text=user_query)])

        runner = Runner(
            app=App(
                name="agents",
                root_agent=itinerary_agent,
            ),
            session_service=session_manager.session_service,
        )

        async for event in runner.run_async(
            user_id=request.user_id,
            session_id=request.session_id,
            new_message=user_message,
            state_delta={
                "current_datetime": request.datetime,
                "current_itinerary": request.current_itinerary,
            },
        ):
            if event.is_final_response():
                if event.content and event.content.parts:
                    final_text = [
                        part.text
                        for part in event.content.parts
                        if part.text and not part.thought
                    ]
                    final_text_response = "".join(final_text)

        agent_json_response = await string_to_json(final_text_response)
        agent_json_response = await map_helper(agent_json_response)
        return agent_json_response or final_text_response
    except Exception as e:
        logger.error(f"Error in itinerary_chat_controller", exc_info=True)
        raise AppException(message=str(e))


@retry(stop=stop_after_attempt(3), wait=wait_exponential_jitter(initial=5, exp_base=2, jitter=0.5))
async def pre_trip_agent_controller(request: PreTripRequest, session_manager: SessionManager):
    try:
       
        user_query = "Generate the pre-trip brief for the user's final itinerary."
        user_message = Content(role="user", parts=[Part(text=user_query)])
    
        runner = Runner(
            app=App(
                name="agents",
                root_agent=pre_trip_agent,
            ),
            session_service=session_manager.session_service,
        )
        
        async for event in runner.run_async(
            user_id=request.user_id,
            session_id=request.session_id,
            new_message=user_message,
            state_delta={"current_datetime": request.datetime},
        ):
            if event.is_final_response():
                if event.content and event.content.parts:
                    final_text = [
                        part.text
                        for part in event.content.parts
                        if part.text and not part.thought
                    ]
                    final_text_response = "".join(final_text)

        return final_text_response
    except Exception as e:
        logger.error(f"Error in pre_trip_agent_controller", exc_info=True)
        raise AppException(message=str(e))

async def in_trip_agent_controller(request: InTripRequest, session_manager: SessionManager):
    try:
        user_query = await get_in_trip_user_query(request)
        if not user_query:
            return {
                "response_type": "no_update"
            }
        user_message = Content(role="user", parts=[Part(text=user_query)])
        runner = Runner(
            app=App(
                name="agents",
                root_agent=in_trip_agent,
            ),
            session_service=session_manager.session_service,
        )
        
        async for event in runner.run_async(
            user_id=request.user_id,
            session_id=request.session_id,
            new_message=user_message,
            state_delta={"current_datetime": request.datetime},
        ):
            if event.is_final_response():
                if event.content and event.content.parts:
                    final_text = [
                        part.text
                        for part in event.content.parts
                        if part.text and not part.thought
                    ]
                    final_text_response = "".join(final_text)
            

        agent_json_response = await string_to_json(final_text_response)
        agent_json_response = await map_helper(agent_json_response)
        return agent_json_response or final_text_response
    except Exception as e:
        logger.error(f"Error in in_trip_agent_controller", exc_info=True)
        raise AppException(message=str(e))

async def google_search_controller(request: GoogleServicesRequest, session_manager: SessionManager):
    try:
        user_query = request.query
        user_id = request.user_id
        session_id = request.session_id
        
        if request.phone_number:
            firebase_data = await get_firebase_data("user_creds", request.phone_number)
            user_id = firebase_data.get("user_id", None)
            session_id = firebase_data.get("session_id", None)
            
        if not user_id or not session_id:
            raise AppException(message="User ID and session ID not found")
            
        user_message = Content(role="user", parts=[Part(text=user_query)])
        runner = Runner(
            app=App(
                name="agents",
                root_agent=google_search_agent,
                # events_compaction_config=_events_compaction_config,
            ),
            session_service=session_manager.session_service,
        )
        async for event in runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=user_message,
        ):
            if event.is_final_response():
                if event.content and event.content.parts:
                    final_text = [
                        part.text
                        for part in event.content.parts
                        if part.text and not part.thought
                    ]
                    final_text_response = "".join(final_text)
        return final_text_response
    except Exception as e:
        logger.error(f"Error in get_google_search_results_controller", exc_info=True)
        raise AppException(message=str(e))

async def google_maps_controller(request: GoogleServicesRequest, session_manager: SessionManager):
    try:
        user_query = request.query
        user_id = request.user_id
        session_id = request.session_id
        
        if request.phone_number:
            firebase_data = await get_firebase_data("user_creds", request.phone_number)
            user_id = firebase_data.get("user_id", None)
            session_id = firebase_data.get("session_id", None)
            
        if not user_id or not session_id:
            raise AppException(message="User ID and session ID not found")
        
        user_query = request.query
        user_message = Content(role="user", parts=[Part(text=user_query)])
        runner = Runner(
            app=App(
                name="agents",
                root_agent=google_maps_agent,
                # events_compaction_config=_events_compaction_config,
            ),
            session_service=session_manager.session_service,
        )
        async for event in runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=user_message,
        ):
            if event.is_final_response():
                if event.content and event.content.parts:
                    final_text = [
                        part.text
                        for part in event.content.parts
                        if part.text and not part.thought
                    ]
                    final_text_response = "".join(final_text)
        return final_text_response
    except Exception as e:
        logger.error(f"Error in google_maps_controller", exc_info=True)
        raise AppException(message=str(e))
