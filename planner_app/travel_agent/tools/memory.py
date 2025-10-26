from typing import Any
from google.adk.agents.callback_context import CallbackContext
from google.adk.tools import ToolContext 

from ..shared_libraries import State

import os 
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from shared.post_processor import merge_dict_intelligently

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
        print("Error in memorize: ", str(e))
        return {
            'status': 'error',
            'message': str(e)
        }