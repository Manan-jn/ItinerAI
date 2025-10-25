from fastapi import APIRouter, Depends
from starlette.responses import JSONResponse
from google.adk.runners import Runner
from google.genai.types import Content, Part

from ..common import get_session_service
from ..schema import ChatRequest, ChatResponse
from ..models import SessionManager
from ..travel_agent import root_agent, conveyance_agent
from ..shared.post_processor import string_to_json

router = APIRouter()


@router.post("/agents/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest, session_service: SessionManager = Depends(get_session_service)
):
    try:
        runner = Runner(
            app_name="planner_ai", 
            agent=root_agent,
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
                    final_text = event.content.parts[0].text

        final_json_text = string_to_json(final_text)
            
        return JSONResponse(
            status_code=200,
            content={
                "user_id": request.user_id,
                "session_id": request.session_id,
                "message": final_json_text or final_text or "",
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content = str(e)
        )    

@router.post("/agents/conveyance")
async def chat(
    request: ChatRequest, session_service: SessionManager = Depends(get_session_service)
):
    try:
        runner = Runner(
            app_name="planner_ai",
            agent=conveyance_agent,
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
                    final_text = event.content.parts[0].text

        final_json_text = string_to_json(final_text)    
        return JSONResponse(
            status_code=200,
            content={
                "user_id": request.user_id,
                "session_id": request.session_id,
                "message": final_json_text or final_text or "",
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content = str(e)
        )   
