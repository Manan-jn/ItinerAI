import os 
import sys
from typing import Any
from google.adk.agents.callback_context import CallbackContext
from google.adk.tools import ToolContext 

from ..shared_libraries import State

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from shared.post_processor import merge_dict_intelligently
from shared.logging import logger

async def _set_initial_state(callback_context: CallbackContext):
    items = State.model_fields.items()
    for key, value in items:
        if key not in callback_context.state:
            callback_context.state.update({key: value.default})
    
async def memorize(data: dict[str, Any], tool_context: ToolContext):
    """
    Memorize pieces of information into the state with intelligent merging.
    
    Args:
        data Dict[str, Any]: The data to memorize
        tool_context: The ADK tool context
        
        tool_context: The ADK tool context
    Returns:
        A status message
    """
    try:
        agent_name = tool_context.agent_name
        invocation_id = tool_context.invocation_id
        
        logger.info('-'*100)
        logger.info(f'Agent {agent_name} with invocation_id {invocation_id} invoked `memorize` tool')
        logger.info(f'Data: {data}')
        logger.info(f'State: {tool_context.state}')
        logger.info('-'*100)
        
        if not data or len(data) == 0:
            return {
                'status': 'warning', 
                'message': '`data` is empty or None, so no data to merge into state'
            }
        
        current_state = tool_context.state
        
        for key, value in data.items():
            if key in current_state:
                current_data = current_state[key]
                merged_data = await merge_dict_intelligently(current_data, value)
                current_state[key] = merged_data
            else:
                current_state[key] = value
        
        return {
            'status': 'success', 
            'message': 'Data merged successfully into state'
        }
    except Exception as e:
        logger.error("Error in `memorize` function", exc_info=True)
        return {
            'status': 'error',
            'message': str(e)
        }