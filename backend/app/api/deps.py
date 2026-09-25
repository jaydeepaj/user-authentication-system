from fastapi import Request, HTTPException, status, Depends, Header, Cookie
from typing import Optional, Dict, Any
from bson import ObjectId
from ua_parser import user_agent_parser
from app.core.security import decode_access_token
from app.core.database import get_database

def parse_user_agent(ua_string: str) -> Dict[str, str]:
    if not ua_string:
        return {"browser": "Unknown", "os": "Unknown", "device": "Desktop"}
    parsed = user_agent_parser.Parse(ua_string)
    browser = parsed['user_agent']['family'] or "Browser"
    os_name = parsed['os']['family'] or "OS"
    device = parsed['device']['family'] or "Desktop"
    return {"browser": browser, "os": os_name, "device": device}

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

async def get_current_user(request: Request) -> Dict[str, Any]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization token missing or invalid.")

    token = auth_header.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "id" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired access token.")

    db = get_database()
    user_id = payload["id"]
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user ID format.")

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")

    if user.get("isBlocked", False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account has been blocked by administrator.")

    return user

async def require_admin(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if current_user.get("role") != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: Admin role required.")
    return current_user

async def verify_csrf(
    request: Request,
    x_csrf_token: Optional[str] = Header(None, alias="x-csrf-token"),
):
    if request.method in ["GET", "HEAD", "OPTIONS"]:
        return True

    cookie_csrf = request.cookies.get("csrf-token")
    if not x_csrf_token or not cookie_csrf or x_csrf_token != cookie_csrf:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token missing or mismatch. Request rejected."
        )
    return True
