from google.adk.agents.callback_context import CallbackContext
# from google.genai import types 
from typing import Optional, Any

# from ..shared_libraries.utils import string_to_json
from ...common.utils import string_to_json


def state_update_helper(data: Any) -> Any:
    try:
        if isinstance(data, str) and (temp:=string_to_json(data)):
            data = temp
            
        if not (isinstance(data, (dict, list))):
            return data
        
        if isinstance(data, list):
            for i in range(len(data)):
                data[i] = state_update_helper(data[i])
                
        if isinstance(data, dict):
            for key, value in data.items():
                data[key] = state_update_helper(value)
                
        return data
    except Exception as e:
        print("Error in state_update_helper: ", str(e))
        return data
            
def modify_state_callback(callback_context: CallbackContext) -> None:
    """
    Modfiy the state of the callback context with the string responses to JSON responses if possible.
    """
    
    agent_name = callback_context.agent_name
    invocation_id = callback_context.invocation_id
    current_state = callback_context.state.to_dict()
    updated_state = state_update_helper(current_state)
    callback_context.state.update(updated_state)
    
    # if agent_response_json:
    #     return types.Content(parts=[types.Part(text=json.dumps(agent_response_json))])
    # message = callback_context.message.content.parts[0].text
    
    # print(f"\n[Callback] Exiting agent: {agent_name} (Inv: {invocation_id})")
    # print(f"[Callback] Current State: {current_state}")