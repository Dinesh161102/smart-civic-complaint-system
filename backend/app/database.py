import logging
from pymongo import MongoClient
import mongomock
from app.config import settings

logger = logging.get_logger("civic_backend.database") if hasattr(logging, "get_logger") else logging.getLogger("civic_backend.database")
logging.basicConfig(level=logging.INFO)

class DatabaseManager:
    def __init__(self):
        self.client = None
        self.db = None
        self.is_mock = False

    def connect(self):
        try:
            # Attempt connection to real MongoDB instance with a short timeout
            client = MongoClient(settings.MONGODB_URL, serverSelectionTimeoutMS=2000)
            client.admin.command('ping')
            self.client = client
            self.db = self.client[settings.DATABASE_NAME]
            self.is_mock = False
            print("\n" + "=" * 65, flush=True)
            print(f" [MONGODB STATUS]  CONNECTED SUCCESSFULLY TO MONGODB", flush=True)
            print(f" [MONGODB URL]     {settings.MONGODB_URL}", flush=True)
            print(f" [DATABASE NAME]   {settings.DATABASE_NAME}", flush=True)
            print("=" * 65 + "\n", flush=True)
        except Exception as e:
            self.client = mongomock.MongoClient()
            self.db = self.client[settings.DATABASE_NAME]
            self.is_mock = True
            print("\n" + "=" * 65, flush=True)
            print(f" [MONGODB WARNING] Could not connect to real MongoDB ({str(e)})", flush=True)
            print(f" [MONGODB FALLBACK] Using Mongomock in-memory database", flush=True)
            print("=" * 65 + "\n", flush=True)

    def get_collection(self, collection_name: str):
        if self.db is None:
            self.connect()
        return self.db[collection_name]

db_manager = DatabaseManager()

def get_db():
    if db_manager.db is None:
        db_manager.connect()
    return db_manager.db
