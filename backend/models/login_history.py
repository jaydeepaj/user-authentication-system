from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class LoginHistoryModel(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    userId: Optional[str] = None
    emailAttempted: str
    ipAddress: str
    userAgent: str
    deviceInfo: Dict[str, Any] = {}
    status: str = "SUCCESS"  # SUCCESS, FAILED, LOCKED
    failureReason: Optional[str] = None
    createdAt: datetime

    class Config:
        populate_by_name = True
