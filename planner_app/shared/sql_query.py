import os
import asyncio
import random
from datetime import datetime, timedelta, time
import json
import dotenv
from google.cloud import bigquery
from google.oauth2 import service_account

from .log_config import logger

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
dotenv.load_dotenv(os.path.join(BASE_DIR, ".env"))

key_contents_str = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
if key_contents_str:
    key_contents = json.loads(key_contents_str)
else:
    auth_file_path = os.path.join(os.path.dirname(__file__), "../../auth.json")
    with open(auth_file_path, "r") as f:
        key_contents = json.load(f)

credentials = service_account.Credentials.from_service_account_info(
    key_contents, scopes=["https://www.googleapis.com/auth/bigquery"]
)

client = bigquery.Client(project="itinerai-41751", credentials=credentials)


async def _execute_sql_query(sql_query: str):
    try:
        query_job = client.query(sql_query)
        rows = query_job.result()
        result = [dict(row.items()) for row in rows]
        return result
    except Exception as e:
        logger.error(
            f"Error in execute_sql_query for input: {sql_query}\nError: {str(e)}"
        )
        return []


async def _generate_flight_data(
    seed: str, departure_date: str, departure_airport: dict, arrival_airport: dict
) -> dict:
    rng = random.Random(seed)

    airlines = [
        "Air India",
        "IndiGo",
        "SpiceJet",
        "Vistara",
        "Go First",
        "AirAsia India",
        "Akasa Air",
    ]

    airline = rng.choice(airlines)
    flight_number = f"{airline.split()[0][:2].upper()}{rng.randint(100, 999)}"
    flight_id = flight_number

    dep_date = datetime.strptime(departure_date, "%Y-%m-%d")

    dep_hour = rng.randint(0, 23)
    dep_minute = rng.randint(0, 59)
    dep_time = time(hour=dep_hour, minute=dep_minute)

    # flight duration between 1–5 hours
    duration_minutes = rng.randint(60, 300)
    arr_datetime = datetime.combine(dep_date, dep_time) + timedelta(
        minutes=duration_minutes
    )

    arr_date = arr_datetime.date()
    arr_time = arr_datetime.time().replace(second=0, microsecond=0)

    hours, minutes = divmod(duration_minutes, 60)
    duration_str = f"{hours}h {minutes}m"

    base_price = rng.randint(3000, 25000)
    prices = {
        "economy": base_price,
        "business": int(base_price * 1.8),
        "first": int(base_price * 3.0),
    }

    flight_data = {
        "flight_id": flight_id,
        "airline": airline,
        "flight_number": flight_number,
        "departure_airport": departure_airport,
        "arrival_airport": arrival_airport,
        "departure_date": dep_date.strftime("%Y-%m-%d"),
        "departure_time": dep_time.strftime("%H:%M"),
        "arrival_date": arr_date.strftime("%Y-%m-%d"),
        "arrival_time": arr_time.strftime("%H:%M"),
        "duration": duration_str,
        "price": prices,
        "currency": "INR",
    }

    return flight_data


