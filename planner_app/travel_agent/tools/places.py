import os
import requests
import dotenv
from typing import Dict, List, Any
from google.adk.tools import ToolContext
from google.adk.agents.callback_context import CallbackContext

from shared.logging import logger

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
            return {"error": f"Error fetching place data: {e}"}

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

async def map_helper(data: Any):
    try:
        if not (isinstance(data, (dict, list))):
            return data
        
        if isinstance(data, list):
            # print("data is a list: ", data)
            for i in range(len(data)):
                data[i] = await map_helper(data[i])
        
        if isinstance(data, dict):
            # print("data is a dict: ", data)
            for key, value in data.items():
                data[key] = await map_helper(value)
            
            if data.get("place_name") or data.get("address"):
                # Check if map_url is empty or None and we have place info to search with
                if not data.get("map_url", None) or data.get("map_url") == "":
                    
                    search_query = ""
                    if data.get("place_name"):
                        search_query += data["place_name"]
                    if data.get("address"):
                        if search_query:
                            search_query += ", "
                        search_query += data["address"]
                    
                    if search_query:
                        response = await places_service.find_place_from_text(search_query)
                        

                        if "error" not in response:
                            data["map_url"] = response.get("map_url", "")
                            data["lat"] = response.get("lat", 0.0)
                            data["long"] = response.get("lng", 0.0)
                            data["photos"] = response.get("photos", [])
                            if "place_id" in response:
                                data["place_id"] = response["place_id"]
                        else:
                            print(f"Error finding place: {response['error']}")
            
        return data
    except Exception as e:
        logger.warning(f"Error in map_helper\nError:{str(e)}")
        return data

async def map_tool(callback_context: CallbackContext):
    try:
        state = callback_context.state.to_dict()
        state = await map_helper(state)
        callback_context.state.update(state)
    except Exception as e:
        logger.warning(f"Error in map_tool", exc_info=True)