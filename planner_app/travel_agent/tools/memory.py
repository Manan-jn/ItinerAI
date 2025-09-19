from google.adk.agents.callback_context import CallbackContext

from ..shared_libraries import State

def _set_initial_state(callback_context: CallbackContext):
    items = State.model_fields.items()
    for key, value in items:
        if key not in callback_context.state:
            callback_context.state.update({key: value.default})