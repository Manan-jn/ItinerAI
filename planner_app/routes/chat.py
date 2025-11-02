from fastapi import APIRouter, Depends
from starlette.responses import JSONResponse
# from google.adk.agents.context_cache_config import ContextCacheConfig

from ..common import get_session_manager
from ..models.session import SessionManager
from ..schema.chat_schema import ChatRequest, ItineraryRequest
from ..controllers.chat_controller import *
from ..shared.log_config import logger

router = APIRouter()

@router.post("/agents/chat")
async def root_agent_chat(
    request: ChatRequest, session_manager: SessionManager = Depends(get_session_manager)
):
    try:
        agent_output = await root_agent_controller(request, session_manager)
        return JSONResponse(
            status_code=200,
            content={
                "user_id": request.user_id,
                "session_id": request.session_id,
                "message": agent_output,
            },
        )
    except Exception as e:
        logger.error(f"Error in root_agent_chat", exc_info=True)
        return JSONResponse(status_code=500, content=str(e))


@router.post("/agents/conveyance")
async def conveyance_agent_chat(
    request: ChatRequest, session_manager: SessionManager = Depends(get_session_manager)
):
    try:
        agent_output = await conveyance_agent_controller(request, session_manager)
        return JSONResponse(
            status_code=200,
            content={
                "user_id": request.user_id,
                "session_id": request.session_id,
                "message": agent_output,
            },
        )
    except Exception as e:
        logger.error(f"Error in conveyance_agent_chat", exc_info=True)
        return JSONResponse(status_code=500, content=str(e))


@router.post("/agents/stay")
async def stay_agent_chat(
    request: ChatRequest, session_manager: SessionManager = Depends(get_session_manager)
):
    try:
        agent_output = await stay_agent_controller(request, session_manager)
        return JSONResponse(
            status_code=200,
            content={
                "user_id": request.user_id,
                "session_id": request.session_id,
                "message": agent_output,
            },
        )
    except Exception as e:
        logger.error(f"Error in stay_agent_chat", exc_info=True)
        return JSONResponse(status_code=500, content=str(e))


@router.post("/agents/itinerary")
async def itinerary_agent_chat(
    request: ItineraryRequest, session_manager: SessionManager = Depends(get_session_manager)
):
    try:
        agent_output = await itinerary_chat_controller(request, session_manager)
        
        return JSONResponse(
            status_code=200,
            content={
                "user_id": request.user_id,
                "session_id": request.session_id,
                "message": agent_output,
            },
        )
    except Exception as e:
        logger.error(f"Error in itinerary_agent_chat", exc_info=True)
        return JSONResponse(status_code=500, content=str(e))