async def _generate_train_data(
    seed: str, departure_date: str, departure_station: dict, arrival_station: dict
) -> dict:
    try:
        rng = random.Random(seed)

        operators = [
            "Indian Railways",
            "Konkan Railways",
            "Northeast Frontier Railway",
            "South Central Railway",
            "Western Railway",
            "Southern Railway",
            "Northern Railway",
        ]
        train_names = [
            "Rajdhani Express",
            "Shatabdi Express",
            "Duronto Express",
            "Jan Shatabdi Express",
            "Garib Rath",
            "Vande Bharat Express",
            "Superfast Express",
            "Mail Express",
        ]

        operator = rng.choice(operators)
        train_name = rng.choice(train_names)
        train_number = rng.randint(10000, 99999)
        train_id = f"{train_number}-{train_name.replace(' ', '').lower()}"

        dep_date = datetime.strptime(departure_date, "%Y-%m-%d")
        dep_hour = rng.randint(0, 23)
        dep_minute = rng.randint(0, 59)
        dep_time = time(hour=dep_hour, minute=dep_minute)
        duration_minutes = rng.randint(120, 1440)
        arr_datetime = datetime.combine(dep_date, dep_time) + timedelta(
            minutes=duration_minutes
        )

        arr_date = arr_datetime.date()
        arr_time = arr_datetime.time().replace(second=0, microsecond=0)

        hours, minutes = divmod(duration_minutes, 60)
        duration_str = f"{hours}h {minutes}m"

        base_price = rng.randint(200, 2500)
        prices = {
            "sleeper": base_price,
            "3AC": int(base_price * 1.5),
            "2AC": int(base_price * 2.2),
            "1AC": int(base_price * 3.5),
        }

        train_data = {
            "train_id": train_id,
            "operator": operator,
            "train_number": str(train_number),
            "train_name": train_name,
            "departure_station": departure_station,
            "arrival_station": arrival_station,
            "departure_date": dep_date.strftime("%Y-%m-%d"),
            "departure_time": dep_time.strftime("%H:%M"),
            "arrival_date": arr_date.strftime("%Y-%m-%d"),
            "arrival_time": arr_time.strftime("%H:%M"),
            "duration": duration_str,
            "price": prices,
            "currency": "INR",
        }

        return train_data
    except Exception as e:
        logger.error(f"Error in _generate_train_data", exc_info=True)
        return {}


async def _generate_stay_data(
    seed: str, check_in_date: str, duration: int, city: str, state: str, country: str
) -> dict:
    try:
        rng = random.Random(seed)
        hotel_chains = [
            "Marriott Hotels",
            "Hilton",
            "Hyatt",
            "Radisso Blu",
            "Sheraton",
            "Novotel",
        ]

        hotel_chain = rng.choice(hotel_chains)
        property_name = f"{hotel_chain}, {city}"

        street_numbers = rng.randint(1, 500)
        street_names = [
            "MG Road",
            "Connaught Place",
            "Park Street",
            "Ring Road",
            "Main Street",
            "Civic Center",
            "Brigade Road",
        ]
        property_address = f"{street_numbers}, {rng.choice(street_names)}, {city}"

        property_location = {
            "latitude": round(rng.uniform(-90.0, 90.0), 6),
            "longitude": round(rng.uniform(-180.0, 180.0), 6),
        }

        overall_rating = round(rng.uniform(3.0, 5.0), 1)

        starting_price = rng.randint(1500, 15000)

        available_rooms_total = rng.randint(10, 150)

        available_from_date = datetime.strptime(check_in_date, "%Y-%m-%d")
        stay_duration = rng.randint(max(1, duration), duration + 10)
        available_until_date = available_from_date + timedelta(days=stay_duration)

        stay_id = f"{property_name.replace(' ', '').lower()}-{rng.randint(1000, 9999)}"

        stay_data = {
            "stay_id": stay_id,
            "property_name": property_name,
            "city": city,
            "state": state,
            "country": country,
            "overall_rating": overall_rating,
            "starting_price": starting_price,
            "currency": "INR",
            "available_rooms_total": available_rooms_total,
            "available_from_date": available_from_date.strftime("%Y-%m-%d"),
            "available_until_date": available_until_date.strftime("%Y-%m-%d"),
        }

        return stay_data
    except Exception as e:
        logger.error(f"Error in _generate_stay_data", exc_info=True)
        return {}


