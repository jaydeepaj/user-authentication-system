from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class AuditLogModel(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    userId: Optional[str] = None
    userEmail: str
    action: str
    details: str
    ipAddress: str
    userAgent: str
    createdAt: datetime

    class Config:
        populate_by_name = True
