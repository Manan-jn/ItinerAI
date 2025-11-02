import time
import zoneinfo
from datetime import datetime
from google.adk.apps.app import App
from google.adk.runners import Runner
from google.genai.types import Content, Part
from tenacity import retry, stop_after_attempt, wait_exponential_jitter
from contextvars import ContextVar

from ..exceptions.base import AppException
from ..schema.chat_schema import *
from ..travel_agent.agent import *
from ..shared.post_processor import string_to_json
from .memory_controller import *
from ..models import SessionManager
from ..services.chat_services import *
from ..shared.log_config import logger
from ..travel_agent.tools.places import map_helper

retry_attempt = ContextVar('retry_attempt', default=1)

def before_retry(retry_state):
    print(f"Retry attempt: {retry_state.attempt_number}")
    retry_attempt.set(retry_state.attempt_number)


@retry(stop=stop_after_attempt(3), wait=wait_exponential_jitter(initial=5, exp_base=2, jitter=0.5), before=before_retry)
async def root_agent_controller(request: ChatRequest, session_manager: SessionManager):
    try:
        runner = Runner(
            app=App(
                name="agents",
                root_agent=root_agent,
                # context_cache_config=ContextCacheConfig(cache_intervals=10),
            ),
            session_service=session_manager.session_service,
        )

        current_datetime = datetime.now(zoneinfo.ZoneInfo("Asia/Kolkata")).strftime(
            "%Y-%m-%d %H:%M:%S"
        )
        await add_memory_controller(
            request.user_id,
            request.session_id,
            {"current_datetime": current_datetime},
            session_manager,
        )
        if retry_attempt.get() > 1:
            request.message = f"Retry attempt: {retry_attempt.get()}. {request.message}"
        else:
            user_message = Content(role="user", parts=[Part(text=request.message)])

        final_text = ""
        start_time = time.time()
        async for event in runner.run_async(
            user_id=request.user_id,
            session_id=request.session_id,
            new_message=user_message,
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
                    # author = event.author
        
        logger.info(f"Final text list:")
        for text in final_text:
            logger.info(f"Text: {text}")
        agent_json_response = await string_to_json(final_text_response)
        logger.info(f"Agent response converted to JSON")
        agent_json_response = await map_helper(agent_json_response)
        logger.info(f"Agent response JSON updated with map URLs")
        
        print(f"Time taken: {time.time() - start_time} seconds")
        return agent_json_response or final_text_response
    except Exception as e:
        logger.error(f"Error in root_agent_controller", exc_info=True)
        raise AppException(message=str(e))


@retry(stop=stop_after_attempt(3), wait=wait_exponential_jitter(initial=5, exp_base=2, jitter=0.5))
async def conveyance_agent_controller(
    request: ChatRequest, session_manager: SessionManager
):
    try:
        runner = Runner(
            app=App(
                name="agents",
                root_agent=conveyance_agent,
                # context_cache_config=ContextCacheConfig(cache_intervals=10),
            ),
            session_service=session_manager.session_service,
        )

        current_datetime = datetime.now(zoneinfo.ZoneInfo("Asia/Kolkata")).strftime(
            "%Y-%m-%d %H:%M:%S"
        )
        await add_memory_controller(
            request.user_id,
            request.session_id,
            {"current_datetime": current_datetime},
            session_manager,
        )
        user_message = Content(role="user", parts=[Part(text=request.message)])
        final_text = ""
        async for event in runner.run_async(
            user_id=request.user_id,
            session_id=request.session_id,
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

        agent_json_response = await string_to_json(final_text_response)
        return agent_json_response or final_text_response
    except Exception as e:
        logger.error(f"Error in conveyance_agent_controller", exc_info=True)
        raise AppException(message=str(e))


@retry(stop=stop_after_attempt(3), wait=wait_exponential_jitter(initial=5, exp_base=2, jitter=0.5))
async def stay_agent_controller(request: ChatRequest, session_manager: SessionManager):
    try:
        runner = Runner(
            app=App(
                name="agents",
                root_agent=stay_agent,
                # context_cache_config=ContextCacheConfig(cache_intervals=10),
            ),
            session_service=session_manager.session_service,
        )

        current_datetime = datetime.now(zoneinfo.ZoneInfo("Asia/Kolkata")).strftime(
            "%Y-%m-%d %H:%M:%S"
        )
        await add_memory_controller(
            request.user_id,
            request.session_id,
            {"current_datetime": current_datetime},
            session_manager,
        )
        user_message = Content(role="user", parts=[Part(text=request.message)])
        final_text = ""
        async for event in runner.run_async(
            user_id=request.user_id,
            session_id=request.session_id,
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
                # context_cache_config=ContextCacheConfig(cache_intervals=10),
            ),
            session_service=session_manager.session_service,
        )

        await delete_memory_controller(
            request.user_id,
            request.session_id,
            ["current_itinerary"],
            session_manager
        )
        await add_memory_controller(
            request.user_id,
            request.session_id,
            {
                "current_itinerary": request.current_itinerary,
                "current_datetime": datetime.now(zoneinfo.ZoneInfo("Asia/Kolkata")).strftime(
                    "%Y-%m-%d %H:%M:%S"
                ),
            },
            session_manager,
        )

        final_text = ""
        async for event in runner.run_async(
            user_id=request.user_id,
            session_id=request.session_id,
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

        logger.info(f"Final text list")
        for text in final_text:
            logger.info(f"Text: {text}")
        agent_json_response = await string_to_json(final_text_response)
        logger.info(f"Agent JSON response: {agent_json_response}")
        agent_json_response = await map_helper(agent_json_response)
        logger.info(f"Agent JSON response updated with map URLs")
        return agent_json_response or final_text_response
    except Exception as e:
        logger.error(f"Error in itinerary_chat_controller", exc_info=True)
        raise AppException(message=str(e))
