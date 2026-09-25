from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class UserModel(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    email: EmailStr
    password: str
    firstName: str
    lastName: str
    role: str = "User"
    isVerified: bool = False
    loginAttempts: int = 0
    lockUntil: Optional[datetime] = None
    mfaEnabled: bool = False
    mfaSecret: Optional[str] = None
    mfaBackupCodes: List[str] = []
    isBlocked: bool = False
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True
