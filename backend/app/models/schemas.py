from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# Auth Schemas
class RegisterRequest(BaseModel):
    firstName: str = Field(..., min_length=1)
    lastName: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=8)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class VerifyEmailRequest(BaseModel):
    email: EmailStr
    otp: str

class ResendVerificationRequest(BaseModel):
    email: EmailStr

class MfaLoginRequest(BaseModel):
    userId: str
    code: str

class SendMfaOtpRequest(BaseModel):
    userId: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyResetOtpRequest(BaseModel):
    email: EmailStr
    otp: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
    newPassword: str = Field(..., min_length=8)

# User Schemas
class UpdateProfileRequest(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str = Field(..., min_length=8)

class ConfirmMfaRequest(BaseModel):
    code: str

class DeleteAccountRequestOtp(BaseModel):
    password: str

class ConfirmDeleteAccount(BaseModel):
    otp: str

# Admin Schemas
class ChangeRoleRequest(BaseModel):
    role: str = Field(..., pattern="^(User|Admin)$")

class BlockUserRequest(BaseModel):
    isBlocked: bool
