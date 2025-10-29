from fastapi import APIRouter, Depends
from starlette.responses import JSONResponse
from google.adk.runners import Runner
from google.genai.types import Content, Part
from google.adk.agents.context_cache_config import ContextCacheConfig
from google.adk.apps.app import App
from google.adk.sessions import InMemorySessionService

from ..common import get_session_service
from ..schema import ChatRequest, ChatResponse
from ..models import SessionManager
from ..travel_agent import root_agent, conveyance_agent, stay_agent, itinerary_agent

import os 
import sys
import time
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from shared.post_processor import string_to_json
router = APIRouter()


@router.post("/agents/chat", response_model=ChatResponse)
async def root_agent_chat(
    request: ChatRequest, session_service: SessionManager = Depends(get_session_service)
):
    try:
        app = App(
            name="planner_ai",
            root_agent=root_agent,
            # context_cache_config=ContextCacheConfig(
            #     cache_intervals=10
            # ),
        )
        runner = Runner(
            app=app,
            session_service=session_service.session_service,
        )

        await session_service.get_session(request.session_id, request.user_id)
        user_message = Content(role="user", parts=[Part(text=request.message)])
        final_text = None
        
        start_time = time.time()    
        for event in runner.run(
            user_id=request.user_id,
            session_id=request.session_id,
            new_message=user_message,
        ):
            if event.is_final_response():
                if event.content and event.content.parts:
                    final_text = [part.text for part in event.content.parts if part.text and not part.thought]
                    final_text = '\n'.join(final_text)

        final_json_text = await string_to_json(final_text)
        print(f"Time taken: {time.time() - start_time} seconds")

        return JSONResponse(
            status_code=200,
            content={
                "user_id": request.user_id,
                "session_id": request.session_id,
                "message": final_json_text or final_text or "",
            },
        )
    except Exception as e:
        print(e)
        return JSONResponse(status_code=500, content=str(e))


@router.post("/agents/conveyance")
async def conveyance_agent_chat(
    request: ChatRequest, session_service: SessionManager = Depends(get_session_service)
):
    try:
        app = App(
            name="planner_ai",
            root_agent=conveyance_agent,
            # context_cache_config=ContextCacheConfig(
            #     cache_intervals=10
            # ),
        )
        runner = Runner(
            app=app,
            session_service=session_service.session_service,
        )

        await session_service.get_session(request.session_id, request.user_id)
        user_message = Content(role="user", parts=[Part(text=request.message)])
        final_text = None
        for event in runner.run(
            user_id=request.user_id,
            session_id=request.session_id,
            new_message=user_message,
        ):
            if event.is_final_response():
                if event.content and event.content.parts:
                    final_text = [part.text for part in event.content.parts if part.text and not part.thought]
                    final_text = '\n'.join(final_text)

        final_json_text = await string_to_json(final_text)
        return JSONResponse(
            status_code=200,
            content={
                "user_id": request.user_id,
                "session_id": request.session_id,
                "message": final_json_text or final_text or "",
            },
        )
    except Exception as e:
        return JSONResponse(status_code=500, content=str(e))


@router.post("/agents/stay")
async def stay_agent_chat(
    request: ChatRequest, session_service: SessionManager = Depends(get_session_service)
):
    try:
        app = App(
            name="planner_ai",
            root_agent=stay_agent,
            # context_cache_config=ContextCacheConfig(
            #     cache_intervals=10
            # ),
        )
        runner = Runner(
            app=app,
            session_service=session_service.session_service,
        )

        await session_service.get_session(request.session_id, request.user_id)
        user_message = Content(role="user", parts=[Part(text=request.message)])
        final_text = None
        for event in runner.run(
            user_id=request.user_id,
            session_id=request.session_id,
            new_message=user_message,
        ):
            if event.is_final_response():
                if event.content and event.content.parts:
                    final_text = [part.text for part in event.content.parts if part.text and not part.thought]
                    final_text = '\n'.join(final_text)

        final_json_text = await string_to_json(final_text)
        return JSONResponse(
            status_code=200,
            content={
                "user_id": request.user_id,
                "session_id": request.session_id,
                "message": final_json_text or final_text or "",
            },
        )
    except Exception as e:
        return JSONResponse(status_code=500, content=str(e))
    
@router.post("/agents/itinerary")
async def itinerary_agent_chat(
    request: ChatRequest, session_service: SessionManager = Depends(get_session_service)
):
    try:
        app = App(
            name="planner_ai",
            root_agent=itinerary_agent,
            # context_cache_config=ContextCacheConfig(
            #     cache_intervals=10
            # ),
        )
        runner = Runner(
            app=app,
            session_service=session_service.session_service,
        )

        await session_service.get_session(request.session_id, request.user_id)
        user_message = Content(role="user", parts=[Part(text=request.message)])
        final_text = None
        for event in runner.run(
            user_id=request.user_id,
            session_id=request.session_id,
            new_message=user_message,
        ):
            if event.is_final_response():
                if event.content and event.content.parts:
                    final_text = [part.text for part in event.content.parts if part.text and not part.thought]
                    final_text = '\n'.join(final_text)

        final_json_text = await string_to_json(final_text)
        return JSONResponse(
            status_code=200,
            content={
                "user_id": request.user_id,
                "session_id": request.session_id,
                "message": final_json_text or final_text or "",
            },
        )
    except Exception as e:
        return JSONResponse(status_code=500, content=str(e))
