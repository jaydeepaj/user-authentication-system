from fastapi import APIRouter, Request, Response, HTTPException, status, Depends
from datetime import datetime, timezone
from bson import ObjectId
from app.core.database import get_database
from app.core.security import (
    hash_password, verify_password, hash_sha256,
    generate_totp_secret, get_totp_uri, generate_qr_code_data_url,
    verify_totp_code, generate_backup_codes, generate_otp_code
)
from app.api.deps import get_current_user, verify_csrf, get_client_ip
from app.models.schemas import (
    UpdateProfileRequest, ChangePasswordRequest, ConfirmMfaRequest,
    DeleteAccountRequestOtp, ConfirmDeleteAccount
)

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("/me")
async def get_profile(current_user: dict = Depends(get_current_user)):
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

@router.put("/me")
async def update_profile(
    req: UpdateProfileRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
    _csrf: bool = Depends(verify_csrf)
):
    db = get_database()
    update_data = {}
    if req.firstName is not None:
        update_data["firstName"] = req.firstName.strip()
    if req.lastName is not None:
        update_data["lastName"] = req.lastName.strip()

    if update_data:
        update_data["updatedAt"] = datetime.now(timezone.utc)
        await db.users.update_one({"_id": current_user["_id"]}, {"$set": update_data})

    return {"success": True, "message": "Profile updated successfully."}

@router.put("/change-password")
async def change_password(
    req: ChangePasswordRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
    _csrf: bool = Depends(verify_csrf)
):
    db = get_database()
    if not verify_password(req.currentPassword, current_user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")

    new_hash = hash_password(req.newPassword)
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"password": new_hash, "updatedAt": datetime.now(timezone.utc)}}
    )

    await db.auditlogs.insert_one({
        "userId": current_user["_id"],
        "userEmail": current_user["email"],
        "action": "PASSWORD_CHANGE",
        "details": "Password changed successfully via profile settings.",
        "ipAddress": get_client_ip(request),
        "userAgent": request.headers.get("user-agent", ""),
        "createdAt": datetime.now(timezone.utc)
    })

    return {"success": True, "message": "Password changed successfully."}

@router.post("/mfa/setup")
async def setup_mfa(
    current_user: dict = Depends(get_current_user),
    _csrf: bool = Depends(verify_csrf)
):
    db = get_database()
    secret = generate_totp_secret()
    uri = get_totp_uri(secret, current_user["email"])
    qr_data_url = generate_qr_code_data_url(uri)
    backup_data = generate_backup_codes(8)

    # Store temporarily in pendingMfa
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {
            "pendingMfaSecret": secret,
            "pendingBackupCodes": backup_data["hashed_codes"]
        }}
    )

    return {
        "success": True,
        "secret": secret,
        "qrCode": qr_data_url,
        "backupCodes": backup_data["raw_codes"]
    }

@router.post("/mfa/confirm")
async def confirm_mfa(
    req: ConfirmMfaRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
    _csrf: bool = Depends(verify_csrf)
):
    db = get_database()
    secret = current_user.get("pendingMfaSecret")
    if not secret:
        raise HTTPException(status_code=400, detail="MFA setup has not been initiated.")

    if not verify_totp_code(secret, req.code.strip()):
        raise HTTPException(status_code=400, detail="Invalid verification code. Check your authenticator app.")

    await db.users.update_one(
        {"_id": current_user["_id"]},
        {
            "$set": {
                "mfaEnabled": True,
                "mfaSecret": secret,
                "mfaBackupCodes": current_user.get("pendingBackupCodes", []),
                "updatedAt": datetime.now(timezone.utc)
            },
            "$unset": {
                "pendingMfaSecret": "",
                "pendingBackupCodes": ""
            }
        }
    )

    await db.auditlogs.insert_one({
        "userId": current_user["_id"],
        "userEmail": current_user["email"],
        "action": "MFA_ENABLED",
        "details": "Two-Factor Authentication enabled via TOTP.",
        "ipAddress": get_client_ip(request),
        "userAgent": request.headers.get("user-agent", ""),
        "createdAt": datetime.now(timezone.utc)
    })

    return {"success": True, "message": "Two-Factor Authentication has been successfully enabled."}

