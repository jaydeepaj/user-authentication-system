# SecureAuth X — API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:5000/api`  
**Authentication:** Bearer JWT (access token in `Authorization` header)

---

## Authentication

All protected routes require:
```
Authorization: Bearer <access_token>
```

Mutating requests (POST/PUT/DELETE) also require the CSRF token:
```
x-csrf-token: <csrf_token>
```

---

## Health Check

### `GET /health`
Returns server operational status.

**Response:**
```json
{
  "success": true,
  "status": "operational",
  "service": "SecureAuth X API",
  "version": "1.0.0",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "environment": "development"
}
```

---

## Auth Module `/api/auth`

### `GET /auth/csrf-token`
Fetch a fresh CSRF token. Call on page load before any mutation.

**Response:**
```json
{ "success": true, "csrfToken": "abc123..." }
```

---

### `POST /auth/register`
Create a new user account. Sends email verification OTP.

**Rate Limit:** 10 req/15min per IP

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecureP@ss123"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Account created. Please check your email for the verification code."
}
```

---

### `POST /auth/verify-email`
Verify email address using 6-digit OTP.

**Request Body:**
```json
{ "email": "john@example.com", "otp": "123456" }
```

**Response `200`:**
```json
{ "success": true, "message": "Email verified successfully. You can now log in." }
```

---

### `POST /auth/resend-verification`
Resend the email verification OTP.

**Request Body:**
```json
{ "email": "john@example.com" }
```

---

### `POST /auth/login`
Authenticate with email and password.

**Request Body:**
```json
{ "email": "john@example.com", "password": "SecureP@ss123" }
```

**Response `200` (standard login):**
```json
{
  "success": true,
  "message": "Login successful.",
  "accessToken": "eyJhbGci...",
  "csrfToken": "token...",
  "user": {
    "id": "...",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "User",
    "mfaEnabled": false
  }
}
```

**Response `200` (MFA required):**
```json
{
  "success": true,
  "requiresMfa": true,
  "userId": "...",
  "message": "Multi-factor authentication required."
}
```

---

### `POST /auth/mfa/verify-login`
Complete MFA step 2 during login.

**Request Body:**
```json
{ "userId": "...", "code": "123456", "method": "TOTP" }
```
> `method`: `"TOTP"` (default) or `"EMAIL_OTP"`

**Response `200`:** Same as standard login response.

---

### `POST /auth/mfa/send-otp`
Send email OTP as MFA fallback.

**Request Body:** `{ "userId": "..." }`

---

### `POST /auth/refresh`
Rotate access token using HTTP-only refresh cookie.

**Response `200`:**
```json
{ "success": true, "accessToken": "eyJhbGci..." }
```

---

### `POST /auth/logout` 🔒
Revoke all sessions and clear cookies.

---

### `POST /auth/forgot-password`
Send password reset email.

**Request Body:** `{ "email": "john@example.com" }`

---

### `POST /auth/reset-password`
Reset password using secure token from email.

**Request Body:**
```json
{ "token": "rawToken...", "password": "NewSecureP@ss123" }
```

---

## User Module `/api/user` 🔒

> All routes require valid access token.

### `GET /user/me`
Get authenticated user's profile.

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "User",
    "isVerified": true,
    "mfaEnabled": false,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

### `PUT /user/me`
Update profile (name fields only).

**Request Body:** `{ "firstName": "Jane", "lastName": "Smith" }`

---

### `PUT /user/change-password`
Change password. Revokes all active sessions.

**Request Body:**
```json
{ "currentPassword": "old...", "newPassword": "New@Secure123" }
```

---

### `POST /user/mfa/setup`
Initiate MFA setup. Returns QR code and manual key.

**Response:**
```json
{
  "success": true,
  "qrCode": "data:image/png;base64,...",
  "manualKey": "JBSWY3DPEHPK3PXP"
}
```

---

### `POST /user/mfa/confirm`
Confirm MFA with TOTP code. Returns one-time backup codes.

**Request Body:** `{ "code": "123456" }`

**Response:**
```json
{
  "success": true,
  "backupCodes": ["A1B2C3", "D4E5F6", ...]
}
```

---

### `DELETE /user/mfa/disable`
Disable MFA. Requires TOTP code or current password.

**Request Body:** `{ "code": "123456" }` or `{ "password": "current..." }`

---

### `GET /user/sessions`
Get all active sessions.

---

### `DELETE /user/sessions/:sessionId`
Terminate a specific session by ID.

---

### `DELETE /user/sessions`
Terminate ALL active sessions (forces logout everywhere).

---

### `GET /user/login-history?page=1&limit=20`
Get paginated login history.

---

### `GET /user/audit-log?page=1&limit=20`
Get paginated audit log for current user.

---

### `GET /user/security-alerts`
Get security alerts (last 50).

---

## Admin Module `/api/admin` 🔒 👑

> All routes require Admin role.

### `GET /admin/stats`
Platform-wide statistics for dashboard.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 150,
    "verifiedUsers": 140,
    "blockedUsers": 2,
    "activeSessions": 25,
    "totalAlerts": 12,
    "criticalAlerts": 1
  }
}
```

---

### `GET /admin/users?page=1&limit=20&search=john&role=User&status=active`
List all users with pagination, search, and filters.

---

### `GET /admin/users/:userId`
Get detailed profile of a specific user.

---

### `PUT /admin/users/:userId/block`
Block or unblock a user.

**Request Body:** `{ "block": true }`

---

### `PUT /admin/users/:userId/role`
Change user role.

**Request Body:** `{ "role": "Admin" }`

---

### `DELETE /admin/users/:userId`
Permanently delete a user and all their data.

---

### `GET /admin/sessions?page=1&limit=30`
List all active sessions across the platform.

---

### `DELETE /admin/sessions/:sessionId`
Force-terminate any session.

---

### `GET /admin/security-alerts?severity=CRITICAL&resolved=false`
List all security alerts with filters.

---

### `PUT /admin/security-alerts/:alertId/resolve`
Mark an alert as resolved.

---

### `GET /admin/audit-logs?page=1&limit=30&action=LOGIN`
Get platform-wide audit logs.

---

### `GET /admin/login-history?page=1&limit=30&status=FAILED`
Get platform-wide login history.

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "message": "Human-readable error message."
}
```

| Status | Meaning |
|--------|---------|
| `400` | Bad Request / Validation Error |
| `401` | Unauthorized / Token invalid |
| `403` | Forbidden / Insufficient permissions |
| `404` | Resource not found |
| `409` | Conflict (e.g., duplicate email) |
| `429` | Too many requests (rate limited) |
| `500` | Internal server error |

---

## Security Headers (Helmet)

All responses include:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`
- `Content-Security-Policy: ...`
