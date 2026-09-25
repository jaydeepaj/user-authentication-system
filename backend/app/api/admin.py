from fastapi import APIRouter, Request, HTTPException, status, Depends
from datetime import datetime, timezone
from bson import ObjectId
from app.core.database import get_database
from app.api.deps import require_admin, verify_csrf, get_client_ip
from app.models.schemas import ChangeRoleRequest, BlockUserRequest

router = APIRouter(prefix="/api/admin", tags=["Admin"], dependencies=[Depends(require_admin)])

@router.get("/stats")
async def get_dashboard_stats():
    db = get_database()
    total_users = await db.users.count_documents({})
    active_sessions = await db.sessions.count_documents({"isActive": True})
    unresolved_alerts = await db.securityalerts.count_documents({"isResolved": False})
    mfa_users = await db.users.count_documents({"mfaEnabled": True})
    locked_users = await db.users.count_documents({"lockUntil": {"$gt": datetime.now(timezone.utc)}})

    # 7-day registration and login telemetry
    reg_cursor = db.users.aggregate([
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$createdAt"}},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": -1}},
        {"$limit": 7}
    ])
    registration_trends = [doc async for doc in reg_cursor]

    login_cursor = db.loginhistories.aggregate([
        {"$group": {
            "_id": "$status",
            "count": {"$sum": 1}
        }}
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
            "registrationTrends": registration_trends,
            "loginBreakdown": login_breakdown,
            "systemStatus": "OPTIMAL"
        }
    }

@router.get("/users")
async def get_all_users():
    db = get_database()
    cursor = db.users.find({}).sort("createdAt", -1).limit(100)
    users = []
    async for u in cursor:
        users.append({
            "_id": str(u["_id"]),
            "email": u["email"],
            "firstName": u["firstName"],
            "lastName": u["lastName"],
            "role": u.get("role", "User"),
            "isVerified": u.get("isVerified", False),
            "isBlocked": u.get("isBlocked", False),
            "mfaEnabled": u.get("mfaEnabled", False),
            "loginAttempts": u.get("loginAttempts", 0),
            "createdAt": u.get("createdAt")
        })
    return {"success": True, "users": users}

@router.get("/users/{user_id}")
async def get_user_by_id(user_id: str):
    db = get_database()
    try:
        u = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID.")
    if not u:
        raise HTTPException(status_code=404, detail="User not found.")
    return {
        "success": True,
        "user": {
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
    }

@router.put("/users/{user_id}/block")
async def block_unblock_user(
    user_id: str,
    req: BlockUserRequest,
    request: Request,
    admin: dict = Depends(require_admin),
    _csrf: bool = Depends(verify_csrf)
):
    db = get_database()
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID.")

    await db.users.update_one({"_id": oid}, {"$set": {"isBlocked": req.isBlocked, "updatedAt": datetime.now(timezone.utc)}})

    if req.isBlocked:
        await db.sessions.update_many({"userId": oid}, {"$set": {"isActive": False}})
        await db.refreshtokens.update_many({"userId": oid}, {"$set": {"isRevoked": True}})

    await db.auditlogs.insert_one({
        "userId": admin["_id"],
        "userEmail": admin["email"],
        "action": "ACCOUNT_BLOCKED" if req.isBlocked else "ACCOUNT_UNBLOCKED",
        "details": f"User {user_id} was {'blocked' if req.isBlocked else 'unblocked'} by admin.",
        "ipAddress": get_client_ip(request),
        "userAgent": request.headers.get("user-agent", ""),
        "createdAt": datetime.now(timezone.utc)
    })

    return {"success": True, "message": f"User successfully {'blocked' if req.isBlocked else 'unblocked'}."}

@router.put("/users/{user_id}/role")
async def change_user_role(
    user_id: str,
    req: ChangeRoleRequest,
    request: Request,
    admin: dict = Depends(require_admin),
    _csrf: bool = Depends(verify_csrf)
):
    db = get_database()
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID.")

    await db.users.update_one({"_id": oid}, {"$set": {"role": req.role, "updatedAt": datetime.now(timezone.utc)}})

    await db.auditlogs.insert_one({
        "userId": admin["_id"],
        "userEmail": admin["email"],
        "action": "ROLE_CHANGE",
        "details": f"Role for user {user_id} updated to {req.role}.",
        "ipAddress": get_client_ip(request),
        "userAgent": request.headers.get("user-agent", ""),
        "createdAt": datetime.now(timezone.utc)
    })

    return {"success": True, "message": f"Role successfully updated to {req.role}."}

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    request: Request,
    admin: dict = Depends(require_admin),
    _csrf: bool = Depends(verify_csrf)
):
    db = get_database()
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID.")

    await db.users.delete_one({"_id": oid})
    await db.sessions.delete_many({"userId": oid})
    await db.refreshtokens.delete_many({"userId": oid})
    await db.otps.delete_many({"userId": oid})

    await db.auditlogs.insert_one({
        "userId": admin["_id"],
        "userEmail": admin["email"],
        "action": "USER_DELETED",
        "details": f"User {user_id} was deleted by admin.",
        "ipAddress": get_client_ip(request),
        "userAgent": request.headers.get("user-agent", ""),
        "createdAt": datetime.now(timezone.utc)
    })

    return {"success": True, "message": "User deleted successfully."}

