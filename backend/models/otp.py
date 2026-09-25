from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class OTPModel(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    userId: str
    otpHash: str
    type: str = "EMAIL_VERIFICATION"
    isUsed: bool = False
    expiresAt: datetime
    createdAt: datetime

    class Config:
        populate_by_name = True
