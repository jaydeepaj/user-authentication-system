from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class SecurityAlertModel(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    userId: Optional[str] = None
    alertType: str
    severity: str
    message: str
    ipAddress: str
    isResolved: bool = False
    resolvedAt: Optional[datetime] = None
    resolvedBy: Optional[str] = None
    createdAt: datetime

    class Config:
        populate_by_name = True
