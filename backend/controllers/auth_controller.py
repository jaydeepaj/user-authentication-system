import os
import secrets
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from fastapi import Request, Response, HTTPException, status
from app.core.database import get_database
from app.core.security import (
    hash_password, verify_password, hash_sha256,
    generate_csrf_token, generate_otp_code,
    create_access_token, create_refresh_token,
    verify_totp_code
)
from app.services.email_service import (
    send_verification_otp_email, send_password_reset_email
)
from app.api.deps import parse_user_agent, get_client_ip
from app.core.config import settings

class AuthController:
    @staticmethod
    async def get_csrf_token(response: Response):
        token = generate_csrf_token()
        response.set_cookie(
            key="csrf-token",
            value=token,
            httponly=False,
            samesite="lax",
            secure=False,
            path="/"
        )
        return {"success": True, "csrfToken": token}

    @staticmethod
    async def register(data: dict, request: Request, response: Response):
        db = get_database()
        email = data["email"].lower().strip()
        first_name = data["firstName"].strip()
        last_name = data["lastName"].strip()

        existing = await db.users.find_one({"email": email})
        if existing:
            raise HTTPException(status_code=400, detail="An account with this email already exists.")

        hashed_pw = hash_password(data["password"])
        new_user = {
            "email": email,
            "password": hashed_pw,
            "firstName": first_name,
            "lastName": last_name,
            "role": "User",
            "isVerified": False,
            "loginAttempts": 0,
            "lockUntil": None,
            "mfaEnabled": False,
            "mfaSecret": None,
            "mfaBackupCodes": [],
            "isBlocked": False,
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc)
        }
        result = await db.users.insert_one(new_user)
        user_id = result.inserted_id

        # Generate & send OTP
        otp = generate_otp_code()
        await db.otps.insert_one({
            "userId": user_id,
            "otpHash": hash_sha256(otp),
            "type": "EMAIL_VERIFICATION",
            "isUsed": False,
            "expiresAt": datetime.now(timezone.utc) + timedelta(minutes=10),
            "createdAt": datetime.now(timezone.utc)
        })

        await send_verification_otp_email(email, first_name, otp)

        csrf_token = generate_csrf_token()
        response.set_cookie(key="csrf-token", value=csrf_token, httponly=False, samesite="lax", secure=False, path="/")

        return {
            "success": True,
            "message": "Registration successful. Please verify your email.",
            "requiresEmailVerification": True,
            "email": email,
            "csrfToken": csrf_token
        }

    @staticmethod
    async def verify_email(data: dict, request: Request):
        db = get_database()
        email = data["email"].lower().strip()
        user = await db.users.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=400, detail="User not found.")

        otp_hash = hash_sha256(data["otp"].strip())
        record = await db.otps.find_one({
            "userId": user["_id"],
            "otpHash": otp_hash,
            "type": "EMAIL_VERIFICATION",
            "isUsed": False,
            "expiresAt": {"$gt": datetime.now(timezone.utc)}
        })
        if not record:
            raise HTTPException(status_code=400, detail="Invalid or expired verification code.")

        await db.otps.update_one({"_id": record["_id"]}, {"$set": {"isUsed": True}})
        await db.users.update_one({"_id": user["_id"]}, {"$set": {"isVerified": True, "updatedAt": datetime.now(timezone.utc)}})
        return {"success": True, "message": "Email verified successfully! You may now sign in."}

    @staticmethod
    async def login(data: dict, request: Request, response: Response):
        db = get_database()
        email = data["email"].lower().strip()
        password = data["password"]
        ip_addr = get_client_ip(request)
        ua = request.headers.get("user-agent", "")
        device_info = parse_user_agent(ua)

        user = await db.users.find_one({"email": email})

        # Lockout check
        if user and user.get("lockUntil"):
            lock_until = user["lockUntil"]
            if isinstance(lock_until, datetime):
                if lock_until.tzinfo is None:
                    lock_until = lock_until.replace(tzinfo=timezone.utc)
                if datetime.now(timezone.utc) < lock_until:
                    mins = max(1, int((lock_until - datetime.now(timezone.utc)).total_seconds() / 60))
                    raise HTTPException(status_code=423, detail=f"Account locked. Try again in {mins} minutes.")
                else:
                    await db.users.update_one({"_id": user["_id"]}, {"$set": {"loginAttempts": 0, "lockUntil": None}})

        valid_pw = False
        if user:
            valid_pw = verify_password(password, user["password"])

        if not user or not valid_pw:
            if user:
                attempts = user.get("loginAttempts", 0) + 1
                upd = {"loginAttempts": attempts}
                if attempts >= 5:
                    upd["lockUntil"] = datetime.now(timezone.utc) + timedelta(minutes=30)
                await db.users.update_one({"_id": user["_id"]}, {"$set": upd})
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        if not user.get("isVerified", False):
            return {"success": True, "requiresEmailVerification": True, "email": email}

        if user.get("isBlocked", False):
            raise HTTPException(status_code=403, detail="Account has been blocked by administrator.")

        # Reset failed attempts
        await db.users.update_one({"_id": user["_id"]}, {"$set": {"loginAttempts": 0, "lockUntil": None}})

        if user.get("mfaEnabled", False):
            return {"success": True, "requiresMfa": True, "userId": str(user["_id"])}

        return await AuthController._issue_tokens(user, request, response, ip_addr, ua, device_info)

    @staticmethod
    async def _issue_tokens(user: dict, request: Request, response: Response, ip_addr: str, ua: str, device_info: dict):
        db = get_database()
        user_id = user["_id"]

        session_res = await db.sessions.insert_one({
            "userId": user_id,
            "sessionToken": hash_sha256(secrets.token_hex(32)),
            "ipAddress": ip_addr,
            "userAgent": ua,
            "deviceInfo": device_info,
            "isActive": True,
            "lastActiveAt": datetime.now(timezone.utc),
            "createdAt": datetime.now(timezone.utc)
        })

        refresh_raw = create_refresh_token()
        await db.refreshtokens.insert_one({
            "userId": user_id,
            "sessionId": session_res.inserted_id,
            "tokenHash": hash_sha256(refresh_raw),
            "isUsed": False,
            "isRevoked": False,
            "expiresAt": datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_EXPIRY_DAYS),
            "createdAt": datetime.now(timezone.utc)
        })

        access_token = create_access_token(str(user_id), user.get("role", "User"))
        csrf_token = generate_csrf_token()

        response.set_cookie(key="refreshToken", value=refresh_raw, httponly=True, samesite="lax", secure=False, path="/")
        response.set_cookie(key="csrf-token", value=csrf_token, httponly=False, samesite="lax", secure=False, path="/")

        return {
            "success": True,
            "accessToken": access_token,
            "csrfToken": csrf_token,
            "user": {
                "_id": str(user["_id"]),
                "email": user["email"],
                "firstName": user["firstName"],
                "lastName": user["lastName"],
                "role": user.get("role", "User"),
                "mfaEnabled": user.get("mfaEnabled", False),
                "isVerified": user.get("isVerified", True)
            }
        }
