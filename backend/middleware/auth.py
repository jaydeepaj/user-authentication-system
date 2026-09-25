from fastapi import Request, HTTPException, status
from app.api.deps import get_current_user

async def protect(request: Request):
    """
    Middleware / Dependency equivalent to Express protect middleware.
    Validates the Bearer access token and attaches the user document to request.state.user.
    """
    user = await get_current_user(request)
    request.state.user = user
    return user
