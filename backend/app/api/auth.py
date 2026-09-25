import secrets
from fastapi import APIRouter, Request, Response, HTTPException, status, Depends
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from app.core.config import settings
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
from app.api.deps import parse_user_agent, get_client_ip, get_current_user, verify_csrf
from app.models.schemas import (
    RegisterRequest, LoginRequest, VerifyEmailRequest, ResendVerificationRequest,
    MfaLoginRequest, SendMfaOtpRequest, ForgotPasswordRequest,
    VerifyResetOtpRequest, ResetPasswordRequest
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.get("/csrf-token")
async def get_csrf_token(response: Response):
    token = generate_csrf_token()
    response.set_cookie(
        key="csrf-token",
        value=token,
        httponly=False,
        samesite="lax",
        secure=False, # True in prod
        path="/"
    )
    return {"success": True, "csrfToken": token}

@router.post("/register")
async def register(req: RegisterRequest, request: Request, response: Response):
    db = get_database()
    existing = await db.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    hashed_pw = hash_password(req.password)
    new_user = {
        "email": req.email.lower(),
        "password": hashed_pw,
        "firstName": req.firstName.strip(),
        "lastName": req.lastName.strip(),
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

    # Generate OTP
    otp = generate_otp_code()
    otp_hash = hash_sha256(otp)
    await db.otps.insert_one({
        "userId": user_id,
        "otpHash": otp_hash,
        "type": "EMAIL_VERIFICATION",
        "isUsed": False,
        "expiresAt": datetime.now(timezone.utc) + timedelta(minutes=10),
        "createdAt": datetime.now(timezone.utc)
    })

    # Send Email (non-blocking — registration succeeds even if email fails)
    try:
        await send_verification_otp_email(req.email.lower(), req.firstName, otp)
    except Exception as e:
        print(f"[WARNING] Email send failed for {req.email}: {e}")

    # Audit log
    await db.auditlogs.insert_one({
        "userId": user_id,
        "userEmail": req.email.lower(),
        "action": "REGISTER",
        "details": "User registered successfully, verification email sent.",
        "ipAddress": get_client_ip(request),
        "userAgent": request.headers.get("user-agent", ""),
        "createdAt": datetime.now(timezone.utc)
    })

    csrf_token = generate_csrf_token()
    response.set_cookie(key="csrf-token", value=csrf_token, httponly=False, samesite="lax", secure=False, path="/")

    return {
        "success": True,
        "message": "Registration successful. Please check your email for the verification code.",
        "requiresEmailVerification": True,
        "email": req.email.lower(),
        "csrfToken": csrf_token
    }

@router.post("/verify-email")
async def verify_email(req: VerifyEmailRequest, request: Request):
    db = get_database()
    user = await db.users.find_one({"email": req.email.lower()})
    if not user:
        raise HTTPException(status_code=400, detail="User not found.")

    otp_hash = hash_sha256(req.otp.strip())
    otp_record = await db.otps.find_one({
        "userId": user["_id"],
        "otpHash": otp_hash,
        "type": "EMAIL_VERIFICATION",
        "isUsed": False,
        "expiresAt": {"$gt": datetime.now(timezone.utc)}
    })

    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code.")

    await db.otps.update_one({"_id": otp_record["_id"]}, {"$set": {"isUsed": True}})
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"isVerified": True, "updatedAt": datetime.now(timezone.utc)}})

    await db.auditlogs.insert_one({
        "userId": user["_id"],
        "userEmail": user["email"],
        "action": "EMAIL_VERIFIED",
        "details": "Email successfully verified via OTP.",
        "ipAddress": get_client_ip(request),
        "userAgent": request.headers.get("user-agent", ""),
        "createdAt": datetime.now(timezone.utc)
    })

    return {"success": True, "message": "Email verified successfully! You may now sign in."}

@router.post("/resend-verification")
async def resend_verification(req: ResendVerificationRequest):
    db = get_database()
    user = await db.users.find_one({"email": req.email.lower()})
    if not user or user.get("isVerified"):
        return {"success": True, "message": "If the account exists and is unverified, a new code has been sent."}

    otp = generate_otp_code()
    otp_hash = hash_sha256(otp)
    await db.otps.delete_many({"userId": user["_id"], "type": "EMAIL_VERIFICATION"})
    await db.otps.insert_one({
        "userId": user["_id"],
        "otpHash": otp_hash,
        "type": "EMAIL_VERIFICATION",
        "isUsed": False,
        "expiresAt": datetime.now(timezone.utc) + timedelta(minutes=10),
        "createdAt": datetime.now(timezone.utc)
    })
    await send_verification_otp_email(user["email"], user["firstName"], otp)
    return {"success": True, "message": "Verification code resent successfully."}

