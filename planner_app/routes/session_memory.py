from fastapi import APIRouter, Depends, HTTPException
from starlette.responses import JSONResponse
from google.adk.events import Event, EventActions

from ..models import SessionManager
from ..schema.session_schema import SessionSchema, AddMemorySchema, DeleteMemorySchema
from ..common import get_session_service
from ..shared.post_processor import merge_dict_intelligently

router = APIRouter()


@router.get("/memory/get")
async def get_session(
    request: SessionSchema,
    session_service: SessionManager = Depends(get_session_service),
):
    try:
        session = await session_service.get_session(request.session_id, request.user_id)
        return JSONResponse(
            status_code=200,
            content=session.state,
        )
    except Exception as e:
        return JSONResponse(status_code=500, content=str(e))


@router.post("/memory/add")
async def add_memory(
    request: AddMemorySchema,
    session_service: SessionManager = Depends(get_session_service),
):
    try:
        current_state = await session_service.get_session(
            request.session_id, request.user_id
        )
        new_state = await merge_dict_intelligently(current_state.state, request.updates)
        action_with_update = EventActions(state_delta=new_state)
        system_event = Event(
            author="system",
            actions=action_with_update,
            invocation_id=request.invocation_id,
        )
        await session_service.append_event(
            request.session_id, request.user_id, system_event
        )
        return JSONResponse(
            status_code=200,
            content={
                "user_id": request.user_id,
                "session_id": request.session_id,
                "message": "Memory added successfully",
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/memory/delete")
async def delete_memory(
    request: DeleteMemorySchema,
    session_service: SessionManager = Depends(get_session_service),
):
    try:
        current_state = await session_service.get_session(
            request.session_id, request.user_id
        )
        new_state = current_state.state.copy()

        for memory_key in request.memory_keys:
            if memory_key in current_state.state:
                new_state[memory_key] = None

        action_with_update = EventActions(state_delta=new_state)
        system_event = Event(
            author="system",
            actions=action_with_update,
            invocation_id=request.invocation_id,
        )
        await session_service.append_event(
            request.session_id, request.user_id, system_event
        )
        return JSONResponse(
            status_code=200,
            content={
                "user_id": request.user_id,
                "session_id": request.session_id,
                "message": "Memory deleted successfully",
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/memory/chat_history")
async def get_chat_history(
    request: SessionSchema,
    session_service: SessionManager = Depends(get_session_service),
):
    session = await session_service.get_session(request.session_id, request.user_id)
    print(session.events)
    return JSONResponse(
        status_code=200,
        content="session.chat_history",
    )
