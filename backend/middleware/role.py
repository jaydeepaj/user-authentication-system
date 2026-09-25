from fastapi import Request, HTTPException, status

def authorize(*allowed_roles):
    """
    Role-Based Access Control Middleware Factory.
    Ensures the authenticated user has one of the required roles.
    """
    async def role_checker(request: Request):
        user = getattr(request.state, "user", None)
        if not user:
            from app.api.deps import get_current_user
            user = await get_current_user(request)
            request.state.user = user

        user_role = user.get("role", "User")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of {allowed_roles} roles."
            )
        return user
    return role_checker