@router.post("/login")
async def login(req: LoginRequest, request: Request, response: Response, _csrf: bool = Depends(verify_csrf)):
    db = get_database()
    email = req.email.lower()
    ip_addr = get_client_ip(request)
    ua = request.headers.get("user-agent", "")
    device_info = parse_user_agent(ua)

    user = await db.users.find_one({"email": email})

    # Check Lockout
    if user and user.get("lockUntil"):
        lock_until = user["lockUntil"]
        if isinstance(lock_until, datetime):
            if lock_until.tzinfo is None:
                lock_until = lock_until.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) < lock_until:
                minutes_left = max(1, int((lock_until - datetime.now(timezone.utc)).total_seconds() / 60))
                raise HTTPException(
                    status_code=423,
                    detail=f"Account is temporarily locked due to multiple failed logins. Try again in {minutes_left} minutes."
                )
            else:
                # Lock expired, reset
                await db.users.update_one({"_id": user["_id"]}, {"$set": {"loginAttempts": 0, "lockUntil": None}})
                user["loginAttempts"] = 0
                user["lockUntil"] = None

    # Validate Credentials
    valid_password = False
    if user:
        valid_password = verify_password(req.password, user["password"])

    if not user or not valid_password:
        if user:
            attempts = user.get("loginAttempts", 0) + 1
            update_fields = {"loginAttempts": attempts}
            if attempts >= 5:
                update_fields["lockUntil"] = datetime.now(timezone.utc) + timedelta(minutes=30)
                await db.securityalerts.insert_one({
                    "userId": user["_id"],
                    "alertType": "ACCOUNT_LOCKED",
                    "severity": "MEDIUM",
                    "message": f"Account locked after 5 consecutive failed login attempts from IP: {ip_addr}.",
                    "ipAddress": ip_addr,
                    "isResolved": False,
                    "createdAt": datetime.now(timezone.utc)
                })
            await db.users.update_one({"_id": user["_id"]}, {"$set": update_fields})

        # Log failed login history
        await db.loginhistories.insert_one({
            "userId": user["_id"] if user else None,
            "emailAttempted": email,
            "ipAddress": ip_addr,
            "userAgent": ua,
            "deviceInfo": device_info,
            "status": "FAILED",
            "failureReason": "Invalid credentials",
            "createdAt": datetime.now(timezone.utc)
        })
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    # Check verification
    if not user.get("isVerified", False):
        return {
            "success": True,
            "requiresEmailVerification": True,
            "email": email,
            "message": "Email address not verified."
        }

    # Check Blocked
    if user.get("isBlocked", False):
        raise HTTPException(status_code=403, detail="Account has been blocked by administrator.")

    # Reset failed attempts
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"loginAttempts": 0, "lockUntil": None}})

    # Check MFA
    if user.get("mfaEnabled", False):
        return {
            "success": True,
            "requiresMfa": True,
            "userId": str(user["_id"])
        }

    # Issue Tokens & Create Session
    return await _issue_auth_session(user, request, response, ip_addr, ua, device_info)

async def _issue_auth_session(user: dict, request: Request, response: Response, ip_addr: str, ua: str, device_info: dict):
    db = get_database()
    user_id = user["_id"]

    # Create Session
    session_raw = secrets.token_hex(32)
    session_result = await db.sessions.insert_one({
        "userId": user_id,
        "sessionToken": hash_sha256(session_raw),
        "ipAddress": ip_addr,
        "userAgent": ua,
        "deviceInfo": device_info,
        "isActive": True,
        "lastActiveAt": datetime.now(timezone.utc),
        "createdAt": datetime.now(timezone.utc)
    })
    session_id = session_result.inserted_id

    # Create Refresh Token
    refresh_raw = create_refresh_token()
    refresh_hash = hash_sha256(refresh_raw)
    await db.refreshtokens.insert_one({
        "userId": user_id,
        "sessionId": session_id,
        "tokenHash": refresh_hash,
        "isUsed": False,
        "isRevoked": False,
        "expiresAt": datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_EXPIRY_DAYS),
        "createdAt": datetime.now(timezone.utc)
    })

    # Access Token
    access_token = create_access_token(str(user_id), user.get("role", "User"))
    csrf_token = generate_csrf_token()

    # Set Cookies
    response.set_cookie(
        key="refreshToken",
        value=refresh_raw,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=settings.JWT_REFRESH_EXPIRY_DAYS * 24 * 3600,
        path="/"
    )
    response.set_cookie(
        key="csrf-token",
        value=csrf_token,
        httponly=False,
        samesite="lax",
        secure=False,
        path="/"
    )

    # Log Login History
    await db.loginhistories.insert_one({
        "userId": user_id,
        "emailAttempted": user["email"],
        "ipAddress": ip_addr,
        "userAgent": ua,
        "deviceInfo": device_info,
        "status": "SUCCESS",
        "failureReason": None,
        "createdAt": datetime.now(timezone.utc)
    })

    # Audit Log
    await db.auditlogs.insert_one({
        "userId": user_id,
        "userEmail": user["email"],
        "action": "LOGIN",
        "details": f"Successful login from {device_info.get('browser', 'Browser')} on {device_info.get('os', 'OS')}.",
        "ipAddress": ip_addr,
        "userAgent": ua,
        "createdAt": datetime.now(timezone.utc)
    })

    user_data = {
        "_id": str(user["_id"]),
        "email": user["email"],
        "firstName": user["firstName"],
        "lastName": user["lastName"],
        "role": user.get("role", "User"),
        "mfaEnabled": user.get("mfaEnabled", False),
        "isVerified": user.get("isVerified", True)
    }

    return {
        "success": True,
        "message": "Login successful.",
        "accessToken": access_token,
        "csrfToken": csrf_token,
        "user": user_data
    }

