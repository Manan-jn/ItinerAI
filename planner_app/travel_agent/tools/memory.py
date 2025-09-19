from typing import Any, Dict
from google.adk.agents.callback_context import CallbackContext
from google.adk.tools import ToolContext 

from ..shared_libraries import State, UserProfile, GroupDetails, Budget, RoughTravelDates

def _set_initial_state(callback_context: CallbackContext):
    items = State.model_fields.items()
    for key, value in items:
        if key not in callback_context.state:
            callback_context.state.update({key: value.default})

def _merge_dict_intelligently(existing: Dict[str, Any], new: Dict[str, Any]) -> Dict[str, Any]:
    """Intelligently merge two dictionaries, handling lists and nested objects"""
    if not existing:
        return new.copy()
    
    merged = existing.copy()
    
    for key, new_value in new.items():
        if new_value is None or new_value == "" or new_value == []:
            continue
            
        if key not in merged:
            merged[key] = new_value
        elif isinstance(new_value, list) and isinstance(merged[key], list):
            existing_list = merged[key]
            combined = existing_list + [item for item in new_value if item not in existing_list]
            merged[key] = combined
        elif isinstance(new_value, dict) and isinstance(merged[key], dict):
            merged[key] = _merge_dict_intelligently(merged[key], new_value)
        else:
            merged[key] = new_value
    
    return merged
    
def memorize(data: dict[str, Any], tool_context: ToolContext):
    """
    Memorize pieces of information into the state with intelligent merging.
    
    Args:
        data Dict[str, Any]: The data to memorize
        tool_context: The ADK tool context
        
        tool_context: The ADK tool context
    Returns:
        A status message
    """
    current_state = tool_context.state
    
    for key, value in data.items():
        # if key in current_state:
        #     current_data = current_state[key]
        #     merged_data = _merge_dict_intelligently(current_data, value)
        #     current_state[key] = merged_data
        # else:
        current_state[key] = value
    
    return {
        'status': 'success', 
        'message': 'Data merged successfully into state'
    }