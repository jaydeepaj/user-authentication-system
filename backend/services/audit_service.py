from datetime import datetime, timezone
from app.core.database import get_database

class AuditService:
    @staticmethod
    async def log(action: str, user_id=None, user_email: str = "", details: str = "", ip_address: str = "127.0.0.1", user_agent: str = ""):
        db = get_database()
        await db.auditlogs.insert_one({
            "userId": user_id,
            "userEmail": user_email,
            "action": action,
            "details": details,
            "ipAddress": ip_address,
            "userAgent": user_agent,
            "createdAt": datetime.now(timezone.utc)
        })

    @staticmethod
    async def get_recent_logs(limit: int = 50, user_id=None):
        db = get_database()
        query = {"userId": user_id} if user_id else {}
        cursor = db.auditlogs.find(query).sort("createdAt", -1).limit(limit)
        return [doc async for doc in cursor]