@router.delete("/mfa/disable")
async def disable_mfa(
    request: Request,
    current_user: dict = Depends(get_current_user),
    _csrf: bool = Depends(verify_csrf)
):
    db = get_database()
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {
            "mfaEnabled": False,
            "mfaSecret": None,
            "mfaBackupCodes": [],
            "updatedAt": datetime.now(timezone.utc)
        }}
    )

    await db.auditlogs.insert_one({
        "userId": current_user["_id"],
        "userEmail": current_user["email"],
        "action": "MFA_DISABLED",
        "details": "Two-Factor Authentication disabled by user.",
        "ipAddress": get_client_ip(request),
        "userAgent": request.headers.get("user-agent", ""),
        "createdAt": datetime.now(timezone.utc)
    })

    return {"success": True, "message": "Two-Factor Authentication disabled."}

@router.get("/sessions")
async def get_sessions(current_user: dict = Depends(get_current_user)):
    db = get_database()
    cursor = db.sessions.find({"userId": current_user["_id"], "isActive": True}).sort("createdAt", -1)
    sessions = []
    async for s in cursor:
        sessions.append({
            "_id": str(s["_id"]),
            "ipAddress": s.get("ipAddress"),
            "userAgent": s.get("userAgent"),
            "deviceInfo": s.get("deviceInfo", {}),
            "createdAt": s.get("createdAt"),
            "lastActiveAt": s.get("lastActiveAt")
        })
    return {"success": True, "sessions": sessions}

@router.delete("/sessions")
async def terminate_all_sessions(
    request: Request,
    response: Response,
    current_user: dict = Depends(get_current_user),
    _csrf: bool = Depends(verify_csrf)
):
    db = get_database()
    await db.sessions.update_many({"userId": current_user["_id"]}, {"$set": {"isActive": False}})
    await db.refreshtokens.update_many({"userId": current_user["_id"]}, {"$set": {"isRevoked": True}})

    response.delete_cookie("refreshToken", path="/")
    return {"success": True, "message": "All sessions terminated."}

@router.delete("/sessions/{session_id}")
async def terminate_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    _csrf: bool = Depends(verify_csrf)
):
    db = get_database()
    try:
        s_oid = ObjectId(session_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session ID.")

    await db.sessions.update_one({"_id": s_oid, "userId": current_user["_id"]}, {"$set": {"isActive": False}})
    await db.refreshtokens.update_many({"sessionId": s_oid}, {"$set": {"isRevoked": True}})
    return {"success": True, "message": "Session terminated successfully."}

@router.get("/login-history")
async def get_login_history(current_user: dict = Depends(get_current_user)):
    db = get_database()
    cursor = db.loginhistories.find({"userId": current_user["_id"]}).sort("createdAt", -1).limit(50)
    history = []
    async for h in cursor:
        history.append({
            "_id": str(h["_id"]),
            "status": h.get("status"),
            "ipAddress": h.get("ipAddress"),
            "userAgent": h.get("userAgent"),
            "deviceInfo": h.get("deviceInfo", {}),
            "failureReason": h.get("failureReason"),
            "createdAt": h.get("createdAt")
        })
    return {"success": True, "history": history}

@router.get("/audit-log")
async def get_audit_log(current_user: dict = Depends(get_current_user)):
    db = get_database()
    cursor = db.auditlogs.find({"userId": current_user["_id"]}).sort("createdAt", -1).limit(50)
    logs = []
    async for l in cursor:
        logs.append({
            "_id": str(l["_id"]),
            "action": l.get("action"),
            "details": l.get("details"),
            "ipAddress": l.get("ipAddress"),
            "userAgent": l.get("userAgent"),
            "createdAt": l.get("createdAt")
        })
    return {"success": True, "logs": logs}

@router.get("/security-alerts")
async def get_security_alerts(current_user: dict = Depends(get_current_user)):
    db = get_database()
    cursor = db.securityalerts.find({"userId": current_user["_id"]}).sort("createdAt", -1).limit(20)
    alerts = []
    async for a in cursor:
        alerts.append({
            "_id": str(a["_id"]),
            "alertType": a.get("alertType"),
            "severity": a.get("severity"),
            "message": a.get("message"),
            "ipAddress": a.get("ipAddress"),
            "isResolved": a.get("isResolved"),
            "createdAt": a.get("createdAt")
        })
    return {"success": True, "alerts": alerts}
