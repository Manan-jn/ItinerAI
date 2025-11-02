from fastapi import APIRouter, Depends, HTTPException
from starlette.responses import JSONResponse
from google.adk.events import Event, EventActions

from ..models import SessionManager
from ..schema.session_schema import CreateSessionSchema, SessionSchema
from ..common import get_session_manager

import os 
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from shared.post_processor import merge_dict_intelligently

router = APIRouter()


@router.post("/session/create")
async def create_session(
    request: CreateSessionSchema,
    session_manager: SessionManager = Depends(get_session_manager),
):
    try:
        session = await session_manager.create_session(request.user_id)
        return JSONResponse(
            status_code=200,
            content={
                "message": "Session created successfully",
                "body":{
                    "user_id": session.user_id,
                    "session_id": session.id
                }
            },
        )
    except Exception as e:
        return JSONResponse(status_code=500, content=str(e))

@router.post("/session/get")
async def create_session(
    request: SessionSchema,
    session_manager: SessionManager = Depends(get_session_manager),
):
    try:
        session = await session_manager.get_session(request.user_id, request.session_id)
        return JSONResponse(
            status_code=200,
            content={
                "message": "Session fetched successfully",
                "body":{
                    "user_id": session.user_id,
                    "session_id": session.id
                }
            },
        )
    except Exception as e:
        return JSONResponse(status_code=500, content=str(e))

@router.post("/session/delete")
async def delete_memory(
    request: SessionSchema,
    session_manager: SessionManager = Depends(get_session_manager),
):
    try:
        await session_manager.delete_session(request.user_id, request.session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/session/history")
async def get_session_history(
    request: SessionSchema,
    session_manager: SessionManager = Depends(get_session_manager),
):
    try:
        session = await session_manager.get_session(request.user_id, request.session_id)
        events = session.events
        print(events[-1])
        return JSONResponse(
            status_code=200,
            content={
                "message": "Session history fetched successfully",
                "body": events,
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))