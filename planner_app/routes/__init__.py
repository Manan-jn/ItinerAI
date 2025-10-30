from fastapi import APIRouter

from .chat import router as chat_router
from .health import router as health_router
from .session import router as session_router
from .memory import router as memory_router
from .utils import router as utility_router

router = APIRouter()

router.include_router(chat_router)
router.include_router(health_router)
router.include_router(session_router)
router.include_router(utility_router)
router.include_router(memory_router)

__all__ = ["router"]