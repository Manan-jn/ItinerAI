import os 
import json 
import dotenv
from google.cloud import bigquery
from google.oauth2 import service_account

dotenv.load_dotenv()

# Try to get credentials from environment variable first, then fall back to auth.json file
key_contents_str = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
if key_contents_str:
    key_contents = json.loads(key_contents_str)
else:
    # Fall back to reading from auth.json file
    auth_file_path = os.path.join(os.path.dirname(__file__), "../../auth.json")
    with open(auth_file_path, 'r') as f:
        key_contents = json.load(f) 

credentials = service_account.Credentials.from_service_account_info(
    key_contents,
    scopes=["https://www.googleapis.com/auth/bigquery"]
)

# key_contents_str = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
# key_contents = json.loads(key_contents_str)

# credentials = service_account.Credentials.from_service_account_info(
#     key_contents, scopes=["https://www.googleapis.com/auth/bigquery"]
# )

client = bigquery.Client(project="itinerai-41751", credentials=credentials)

async def execute_sql_query(sql_query:str):
    try:
        query_job = client.query(sql_query)  
        rows = query_job.result()  
        result = [dict(row.items()) for row in rows]
        return result
    except Exception as e:
        print('Error in execute_sql_query: ', str(e))
        return []
        