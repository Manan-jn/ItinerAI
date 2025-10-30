from google.adk.events import Event, EventActions

from ..models.session import SessionManager
from ..shared.post_processor import merge_dict_intelligently
from ..shared.logging import logger
from ..exceptions.base import AppException

async def add_memory_controller(user_id: str, session_id: str, updates: dict, invocation_id: str, session_manager: SessionManager):
    try:
        session = await session_manager.get_session(
            user_id, session_id
        )
        new_state = await merge_dict_intelligently(session.state, updates)
        action_with_update = EventActions(state_delta=new_state)
        system_event = Event(
            author="system",
            actions=action_with_update,
            invocation_id=invocation_id,
        )
        await session_manager.append_event(
            session, system_event
        )
        return True
    except Exception as e:
        logger.error(f"Error in add_memory_controller: {e}")
        raise AppException(f"Error in add_memory_controller: {e}")
    
async def delete_memory_controller(user_id: str, session_id: str, memory_keys: list[str], invocation_id: str, session_manager: SessionManager):
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
            invocation_id=invocation_id,
        )
        await session_manager.append_event(
            session, system_event
        )
        return True
    except Exception as e:
        logger.error(f"Error in delete_memory_controller: {e}")
        raise AppException(f"Error in delete_memory_controller: {e}")