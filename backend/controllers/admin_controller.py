from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException
from app.core.database import get_database

class AdminController:
    @staticmethod
    async def get_stats():
        db = get_database()
        total_users = await db.users.count_documents({})
        active_sessions = await db.sessions.count_documents({"isActive": True})
        unresolved_alerts = await db.securityalerts.count_documents({"isResolved": False})
        mfa_users = await db.users.count_documents({"mfaEnabled": True})
        locked_users = await db.users.count_documents({"lockUntil": {"$gt": datetime.now(timezone.utc)}})

        reg_cursor = db.users.aggregate([
            {"$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$createdAt"}},
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": -1}},
            {"$limit": 7}
        ])
        reg_trends = [doc async for doc in reg_cursor]

        login_cursor = db.loginhistories.aggregate([
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ])
        login_breakdown = {doc["_id"]: doc["count"] async for doc in login_cursor}

        return {
            "success": True,
            "stats": {
                "totalUsers": total_users,
                "activeSessions": active_sessions,
                "unresolvedAlerts": unresolved_alerts,
                "mfaUsers": mfa_users,
                "lockedUsers": locked_users,
                "registrationTrends": reg_trends,
                "loginBreakdown": login_breakdown,
                "systemStatus": "OPTIMAL"
            }
        }

    @staticmethod
    async def get_all_users():
        db = get_database()
        cursor = db.users.find({}).sort("createdAt", -1).limit(100)
        users = [
            {
                "_id": str(u["_id"]),
                "email": u["email"],
                "firstName": u["firstName"],
                "lastName": u["lastName"],
                "role": u.get("role", "User"),
                "isVerified": u.get("isVerified", False),
                "isBlocked": u.get("isBlocked", False),
                "mfaEnabled": u.get("mfaEnabled", False),
                "createdAt": u.get("createdAt")
            }
            async for u in cursor
        ]
        return {"success": True, "users": users}

    @staticmethod
    async def toggle_block_user(user_id: str, is_blocked: bool):
        db = get_database()
        try:
            oid = ObjectId(user_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid user ID.")

        await db.users.update_one({"_id": oid}, {"$set": {"isBlocked": is_blocked, "updatedAt": datetime.now(timezone.utc)}})
        if is_blocked:
            await db.sessions.update_many({"userId": oid}, {"$set": {"isActive": False}})
            await db.refreshtokens.update_many({"userId": oid}, {"$set": {"isRevoked": True}})
        return {"success": True, "message": f"User successfully {'blocked' if is_blocked else 'unblocked'}."}
