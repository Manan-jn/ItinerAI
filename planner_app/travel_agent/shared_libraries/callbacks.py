import os
import sys
import json
from google.adk.models import LlmRequest
from google.adk.agents.callback_context import CallbackContext
from google.genai import types
from typing import Optional, Any

from shared.logging import logger
from shared.post_processor import string_to_json

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))


async def _state_update_helper(data: Any) -> Any:
    try:
        if isinstance(data, str) and (_data := await string_to_json(data)):
            data = _data

        if not (isinstance(data, (dict, list))):
            return data

        if isinstance(data, list):
            for i in range(len(data)):
                data[i] = await _state_update_helper(data[i])

        if isinstance(data, dict):
            for key, value in data.items():
                data[key] = await _state_update_helper(value)

        return data
    except Exception as e:
        logger.warning(
            f"Error in _state_update_helper for input: {data}\nError: {str(e)}"
        )
        return data


async def logger_before_agent(callback_context: CallbackContext) -> None:
    try:
        agent_name = callback_context.agent_name
        invocation_id = callback_context.invocation_id
        logger.info(
            f"Agent {agent_name} with invocation id {invocation_id} is starting execution."
        )
    except Exception as e:
        logger.warning(f"Error in logger_before_agent\nError: {str(e)}")

async def modify_output_after_agent(
    callback_context: CallbackContext,
) -> Optional[types.Content]:
    try:
        agent_name = callback_context.agent_name
        invocation_id = callback_context.invocation_id

        logger.info(
            f"`modify_output_after_agent` callback invoked for agent {agent_name} with invocation id {invocation_id}"
        )

        current_state = callback_context.state.to_dict()

        agent_response_content = callback_context.session.events[-1].content
        if not agent_response_content:
            return None

        str_response = [
            part
            for part in agent_response_content.parts
            if part.text and not part.thought
        ]
        str_response = "\n".join([part.text for part in str_response])

        json_response = await string_to_json(str_response)
        if not json_response:
            return None

        if json_response["response_type"] == "trip":
            return types.Content(
                parts=[
                    types.Part(text=json.dumps(current_state.get("trip_suggestions")))
                ],
                role="model",
            )
        elif json_response["response_type"] == "itinerary":
            return types.Content(
                parts=[
                    types.Part(text=json.dumps(current_state.get("itinerary_agent")))
                ],
                role="model",
            )
        else:
            return None
    except Exception as e:
        logger.warning(f"Error in modify_output_after_agent\nError: {str(e)}")
        return None


async def modify_state_after_agent(callback_context: CallbackContext) -> None:
    """
    Modify the state of the callback context with the string responses to JSON responses if possible.
    """
    try:
        agent_name = callback_context.agent_name
        invocation_id = callback_context.invocation_id
        logger.info(
            f"`modify_state_after_agent` callback invoked for agent {agent_name} with invocation id {invocation_id}"
        )
        current_state = callback_context.state.to_dict()
        updated_state = await _state_update_helper(current_state)
        callback_context.state.update(updated_state)
    except Exception as e:
        logger.warning(f"Error in modify_state_after_agent\nError: {str(e)}")
