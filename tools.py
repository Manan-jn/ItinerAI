import os 
import json
import asyncio
import requests
from dotenv import load_dotenv
from livekit.agents import (
    function_tool,
    RunContext,
    ChatContext,
    JobContext
)

from log_config import logger

load_dotenv(".env")

BACKEND_DB_URL = os.getenv("BACKEND_DB_URL")
GOOGLE_SEARCH_URL = os.getenv("GOOGLE_SEARCH_URL")
GOOGLE_MAPS_URL = os.getenv("GOOGLE_MAPS_URL")

phone_number = None

async def get_phone_number(ctx: JobContext) -> str:
    global phone_number
    participant = await ctx.wait_for_participant()
    print("Participant joined: ", participant.identity)
    phone_number = participant.identity.split("_")[-1]

async def call_backend_service(url: str, payload: dict) -> dict:
    try:
        response = requests.post(url, json=payload)
        if response.status_code != 200:
            return {
                "error": "Service is unreachable at the moment. Please try again later."
            }
        return response.json()
    except Exception as e:
        logger.error(f"Error in call_backend_service: {e}")
        return {
            "error": str(e)
        }
    

@function_tool
async def get_user_profile(context: RunContext, pre_tool_speech: str) -> dict:
    """ 
    Tool to get User Data & its related Travel Profile
    Args:
        pre_tool_speech: The speech to be spoken before calling the tool, as this tool will take around 5-8 seconds to fetch the user profile.
    Returns:
        dict: The user profile
    """
    try:
        print(f"get_user_profile called with phone number: {phone_number}")
        await context.wait_for_playout()
        context.disallow_interruptions()
        
        tool_response = {}
        response = await call_backend_service(BACKEND_DB_URL, {"phone_number": phone_number})
        tool_response['user_profile'] = response.get("user_profile", {})
        tool_response['itinerary'] = response.get("final_itinerary", {})
        logger.info(f"User profile fetched successfully: {tool_response}")
        return tool_response
    except Exception as e:
        logger.error(f"Error in get_user_data: {e}")
        return f"Error in get_user_data: {e}"
    
@function_tool
async def google_search(context: RunContext, search_query: str, pre_tool_speech: str) -> dict:
    """ To get the search results from the internet for the given query """
    try:
        print(f"google_search called for the query: {search_query}")
        await context.wait_for_playout()
        context.disallow_interruptions()
        
        logger.info(f"Searching the internet for the query: {search_query}")
        response = requests.post(
            GOOGLE_SEARCH_URL,
            json={
                "query": search_query,
                "phone_number": phone_number
            }
        )
        
        if response.status_code != 200:
            return {
                "error": "Service is unreachable at the moment. Please try again later."
            }
            
        logger.info(f"Search results: {response.json()}")
        tool_response = response.json().get("message", "")
        logger.info(f"Search results fetched successfully: {tool_response}")
        return tool_response
    except Exception as e:
        logger.error(f"Error in google_search: {e}")
        return {
            "error": str(e)
        }
        
@function_tool
async def google_maps(context: RunContext, search_query: str, pre_tool_speech: str) -> dict:
    """ To get the maps results for the given location """
    try:
        print(f"google_maps called for the query: {search_query}")
        await context.wait_for_playout()
        context.disallow_interruptions()
        
        logger.info(f"Searching the maps for the location: {search_query}")
        response = requests.post(
            GOOGLE_MAPS_URL,
            json={
                "query": search_query,
                "phone_number": phone_number
            }
        )
        
        if response.status_code != 200:
            return {
                "error": "Service is unreachable at the moment. Please try again later."
            }
            
        logger.info(f"Maps results: {response.json()}")
        tool_response = response.json().get("message", "")
        logger.info(f"Maps results fetched successfully: {tool_response}")
        return tool_response
    except Exception as e:
        logger.error(f"Error in google_maps: {e}")
        return {
            "error": str(e)
        }