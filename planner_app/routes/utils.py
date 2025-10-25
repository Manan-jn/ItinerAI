from fastapi import APIRouter
from starlette.responses import JSONResponse

from planner_app.schema.utils_schema import ConveyanceSchema, StaySchema
from planner_app.controllers.utils import get_conveyances_controller, get_stays_controller

router = APIRouter()


@router.post("/utility/conveyance")
async def get_conveyances(request: ConveyanceSchema):
    try:
        response = await get_conveyances_controller(request)
        return JSONResponse(status_code=200, content=response)
    except Exception as e:
        return JSONResponse(status_code=500, content=str(e))


@router.post("/utility/stay")
async def get_conveyances(request: StaySchema):
    try:
        response = await get_stays_controller(request)
        return JSONResponse(status_code=200, content=response)
    except Exception as e:
        return JSONResponse(status_code=500, content=str(e))
