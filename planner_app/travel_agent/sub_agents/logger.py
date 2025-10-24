from google.adk.agents.callback_context import CallbackContext

def logging_callback(callback_context: CallbackContext):
    session = callback_context._invocation_context.session
    for event in reversed(session.events):
        print(event)
        # print(session.event.content)
        break