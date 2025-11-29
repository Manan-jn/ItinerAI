import asyncio
from google.adk.sessions import Session

from ..models.session import SessionManager
from ..schema.session_schema import CreateSessionSchema
from ..services.firebase import put_firebase_data


async def create_session_controller(request: CreateSessionSchema, session_manager: SessionManager) -> Session:
    session = await session_manager.create_session(request.user_id)
    data = {
        "user_id": session.user_id,
        "session_id": session.id,
        "created_at": request.created_at,
    }
    asyncio.create_task(put_firebase_data("user_creds", request.phone_number, data))
    
    return session