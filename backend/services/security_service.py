from datetime import datetime, timezone, timedelta
from app.core.database import get_database

class SecurityService:
    @staticmethod
    async def create_alert(user_id, alert_type: str, severity: str, message: str, ip_address: str = "127.0.0.1"):
        db = get_database()
        await db.securityalerts.insert_one({
            "userId": user_id,
            "alertType": alert_type,
            "severity": severity,
            "message": message,
            "ipAddress": ip_address,
            "isResolved": False,
            "resolvedAt": None,
            "resolvedBy": None,
            "createdAt": datetime.now(timezone.utc)
        })

    @staticmethod
    async def handle_failed_login(email: str, ip_address: str, user_agent: str, failure_reason: str = "Invalid credentials"):
        db = get_database()
        user = await db.users.find_one({"email": email.lower()})

        if user:
            attempts = user.get("loginAttempts", 0) + 1
            upd = {"loginAttempts": attempts}
            if attempts >= 5:
                upd["lockUntil"] = datetime.now(timezone.utc) + timedelta(minutes=30)
                await SecurityService.create_alert(
                    user_id=user["_id"],
                    alert_type="ACCOUNT_LOCKED",
                    severity="MEDIUM",
                    message=f"Account locked after 5 failed login attempts from IP {ip_address}.",
                    ip_address=ip_address
                )
            await db.users.update_one({"_id": user["_id"]}, {"$set": upd})

        await db.loginhistories.insert_one({
            "userId": user["_id"] if user else None,
            "emailAttempted": email,
            "ipAddress": ip_address,
            "userAgent": user_agent,
            "status": "FAILED",
            "failureReason": failure_reason,
            "createdAt": datetime.now(timezone.utc)
        })
