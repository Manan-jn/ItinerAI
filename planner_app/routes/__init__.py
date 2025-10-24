from fastapi import APIRouter

from .chat import router as chat_router
from .health import router as health_router
from .session_memory import router as session_router

router = APIRouter()

router.include_router(chat_router)
router.include_router(health_router)
router.include_router(session_router)

__all__ = ["router"]