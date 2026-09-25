from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class RefreshTokenModel(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    userId: str
    sessionId: str
    tokenHash: str
    isUsed: bool = False
    isRevoked: bool = False
    expiresAt: datetime
    createdAt: datetime

    class Config:
        populate_by_name = True
