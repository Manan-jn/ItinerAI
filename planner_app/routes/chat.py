from fastapi import APIRouter, Depends
from google.adk.runners import Runner
from google.genai.types import Content, Part

from ..travel_agent import root_agent
from ..utils import get_session_service
from ..schema import ChatRequest, ChatResponse
from ..models import SessionManager

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, session_service: SessionManager = Depends(get_session_service)):
    runner = Runner(
        app_name = "planner_ai",
        agent = root_agent,
        session_service = session_service.session_service
    )
    
    session = await session_service.create_session(request.session_id, request.user_id)
    user_message = Content(role="user", parts=[Part(text=request.message)])
    final_text = None
    for event in runner.run(
        user_id = request.user_id,
        session_id = request.session_id,
        new_message = user_message,
    ):
        if event.is_final_response():
            if event.content and event.content.parts:
                final_text = event.content.parts[0].text

    updated_session = await session_service.get_session(request.session_id, request.user_id)
    print("inital session: ", session.state, type(session.state))
    print("updated_session: ", updated_session.state, type(updated_session.state))
    return ChatResponse(
        user_id=request.user_id,
        session_id=request.session_id,
        message=final_text or "",
    )