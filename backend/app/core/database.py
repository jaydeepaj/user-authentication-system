from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()

async def connect_to_mongo():
    db_instance.client = AsyncIOMotorClient(settings.MONGODB_URI)
    db_name = settings.MONGODB_URI.split("/")[-1].split("?")[0] or "secureauth-x"
    db_instance.db = db_instance.client[db_name]
    print(f"Connected to MongoDB via Motor: {db_name}")

    # Ensure indexes exist - silently skip if already present
    # Uses default MongoDB auto-names (email_1, userId_1, etc.) to match existing indexes
    async def safe_index(collection, keys, **kwargs):
        try:
            await collection.create_index(keys, **kwargs)
        except Exception:
            pass  # Index already exists - no action needed

    await safe_index(db_instance.db.users,          [("email", 1)],                                         unique=True)
    await safe_index(db_instance.db.sessions,       [("userId", 1)])
    await safe_index(db_instance.db.sessions,       [("isActive", 1)])
    await safe_index(db_instance.db.refreshtokens,  [("tokenHash", 1)],                                     unique=True)
    await safe_index(db_instance.db.otps,           [("expiresAt", 1)],                                     expireAfterSeconds=0)
    await safe_index(db_instance.db.securityalerts, [("userId", 1), ("severity", 1), ("isResolved", 1)])
    await safe_index(db_instance.db.auditlogs,      [("userId", 1), ("action", 1)])

    print("MongoDB indexes verified.")

async def close_mongo_connection():
    if db_instance.client:
        db_instance.client.close()
        print("MongoDB connection closed.")

def get_database():
    return db_instance.db
