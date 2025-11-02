from fastapi import Request
from google.adk.sessions import Session


from ..models import SessionManager
from ..shared.log_config import logger
from ..exceptions.base import AppException


async def get_session_service(request: Request) -> Session:
    try:
        return request.app.state.session_manager.session_service
    except Exception as e:
        logger.error("Error in get_session_service", exc_info=True)
        raise AppException(message=str(e))

async def get_session_manager(request: Request) -> SessionManager:
    try:
        return request.app.state.session_manager
    except Exception as e:
        logger.error("Error in get_session_service", exc_info=True)
        raise AppException(message=str(e))