async def fetch_flight_data(
    user_id: str,
    departure_start_date: str,
    departure_end_date: str,
    departure_city: str,
    departure_country: str,
    arrival_city: str,
    arrival_country: str,
) -> dict:
    try:
        start_date = datetime.strptime(departure_start_date, "%Y-%m-%d")
        end_date = datetime.strptime(departure_end_date, "%Y-%m-%d")
        num_days = (end_date - start_date).days + 1

        # Parameterized queries
        departure_query = f"""
            SELECT * 
            FROM `itinerai-41751.world_airports.mytable` 
            WHERE LOWER(city) = LOWER("{departure_city}")
            AND LOWER(country) = LOWER("{departure_country}")
            LIMIT 1
        """
        arrival_query = f"""
            SELECT * 
            FROM `itinerai-41751.world_airports.mytable` 
            WHERE LOWER(city) = LOWER("{arrival_city}")
            AND LOWER(country) = LOWER("{arrival_country}")
            LIMIT 1
        """

        # Fetch departure and arrival airports concurrently
        departure_task = _execute_sql_query(departure_query)
        arrival_task = _execute_sql_query(arrival_query)
        departure_result, arrival_result = await asyncio.gather(
            departure_task, arrival_task
        )
        departure_airport = departure_result[0] if departure_result else None
        arrival_airport = arrival_result[0] if arrival_result else None

        if departure_airport is None or arrival_airport is None:
            return {
                "status": "failure",
                "response": f"No airports found for the {departure_city} to {arrival_city} route. Try using alternate versions of the city names",
            }

        all_flight_tasks = []
        for day_idx in range(num_days):
            current_date = (start_date + timedelta(days=day_idx)).date()
            rng = random.Random(f"{user_id}_{day_idx}")
            num_flights_today = rng.randint(1, 10)
            for idx in range(num_flights_today):
                seed = f"{user_id}_{day_idx}_{idx}"
                all_flight_tasks.append(
                    _generate_flight_data(
                        seed, str(current_date), departure_airport, arrival_airport
                    )
                )

        flights_data = await asyncio.gather(*all_flight_tasks)
        return {"status": "success", "response": flights_data}
    except Exception as e:
        logger.error(f"Error in fetch_flight_data", exc_info=True)
        return {"status": "error", "error": str(e)}


async def fetch_train_data(
    user_id: str,
    departure_start_date: str,
    departure_end_date: str,
    departure_city: str,
    departure_country: str,
    arrival_city: str,
    arrival_country: str,
) -> dict:
    try:
        start_date = datetime.strptime(departure_start_date, "%Y-%m-%d")
        end_date = datetime.strptime(departure_end_date, "%Y-%m-%d")
        num_days = (end_date - start_date).days + 1

        departure_station = {
            "code": "DRS",
            "city": departure_city,
            "country": departure_country,
            "name": f"{departure_city} Railway Station",
        }

        arrival_station = {
            "code": "ARS",
            "city": arrival_city,
            "country": arrival_country,
            "name": f"{arrival_city} Railway Station",
        }

        all_train_tasks = []
        for day_idx in range(num_days):
            current_date = (start_date + timedelta(days=day_idx)).date()
            rng = random.Random(f"{user_id}_{day_idx}")
            num_trains_today = rng.randint(1, 10)
            for idx in range(num_trains_today):
                seed = f"{user_id}_{day_idx}_{idx}"
                all_train_tasks.append(
                    _generate_train_data(
                        seed, str(current_date), departure_station, arrival_station
                    )
                )

        trains_data = await asyncio.gather(*all_train_tasks)
        return {"status": "success", "response": trains_data}
    except Exception as e:
        logger.error(f"Error in fetch_train_data", exc_info=True)
        return {"status": "error", "error": str(e)}


async def fetch_stay_data(
    user_id: str,
    start_check_in_date: str,
    end_check_in_date: str,
    duration: int,
    city: str,
    state: str,
    country: str,
) -> dict:
    try:
        start_date = datetime.strptime(start_check_in_date, "%Y-%m-%d")
        end_date = datetime.strptime(end_check_in_date, "%Y-%m-%d")
        num_days = (end_date - start_date).days + 1

        all_stay_tasks = []
        for day_idx in range(num_days):
            current_date = (start_date + timedelta(days=day_idx)).date()
            rng = random.Random(f"{user_id}_{day_idx}")
            num_stays_today = rng.randint(7, 10)
            for idx in range(num_stays_today):
                seed = f"{user_id}_{day_idx}_{idx}"
                all_stay_tasks.append(
                    _generate_stay_data(
                        seed, str(current_date), duration, city, state, country
                    )
                )

        stays_data = await asyncio.gather(*all_stay_tasks)
        return {"status": "success", "response": stays_data}
    except Exception as e:
        logger.error("Error in fetch_stay_data", exc_info=True)
        return {"status": "error", "error": str(e)}
