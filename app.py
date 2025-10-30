from dotenv import load_dotenv
from fastapi import FastAPI, Request

from planner_app.routes import router
from planner_app.models import SessionManager
from planner_app.shared.logging import logger 

load_dotenv()

app = FastAPI(
    title="Multi-Tool Agent",
    description="A multi-tool agent that can answer questions about the time and weather in a city.",
    version="1.0.0",
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    if not request.url.path.endswith("/health"):
        logger.info(f"Incoming request: {request.method} {request.url} {await request.body()}")
    response = await call_next(request)
    return response

@app.on_event("startup")
async def startup_event():
    app.state.session_manager = SessionManager()
    
app.include_router(router)
