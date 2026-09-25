import secrets
from datetime import datetime, timezone, timedelta
from app.core.config import settings
from app.core.security import hash_sha256, create_access_token, create_refresh_token
from app.core.database import get_database

class TokenService:
    @staticmethod
    def generate_access_token(user_id: str, role: str) -> str:
        return create_access_token(user_id, role)

    @staticmethod
    async def create_and_store_refresh_token(user_id, session_id) -> str:
        db = get_database()
        raw_token = create_refresh_token()
        token_hash = hash_sha256(raw_token)

        await db.refreshtokens.insert_one({
            "userId": user_id,
            "sessionId": session_id,
            "tokenHash": token_hash,
            "isUsed": False,
            "isRevoked": False,
            "expiresAt": datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_EXPIRY_DAYS),
            "createdAt": datetime.now(timezone.utc)
        })
        return raw_token

    @staticmethod
    async def rotate_refresh_token(raw_old_token: str, ip_address: str = "127.0.0.1"):
        db = get_database()
        old_hash = hash_sha256(raw_old_token)
        stored = await db.refreshtokens.find_one({"tokenHash": old_hash})

        if not stored or stored.get("isRevoked"):
            raise ValueError("Invalid or revoked refresh token.")

        user_id = stored["userId"]

        # Reuse Anomaly Check
        if stored.get("isUsed"):
            await db.sessions.update_many({"userId": user_id}, {"$set": {"isActive": False}})
            await db.refreshtokens.update_many({"userId": user_id}, {"$set": {"isRevoked": True}})
            await db.securityalerts.insert_one({
                "userId": user_id,
                "alertType": "REFRESH_TOKEN_REUSE",
                "severity": "CRITICAL",
                "message": f"Refresh token reuse anomaly from IP {ip_address}. All sessions revoked.",
                "ipAddress": ip_address,
                "isResolved": False,
                "createdAt": datetime.now(timezone.utc)
            })
            raise ValueError("Token reuse detected. Sessions revoked.")

        await db.refreshtokens.update_one({"_id": stored["_id"]}, {"$set": {"isUsed": True}})

        new_raw = create_refresh_token()
        await db.refreshtokens.insert_one({
            "userId": user_id,
            "sessionId": stored["sessionId"],
            "tokenHash": hash_sha256(new_raw),
            "isUsed": False,
            "isRevoked": False,
            "expiresAt": datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_EXPIRY_DAYS),
            "createdAt": datetime.now(timezone.utc)
        })
        return new_raw, user_id
