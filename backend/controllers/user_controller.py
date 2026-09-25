from datetime import datetime, timezone
from bson import ObjectId
from fastapi import Request, Response, HTTPException
from app.core.database import get_database
from app.core.security import (
    hash_password, verify_password,
    generate_totp_secret, get_totp_uri, generate_qr_code_data_url,
    verify_totp_code, generate_backup_codes
)

class UserController:
    @staticmethod
    async def get_profile(current_user: dict):
        return {
            "success": True,
            "user": {
                "_id": str(current_user["_id"]),
                "email": current_user["email"],
                "firstName": current_user["firstName"],
                "lastName": current_user["lastName"],
                "role": current_user.get("role", "User"),
                "mfaEnabled": current_user.get("mfaEnabled", False),
                "isVerified": current_user.get("isVerified", True),
                "createdAt": current_user.get("createdAt")
            }
        }

    @staticmethod
    async def update_profile(data: dict, current_user: dict):
        db = get_database()
        upd = {}
        if "firstName" in data and data["firstName"]:
            upd["firstName"] = data["firstName"].strip()
        if "lastName" in data and data["lastName"]:
            upd["lastName"] = data["lastName"].strip()

        if upd:
            upd["updatedAt"] = datetime.now(timezone.utc)
            await db.users.update_one({"_id": current_user["_id"]}, {"$set": upd})
        return {"success": True, "message": "Profile updated successfully."}

    @staticmethod
    async def change_password(data: dict, current_user: dict):
        db = get_database()
        if not verify_password(data["currentPassword"], current_user["password"]):
            raise HTTPException(status_code=400, detail="Current password is incorrect.")

        new_hash = hash_password(data["newPassword"])
        await db.users.update_one(
            {"_id": current_user["_id"]},
            {"$set": {"password": new_hash, "updatedAt": datetime.now(timezone.utc)}}
        )
        return {"success": True, "message": "Password changed successfully."}

    @staticmethod
    async def setup_mfa(current_user: dict):
        db = get_database()
        secret = generate_totp_secret()
        uri = get_totp_uri(secret, current_user["email"])
        qr = generate_qr_code_data_url(uri)
        backup = generate_backup_codes(8)

        await db.users.update_one(
            {"_id": current_user["_id"]},
            {"$set": {
                "pendingMfaSecret": secret,
                "pendingBackupCodes": backup["hashed_codes"]
            }}
        )

        return {
            "success": True,
            "secret": secret,
            "qrCode": qr,
            "backupCodes": backup["raw_codes"]
        }

    @staticmethod
    async def confirm_mfa(code: str, current_user: dict):
        db = get_database()
        secret = current_user.get("pendingMfaSecret")
        if not secret or not verify_totp_code(secret, code.strip()):
            raise HTTPException(status_code=400, detail="Invalid verification code.")

        await db.users.update_one(
            {"_id": current_user["_id"]},
            {
                "$set": {
                    "mfaEnabled": True,
                    "mfaSecret": secret,
                    "mfaBackupCodes": current_user.get("pendingBackupCodes", []),
                    "updatedAt": datetime.now(timezone.utc)
                },
                "$unset": {"pendingMfaSecret": "", "pendingBackupCodes": ""}
            }
        )
        return {"success": True, "message": "Two-Factor Authentication enabled successfully."}

    @staticmethod
    async def get_sessions(current_user: dict):
        db = get_database()
        cursor = db.sessions.find({"userId": current_user["_id"], "isActive": True}).sort("createdAt", -1)
        sessions = [
            {
                "_id": str(s["_id"]),
                "ipAddress": s.get("ipAddress"),
                "userAgent": s.get("userAgent"),
                "deviceInfo": s.get("deviceInfo", {}),
                "createdAt": s.get("createdAt"),
                "lastActiveAt": s.get("lastActiveAt")
            }
            async for s in cursor
        ]
        return {"success": True, "sessions": sessions}
