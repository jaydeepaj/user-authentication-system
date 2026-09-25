from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class SessionModel(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    userId: str
    sessionToken: str
    ipAddress: str
    userAgent: str
    deviceInfo: Dict[str, Any] = {}
    isActive: bool = True
    lastActiveAt: datetime
    createdAt: datetime

    class Config:
        populate_by_name = True
