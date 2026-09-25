from datetime import datetime, timezone, timedelta
from app.core.database import get_database
from app.core.security import generate_otp_code, hash_sha256

class OTPService:
    @staticmethod
    async def create_otp(user_id, otp_type: str = "EMAIL_VERIFICATION", expiry_minutes: int = 10) -> str:
        db = get_database()
        raw_code = generate_otp_code(6)
        code_hash = hash_sha256(raw_code)

        # Delete older unused OTPs of same type
        await db.otps.delete_many({"userId": user_id, "type": otp_type})

        await db.otps.insert_one({
            "userId": user_id,
            "otpHash": code_hash,
            "type": otp_type,
            "isUsed": False,
            "expiresAt": datetime.now(timezone.utc) + timedelta(minutes=expiry_minutes),
            "createdAt": datetime.now(timezone.utc)
        })
        return raw_code

    @staticmethod
    async def verify_otp(user_id, raw_code: str, otp_type: str = "EMAIL_VERIFICATION") -> bool:
        db = get_database()
        code_hash = hash_sha256(raw_code.strip())

        record = await db.otps.find_one({
            "userId": user_id,
            "otpHash": code_hash,
            "type": otp_type,
            "isUsed": False,
            "expiresAt": {"$gt": datetime.now(timezone.utc)}
        })

        if not record:
            return False

        await db.otps.update_one({"_id": record["_id"]}, {"$set": {"isUsed": True}})
        return True
