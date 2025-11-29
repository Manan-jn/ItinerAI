import firebase_admin
from firebase_admin import credentials, firestore

from ..shared.log_config import logger
from ..exceptions.base import AppException

cred = credentials.Certificate("firebase_creds.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

async def put_firebase_data(collection: str, document_id: str, data: dict):
    try:
        db.collection(collection).document(document_id).set(data)
        return True
    except Exception as e:
        logger.error(f"Error in put_firebase_data: {e}")
        raise AppException(f"Error in put_firebase_data: {e}")
    
async def get_firebase_data(collection: str, document_id: str) -> dict:
    try:
        doc = db.collection(collection).document(document_id).get()
        if doc.exists:
            return doc.to_dict()
        else:
            logger.warning(f"Document {document_id} not found in collection {collection}")
            return {}
    except Exception as e:
        logger.error(f"Error in get_firebase_data: {e}")
        raise AppException(f"Error in get_firebase_data: {e}")