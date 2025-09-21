from fastapi import APIRouter, Depends
from starlette.responses import JSONResponse

from ..utils import get_session_service
from ..models import SessionManager

router = APIRouter()

@router.get("/health")
async def health(session_service: SessionManager = Depends(get_session_service)):
    return JSONResponse(
        content={"status": "healthy"},
        status_code=200
    )