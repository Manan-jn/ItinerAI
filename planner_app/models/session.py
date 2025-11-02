import os
import dotenv
from google.adk.events import Event
from google.adk.sessions import Session, VertexAiSessionService

from ..travel_agent.shared_libraries import State
from ..exceptions.base import AppException
from ..shared.log_config import logger

dotenv.load_dotenv()


class SessionManager:
    def __init__(self):
        self.APP_NAME = os.getenv("GOOGLE_CLOUD_RESOURCE_ENGINE").split("/")[-1]
        self.session_service = VertexAiSessionService(agent_engine_id=self.APP_NAME)

    async def get_session(self, user_id: str, session_id: str | None) -> Session:
        try:
            logger.info(f"Getting session for user id: {user_id} and session id: {session_id}")
            if existing := await self.session_service.get_session(
                app_name=self.APP_NAME,
                user_id=user_id,
                session_id=session_id,
            ):
                return existing

            else:
                logger.error(f"Session {session_id} not found for user id: {user_id}")
                raise AppException(
                    message=f"Session {session_id} not found for user id: {user_id}"
                )
        except Exception as e:
            logger.error("Error in get_session", exc_info=True)
            raise AppException(message=str(e))

    async def create_session(self, user_id: str) -> Session:
        try:
            logger.info(f"Creating session for user id: {user_id}")
            state = State(user_id=user_id).model_dump()
            session = await self.session_service.create_session(
                app_name=self.APP_NAME, user_id=user_id, state = state
            )
            return session
        except Exception as e:
            logger.error("Error in create_session", exc_info=True)
            raise AppException(message=str(e))

    async def delete_session(self, user_id: str, session_id: str):
        try:
            if await self.get_session(user_id, session_id):
                await self.session_service.delete_session(
                    app_name=self.APP_NAME,
                    user_id=user_id,
                    session_id=session_id
                )
            else:
                logger.error(f"Session {session_id} for user id {user_id} not found\nSkipping session deletion")
        except Exception as e:
            logger.error(f"Error in delete_session", exc_info=True)
    
    async def append_event(self, session: Session, event: Event) -> Event:
        try:
            logger.info(f"Appending event to session for user id: {session.user_id} and session id: {session.id}")
            return await self.session_service.append_event(session, event)
        except Exception as e:
            logger.error("Error in append_session", exc_info=True)
            raise AppException(message=str(e))
