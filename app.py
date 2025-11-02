import json
from dotenv import load_dotenv
from fastapi import FastAPI, Request

from planner_app.routes import router
from planner_app.models import SessionManager
from planner_app.shared.log_config import logger 

load_dotenv()

app = FastAPI(
    title="Multi-Tool Agent",
    description="A multi-tool agent that can answer questions about the time and weather in a city.",
    version="1.0.0",
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    if not request.url.path.endswith("/health"):
        payload = json.loads((await request.body()).decode('utf-8'))
        logger.info(f"{request.method}: {request.url}")
        logger.info(f"User ID: {payload.get('user_id', None)} Session ID: {payload.get('session_id', None)}")
        logger.info(f"Payload: {payload}")
    response = await call_next(request)
    return response

@app.on_event("startup")
async def startup_event():
    app.state.session_manager = SessionManager()
    
app.include_router(router)
