import os
import asyncio
import requests
import dotenv
from typing import Dict, List, Any, Optional
from google.adk.tools import ToolContext
from google.adk.agents.callback_context import CallbackContext

from shared.log_config import logger

dotenv.load_dotenv('../../../.env')

class PlacesService:

    async def _check_key(self):
        if (
            not hasattr(self, "places_api_key") or not self.places_api_key
        ):  # Either it doesn't exist or is None.
            # https://developers.google.com/maps/documentation/places/web-service/get-api-key
            self.places_api_key = os.getenv("GOOGLE_PLACES_API_KEY")

    async def find_place_from_text(self, query: str) -> Dict[str, str]:
        """Fetches place details using a text query."""
        await self._check_key()
        places_url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
        params = {
            "input": query,
            "inputtype": "textquery",
            "fields": "place_id,formatted_address,name,photos,geometry",
            "key": self.places_api_key,
        }

        try:
            response = requests.get(places_url, params=params)
            response.raise_for_status()
            place_data = response.json()
            

            if not place_data.get("candidates"):
                return {"error": "No places found."}

            # Extract data for the first candidate
            place_details = place_data["candidates"][0]
            place_id = place_details["place_id"]
            place_name = place_details["name"]
            place_address = place_details["formatted_address"]
            photos = self.get_photo_urls(place_details.get("photos", []), maxwidth=400)
            map_url = self.get_map_url(place_id)
            location = place_details["geometry"]["location"]
            lat = str(location["lat"])
            lng = str(location["lng"])

            return {
                "place_id": place_id,
                "place_name": place_name,
                "place_address": place_address,
                "photos": photos,
                "map_url": map_url,
                "lat": lat,
                "lng": lng,
            }

        except requests.exceptions.RequestException as e:
            return {"error": f"Error fetching place data for query: {query}\nError: {e}"}

    def get_photo_urls(self, photos: List[Dict[str, Any]], maxwidth: int = 400) -> List[str]:
        """Extracts photo URLs from the 'photos' list."""
        photo_urls = []
        for photo in photos:
            photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth={maxwidth}&photoreference={photo['photo_reference']}&key={self.places_api_key}"
            photo_urls.append(photo_url)
        return photo_urls

    def get_map_url(self, place_id: str) -> str:
        """Generates the Google Maps URL for a given place ID."""
        return f"https://www.google.com/maps/place/?q=place_id:{place_id}"


places_service = PlacesService()

async def map_helper(data: Any, semaphore: Optional[asyncio.Semaphore] = None) -> Any:
    """
    Recursively walk `data` (dicts/lists), performing places_service lookup
    for nodes that have place_name/address and missing map_url. Concurrency:
    at most 5 concurrent external lookups (controlled by semaphore).
    """
    if semaphore is None:
        # Create top-level semaphore limit (5 concurrent lookups)
        semaphore = asyncio.Semaphore(10)

    try:
        # Base case: not a container
        if not isinstance(data, (dict, list)):
            return data

        # If list: concurrently process each element
        if isinstance(data, list):
            # Create tasks for each element
            tasks = [asyncio.create_task(map_helper(item, semaphore)) for item in data]
            results = await asyncio.gather(*tasks, return_exceptions=False)
            # mutate original list in-place to preserve references
            for i, r in enumerate(results):
                data[i] = r
            return data

        # If dict: concurrently process values first
        if isinstance(data, dict):
            # snapshot items to avoid runtime-dict-change issues
            items = list(data.items())
            # Prepare tasks for child values
            tasks = []
            keys = []
            for key, value in items:
                keys.append(key)
                tasks.append(asyncio.create_task(map_helper(value, semaphore)))

            # Await all child processing concurrently
            child_results = await asyncio.gather(*tasks, return_exceptions=False)
            for key, res in zip(keys, child_results):
                data[key] = res

            # After children processed, check whether we need to call places_service
            place_name = data.get("place_name")
            address = data.get("address")
            map_url = data.get("map_url", None)

            if (place_name or address) and (not map_url or map_url == ""):
                # Build search query
                search_query_parts = []
                if place_name:
                    search_query_parts.append(str(place_name))
                if address:
                    search_query_parts.append(str(address))
                search_query = ", ".join(search_query_parts).strip()

                if search_query:
                    logger.info(f"Fetching map URL for place: {search_query}")
                    try:
                        # Limit concurrent external calls with semaphore
                        async with semaphore:
                            # optionally wrap in asyncio.wait_for(...) to enforce a timeout
                            response = await places_service.find_place_from_text(search_query)

                        if response is None:
                            logger.warning(f"No response for: {search_query}")
                        elif "error" not in response:
                            data["map_url"] = response.get("map_url", "")
                            data["lat"] = response.get("lat", 0.0)
                            data["long"] = response.get("lng", 0.0)
                            data["photos"] = response.get("photos", [])
                            if "place_id" in response:
                                data["place_id"] = response["place_id"]
                        else:
                            # Keep the existing behavior for errors
                            logger.warning(f"Error finding place: {response['error']}")
                    except Exception as e:
                        logger.error(f"Error calling places_service for '{search_query}': {e}")

            return data

    except Exception as e:
        logger.error(f"Error in map_helper\nError:{str(e)}")
        return data

async def map_tool(callback_context: CallbackContext):
    try:
        state = callback_context.state.to_dict()
        state = await map_helper(state)
        callback_context.state.update(state)
    except Exception as e:
        logger.error(f"Error in map_tool", exc_info=True)