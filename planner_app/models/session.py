from google.adk.events import Event
from google.adk.sessions import Session, InMemorySessionService

from ..travel_agent.shared_libraries import State

class SessionManager:
    def __init__(self):
        self.session_service = InMemorySessionService()
        self.app_name = "planner_ai"

    async def get_session(self, session_id: str, user_id: str) -> Session:
        if existing := await self.session_service.get_session(
            app_name=self.app_name,
            user_id=user_id,
            session_id=session_id,
        ):
            return existing

        state = State(
            user_id=user_id,
        )
        
        return await self.session_service.create_session(
            app_name=self.app_name,
            session_id=session_id,
            user_id=user_id,
            state=state.model_dump(),
        )
        
    async def append_event(self, session_id: str, user_id: str, event: Event) -> Event:
        session = await self.get_session(session_id, user_id)
        return await self.session_service.append_event(session, event)