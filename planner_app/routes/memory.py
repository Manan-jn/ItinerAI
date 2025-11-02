import os
import sys
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from starlette.responses import JSONResponse
from google.adk.events import Event, EventActions

from ..controllers.memory_controller import *
from ..models import SessionManager
from ..schema.memory_schema import GetMemorySchema, AddMemorySchema, DeleteMemorySchema
from ..common import get_session_manager


router = APIRouter()


@router.post("/memory/get")
async def get_memory(
    request: GetMemorySchema,
    session_manager: SessionManager = Depends(get_session_manager),
):
    try:
        session = await session_manager.get_session(request.user_id, request.session_id)
        return JSONResponse(
            status_code=200,
            content=session.state,
        )
    except Exception as e:
        return JSONResponse(status_code=500, content=str(e))


@router.post("/memory/add")
async def add_memory(
    request: AddMemorySchema,
    session_manager: SessionManager = Depends(get_session_manager),
):
    try:
        await add_memory_controller(request.user_id, request.session_id, request.updates, session_manager)
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


@router.post("/memory/delete")
async def delete_memory(
    request: DeleteMemorySchema,
    session_manager: SessionManager = Depends(get_session_manager),
):
    try:
        await delete_memory_controller(request.user_id, request.session_id, request.memory_keys, session_manager)
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


# @router.post("/memory/chat_history")
# async def get_chat_history(
#     request: SessionSchema,
#     session_manager: SessionManager = Depends(get_session_manager),
# ):
#     session = await session_manager.get_session(request.session_id, request.user_id)
#     print(session.events)
#     return JSONResponse(
#         status_code=200,
#         content="session.chat_history",
#     )
