from dotenv import load_dotenv
from fastapi import FastAPI 

from planner_app.routes import router
from planner_app.models import SessionManager

load_dotenv()

app = FastAPI(
    title="Multi-Tool Agent",
    description="A multi-tool agent that can answer questions about the time and weather in a city.",
    version="1.0.0",
)

@app.on_event("startup")
async def startup_event():
    app.state.session_service = SessionManager()
    
app.include_router(router)
