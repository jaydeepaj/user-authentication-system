import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger("secureauth.database")

class MongoManager:
    client: AsyncIOMotorClient = None
    db = None

db_manager = MongoManager()

async def connect_db():
    try:
        conn_string = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/secureauth-x")
        db_manager.client = AsyncIOMotorClient(conn_string)
        db_name = conn_string.split("/")[-1].split("?")[0] or "secureauth-x"
        db_manager.db = db_manager.client[db_name]
        logger.info(f"MongoDB database connection established: {db_name}")

        # Ensure core indexes
        await db_manager.db.users.create_index("email", unique=True)
        await db_manager.db.sessions.create_index("userId")
        await db_manager.db.sessions.create_index("isActive")
        await db_manager.db.refreshtokens.create_index("tokenHash")
        await db_manager.db.otps.create_index("expiresAt", expireAfterSeconds=0)
        await db_manager.db.securityalerts.create_index([("userId", 1), ("severity", 1), ("isResolved", 1)])
        await db_manager.db.auditlogs.create_index([("userId", 1), ("action", 1)])
    except Exception as e:
        logger.error(f"MongoDB database connection error: {e}")

async def close_db():
    if db_manager.client:
        db_manager.client.close()
        logger.info("MongoDB database connection closed.")

def get_db():
    return db_manager.db
