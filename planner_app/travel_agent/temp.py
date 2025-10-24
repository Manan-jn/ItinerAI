import os
import json
import dotenv
from google.oauth2 import service_account
from google.cloud import bigquery

dotenv.load_dotenv()

key_contents_str = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
key_contents = json.loads(key_contents_str) 

credentials = service_account.Credentials.from_service_account_info(
    key_contents,
    scopes=["https://www.googleapis.com/auth/bigquery"]
)

client = bigquery.Client(
    project="itinerai-41751",
    credentials=credentials
)

# Perform a query.
QUERY = (
    "SELECT * FROM itinerai-41751.flightsdata.mytable where departure_airport.city='Ag1ra' LIMIT 2")
query_job = client.query(QUERY)  # API request
rows = query_job.result()  # Waits for query to finish
print([dict(row.items()) for row in rows])