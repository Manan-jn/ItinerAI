from fastapi import Request
from ..models import SessionManager

async def get_session_service(request: Request) -> SessionManager:
    return request.app.state.session_service