@router.post("/mfa/verify-login")
async def verify_mfa_login(req: MfaLoginRequest, request: Request, response: Response, _csrf: bool = Depends(verify_csrf)):
    db = get_database()
    try:
        user = await db.users.find_one({"_id": ObjectId(req.userId)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid User ID.")

    if not user:
        raise HTTPException(status_code=400, detail="User not found.")

    ip_addr = get_client_ip(request)
    ua = request.headers.get("user-agent", "")
    device_info = parse_user_agent(ua)

    code = req.code.strip()
    is_valid = False

    # Check TOTP
    if user.get("mfaSecret") and verify_totp_code(user["mfaSecret"], code):
        is_valid = True
    else:
        # Check Backup Codes
        code_hash = hash_sha256(code.upper())
        backup_codes = user.get("mfaBackupCodes", [])
        if code_hash in backup_codes:
            is_valid = True
            # Burn backup code
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$pull": {"mfaBackupCodes": code_hash}}
            )

    if not is_valid:
        await db.securityalerts.insert_one({
            "userId": user["_id"],
            "alertType": "MFA_FAILED",
            "severity": "HIGH",
            "message": f"Failed MFA challenge attempt from IP: {ip_addr}.",
            "ipAddress": ip_addr,
            "isResolved": False,
            "createdAt": datetime.now(timezone.utc)
        })
        raise HTTPException(status_code=401, detail="Invalid 2FA code or backup code.")

    return await _issue_auth_session(user, request, response, ip_addr, ua, device_info)

@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    db = get_database()
    raw_token = request.cookies.get("refreshToken")
    if not raw_token:
        raise HTTPException(status_code=401, detail="Refresh token not found in cookies.")

    token_hash = hash_sha256(raw_token)
    stored_token = await db.refreshtokens.find_one({"tokenHash": token_hash})

    if not stored_token or stored_token.get("isRevoked"):
        raise HTTPException(status_code=401, detail="Invalid or revoked refresh token.")

    user_id = stored_token["userId"]
    ip_addr = get_client_ip(request)

    # TOKEN REUSE ANOMALY DETECTION
    if stored_token.get("isUsed"):
        # Potential breach: revoke all sessions immediately!
        await db.sessions.update_many({"userId": user_id}, {"$set": {"isActive": False}})
        await db.refreshtokens.update_many({"userId": user_id}, {"$set": {"isRevoked": True}})
        await db.securityalerts.insert_one({
            "userId": user_id,
            "alertType": "REFRESH_TOKEN_REUSE",
            "severity": "CRITICAL",
            "message": f"Compromised refresh token reuse detected from IP: {ip_addr}. All sessions revoked immediately.",
            "ipAddress": ip_addr,
            "isResolved": False,
            "createdAt": datetime.now(timezone.utc)
        })
        raise HTTPException(status_code=401, detail="Security violation: token reuse detected. All sessions terminated.")

    # Mark old token consumed
    await db.refreshtokens.update_one({"_id": stored_token["_id"]}, {"$set": {"isUsed": True}})

    # Fetch user
    user = await db.users.find_one({"_id": user_id})
    if not user or user.get("isBlocked"):
        raise HTTPException(status_code=403, detail="User account is inactive or blocked.")

    # Generate new refresh token
    new_refresh_raw = create_refresh_token()
    new_refresh_hash = hash_sha256(new_refresh_raw)
    await db.refreshtokens.insert_one({
        "userId": user_id,
        "sessionId": stored_token["sessionId"],
        "tokenHash": new_refresh_hash,
        "isUsed": False,
        "isRevoked": False,
        "expiresAt": datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_EXPIRY_DAYS),
        "createdAt": datetime.now(timezone.utc)
    })

    access_token = create_access_token(str(user_id), user.get("role", "User"))
    csrf_token = generate_csrf_token()

    response.set_cookie(
        key="refreshToken",
        value=new_refresh_raw,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=settings.JWT_REFRESH_EXPIRY_DAYS * 24 * 3600,
        path="/"
    )
    response.set_cookie(
        key="csrf-token",
        value=csrf_token,
        httponly=False,
        samesite="lax",
        secure=False,
        path="/"
    )

    return {
        "success": True,
        "accessToken": access_token,
        "csrfToken": csrf_token
    }

