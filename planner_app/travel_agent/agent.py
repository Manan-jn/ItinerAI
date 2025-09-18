import datetime
from zoneinfo import ZoneInfo
from google.adk.agents import Agent, LlmAgent
from ..schema import UserProfile

def get_weather(city: str) -> dict:
    """Retrieves the current weather report for a specified city.

    Args:
        city (str): The name of the city for which to retrieve the weather report.

    Returns:
        dict: status and result or error msg.
    """
    if city.lower() == "new york":
        return {
            "status": "success",
            "report": (
                "The weather in New York is sunny with a temperature of 25 degrees"
                " Celsius (77 degrees Fahrenheit)."
            ),
        }
    else:
        return {
            "status": "error",
            "error_message": f"Weather information for '{city}' is not available.",
        }


def get_current_time(city: str) -> dict:
    """Returns the current time in a specified city.

    Args:
        city (str): The name of the city for which to retrieve the current time.

    Returns:
        dict: status and result or error msg.
    """

    if city.lower() == "new york":
        tz_identifier = "America/New_York"
    else:
        return {
            "status": "error",
            "error_message": (
                f"Sorry, I don't have timezone information for {city}."
            ),
        }

    tz = ZoneInfo(tz_identifier)
    now = datetime.datetime.now(tz)
    report = (
        f'The current time in {city} is {now.strftime("%Y-%m-%d %H:%M:%S %Z%z")}'
    )
    return {"status": "success", "report": report}

from google.genai import types
json_response_config = types.GenerateContentConfig(
    response_mime_type="application/json"
)

root_agent = LlmAgent(
    name="weather_time_agent",
    model="gemini-2.0-flash",
    description=(
        "Agent to answer questions about the time and weather in a city."
    ),
    # instruction=(
    #     f"""
    #     You are a helpful agent that collects the user's profile one field at a time.
    #     Ask concise follow-up questions until you can produce a complete JSON object
    #     that matches the following schema exactly. Output ONLY the JSON object
    #     without any extra keys or text (no markdown, no explanations):

    #     # {UserProfile.model_json_schema()}
    #     """
    # ),
    instruction="You are a helpful agent",
    tools=[get_weather, get_current_time],
    # output_schema=UserProfile,
    # generate_content_config=json_response_config,
    # output_key="user_profile"
)