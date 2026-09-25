from fastapi import Request, HTTPException, status

async def csrf_protection(request: Request):
    """
    Double-Submit Cookie CSRF Verification Middleware.
    Validates that the x-csrf-token header matches the csrf-token cookie.
    Safe methods (GET, HEAD, OPTIONS) are exempt.
    """
    if request.method in ["GET", "HEAD", "OPTIONS"]:
        return True

    header_token = request.headers.get("x-csrf-token")
    cookie_token = request.cookies.get("csrf-token")

    if not header_token or not cookie_token or header_token != cookie_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token validation failed. Missing or mismatched token."
        )
    return True