@router.post("/logout")
async def logout(request: Request, response: Response, current_user: dict = Depends(get_current_user)):
    db = get_database()
    raw_token = request.cookies.get("refreshToken")
    if raw_token:
        token_hash = hash_sha256(raw_token)
        stored_token = await db.refreshtokens.find_one({"tokenHash": token_hash})
        if stored_token:
            await db.refreshtokens.update_one({"_id": stored_token["_id"]}, {"$set": {"isRevoked": True}})
            await db.sessions.update_one({"_id": stored_token["sessionId"]}, {"$set": {"isActive": False}})

    response.delete_cookie(key="refreshToken", path="/")
    response.delete_cookie(key="csrf-token", path="/")

    await db.auditlogs.insert_one({
        "userId": current_user["_id"],
        "userEmail": current_user["email"],
        "action": "LOGOUT",
        "details": "User successfully logged out.",
        "ipAddress": get_client_ip(request),
        "userAgent": request.headers.get("user-agent", ""),
        "createdAt": datetime.now(timezone.utc)
    })

    return {"success": True, "message": "Logged out successfully."}

@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    db = get_database()
    user = await db.users.find_one({"email": req.email.lower()})
    if user:
        otp = generate_otp_code()
        otp_hash = hash_sha256(otp)
        await db.otps.delete_many({"userId": user["_id"], "type": "PASSWORD_RESET"})
        await db.otps.insert_one({
            "userId": user["_id"],
            "otpHash": otp_hash,
            "type": "PASSWORD_RESET",
            "isUsed": False,
            "expiresAt": datetime.now(timezone.utc) + timedelta(minutes=15),
            "createdAt": datetime.now(timezone.utc)
        })
        try:
            await send_password_reset_email(user["email"], otp)
        except Exception as e:
            print(f"[WARNING] Password reset email failed for {user['email']}: {e}")

    return {"success": True, "message": "If an account exists with this email, a password reset code has been sent."}

@router.post("/verify-reset-otp")
async def verify_reset_otp(req: VerifyResetOtpRequest):
    db = get_database()
    user = await db.users.find_one({"email": req.email.lower()})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or code.")

    otp_hash = hash_sha256(req.otp.strip())
    record = await db.otps.find_one({
        "userId": user["_id"],
        "otpHash": otp_hash,
        "type": "PASSWORD_RESET",
        "isUsed": False,
        "expiresAt": {"$gt": datetime.now(timezone.utc)}
    })
    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code.")

    # Create temporary reset token
    reset_token = secrets.token_hex(32)
    reset_token_hash = hash_sha256(reset_token)
    await db.passwordresets.insert_one({
        "userId": user["_id"],
        "token": reset_token_hash,
        "expiresAt": datetime.now(timezone.utc) + timedelta(minutes=15),
        "createdAt": datetime.now(timezone.utc)
    })
    await db.otps.update_one({"_id": record["_id"]}, {"$set": {"isUsed": True}})

    return {"success": True, "resetToken": reset_token}

@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest, request: Request, _csrf: bool = Depends(verify_csrf)):
    db = get_database()
    user = await db.users.find_one({"email": req.email.lower()})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid request.")

    token_hash = hash_sha256(req.token)
    reset_record = await db.passwordresets.find_one({
        "userId": user["_id"],
        "token": token_hash,
        "expiresAt": {"$gt": datetime.now(timezone.utc)}
    })
    if not reset_record:
        raise HTTPException(status_code=400, detail="Invalid or expired password reset session.")

    new_hash = hash_password(req.newPassword)
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"password": new_hash, "updatedAt": datetime.now(timezone.utc)}}
    )
    await db.passwordresets.delete_many({"userId": user["_id"]})

    # Terminate all active sessions on password reset
    await db.sessions.update_many({"userId": user["_id"]}, {"$set": {"isActive": False}})
    await db.refreshtokens.update_many({"userId": user["_id"]}, {"$set": {"isRevoked": True}})

    await db.auditlogs.insert_one({
        "userId": user["_id"],
        "userEmail": user["email"],
        "action": "PASSWORD_RESET",
        "details": "Password reset completed via email recovery.",
        "ipAddress": get_client_ip(request),
        "userAgent": request.headers.get("user-agent", ""),
        "createdAt": datetime.now(timezone.utc)
    })

    return {"success": True, "message": "Password reset successfully. You may now sign in."}