@router.get("/sessions")
async def get_all_active_sessions():
    db = get_database()
    cursor = db.sessions.find({"isActive": True}).sort("createdAt", -1).limit(100)
    sessions = []
    async for s in cursor:
        sessions.append({
            "_id": str(s["_id"]),
            "userId": str(s["userId"]),
            "ipAddress": s.get("ipAddress"),
            "userAgent": s.get("userAgent"),
            "deviceInfo": s.get("deviceInfo", {}),
            "createdAt": s.get("createdAt"),
            "lastActiveAt": s.get("lastActiveAt")
        })
    return {"success": True, "sessions": sessions}

@router.delete("/sessions/{session_id}")
async def force_terminate_session(
    session_id: str,
    request: Request,
    admin: dict = Depends(require_admin),
    _csrf: bool = Depends(verify_csrf)
):
    db = get_database()
    try:
        s_oid = ObjectId(session_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session ID.")

    await db.sessions.update_one({"_id": s_oid}, {"$set": {"isActive": False}})
    await db.refreshtokens.update_many({"sessionId": s_oid}, {"$set": {"isRevoked": True}})

    return {"success": True, "message": "Session terminated by administrator."}

@router.get("/security-alerts")
async def get_all_security_alerts():
    db = get_database()
    cursor = db.securityalerts.find({}).sort("createdAt", -1).limit(50)
    alerts = []
    async for a in cursor:
        alerts.append({
            "_id": str(a["_id"]),
            "userId": str(a["userId"]),
            "alertType": a.get("alertType"),
            "severity": a.get("severity"),
            "message": a.get("message"),
            "ipAddress": a.get("ipAddress"),
            "isResolved": a.get("isResolved", False),
            "createdAt": a.get("createdAt")
        })
    return {"success": True, "alerts": alerts}

@router.put("/security-alerts/{alert_id}/resolve")
async def resolve_security_alert(
    alert_id: str,
    request: Request,
    admin: dict = Depends(require_admin),
    _csrf: bool = Depends(verify_csrf)
):
    db = get_database()
    try:
        a_oid = ObjectId(alert_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid alert ID.")

    await db.securityalerts.update_one(
        {"_id": a_oid},
        {"$set": {
            "isResolved": True,
            "resolvedAt": datetime.now(timezone.utc),
            "resolvedBy": admin["_id"]
        }}
    )

    return {"success": True, "message": "Security alert marked as resolved."}

@router.get("/audit-logs")
async def get_all_audit_logs():
    db = get_database()
    cursor = db.auditlogs.find({}).sort("createdAt", -1).limit(100)
    logs = []
    async for l in cursor:
        logs.append({
            "_id": str(l["_id"]),
            "userEmail": l.get("userEmail"),
            "action": l.get("action"),
            "details": l.get("details"),
            "ipAddress": l.get("ipAddress"),
            "userAgent": l.get("userAgent"),
            "createdAt": l.get("createdAt")
        })
    return {"success": True, "logs": logs}

@router.get("/login-history")
async def get_platform_login_history():
    db = get_database()
    cursor = db.loginhistories.find({}).sort("createdAt", -1).limit(100)
    history = []
    async for h in cursor:
        history.append({
            "_id": str(h["_id"]),
            "emailAttempted": h.get("emailAttempted"),
            "status": h.get("status"),
            "ipAddress": h.get("ipAddress"),
            "userAgent": h.get("userAgent"),
            "deviceInfo": h.get("deviceInfo", {}),
            "failureReason": h.get("failureReason"),
            "createdAt": h.get("createdAt")
        })
    return {"success": True, "history": history}
