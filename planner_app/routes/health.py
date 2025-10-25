from fastapi import APIRouter, Depends, HTTPException
from starlette.responses import JSONResponse

from ..common import get_session_service
from ..models import SessionManager

router = APIRouter()

@router.get("/health")
async def health(session_service: SessionManager = Depends(get_session_service)):
    try:
        return JSONResponse(
            content={"status": "healthy"},
            status_code=200
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error"
            }
        )