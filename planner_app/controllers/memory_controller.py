from datetime import datetime
from google.adk.events import Event, EventActions

from ..models.session import SessionManager
from ..shared.post_processor import merge_dict_intelligently
from ..shared.log_config import logger
from ..exceptions.base import AppException
from ..schema.memory_schema import GetMemorySchema
from ..services.firebase import get_firebase_data

async def add_memory_controller(user_id: str, session_id: str, updates: dict, session_manager: SessionManager):
    try:
        session = await session_manager.get_session(
            user_id, session_id
        )
        new_state = await merge_dict_intelligently(session.state, updates)
        action_with_update = EventActions(state_delta=new_state)
        system_event = Event(
            author="system",
            actions=action_with_update,
            invocation_id=f"update_memory:{datetime.now().strftime('%Y%m%d%H%M%S')}",
        )
        await session_manager.append_event(
            session, system_event
        )
        return True
    except Exception as e:
        logger.error(f"Error in add_memory_controller: {e}")
        raise AppException(f"Error in add_memory_controller: {e}")
    
async def delete_memory_controller(user_id: str, session_id: str, memory_keys: list[str], session_manager: SessionManager):
    try:
        session = await session_manager.get_session(
            user_id, session_id
        )
        new_state = session.state.copy()
        
        for memory_key in memory_keys:
            if new_state.get(memory_key):
                new_state[memory_key] = ""
    
        action_with_update = EventActions(state_delta=new_state)
        system_event = Event(
            author="system",
            actions=action_with_update,
            invocation_id=f"delete_memory:{datetime.now().strftime('%Y%m%d%H%M%S')}",
        )
        await session_manager.append_event(
            session, system_event
        )
        return True
    except Exception as e:
        logger.error(f"Error in delete_memory_controller: {e}")
        raise AppException(f"Error in delete_memory_controller: {e}")
    
async def get_memory_controller(request: GetMemorySchema, session_manager: SessionManager):
    try:
        user_id, session_id = request.user_id, request.session_id
        if not user_id and not session_id:
            data = await get_firebase_data("user_creds", str(request.phone_number))
            user_id = data.get("user_id", None)
            session_id = data.get("session_id", None)
            
        if not user_id or not session_id:
            return {}
        
        session = await session_manager.get_session(user_id, session_id)
        return session.state
    except Exception as e:
        logger.error(f"Error in get_memory_controller: {e}")
        raise AppException(f"Error in get_memory_controller: {e}")