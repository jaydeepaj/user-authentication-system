# SecureAuth X — Security Documentation

## Overview

SecureAuth X is designed from the ground up following **OWASP Top 10** guidelines and enterprise security best practices.

---

## 1. Authentication Security

### 1.1 Password Hashing
- **Algorithm:** bcrypt with adaptive cost factor **12**
- Raw passwords are **never stored or logged**
- Pre-save mongoose hook ensures hashing occurs transparently
- `comparePassword()` uses constant-time comparison via bcrypt

### 1.2 JWT Strategy
- **Access Token:** Short-lived (15 minutes), signed with `JWT_ACCESS_SECRET`
- **Refresh Token:** Long-lived (7 days), signed with `JWT_REFRESH_SECRET`, stored as SHA-256 hash in DB
- Access tokens are sent in response body (stored in memory or localStorage)
- Refresh tokens set via **HTTP-only, Secure, SameSite=Strict** cookie — inaccessible to JavaScript

### 1.3 Refresh Token Rotation
- Each use of a refresh token generates a **new refresh token** (rotation)
- The old token is marked `isUsed = true` in the database
- **Reuse Detection:** If a used/revoked token is presented again, the **entire session is revoked** immediately
- A `CRITICAL` security alert is triggered and logged in the audit trail

### 1.4 Session Management
- Sessions are tracked in MongoDB with IP, user agent, device info, and timestamps
- Sessions can be individually or bulk-terminated by the user or admin
- `isActive: false` invalidates a session server-side immediately

---

## 2. Multi-Factor Authentication (MFA)

### 2.1 TOTP (Time-Based One-Time Password)
- Uses **otplib** (RFC 6238 compliant)
- Secrets generated per-user and stored encrypted in MongoDB (`select: false`)
- Compatible with Google Authenticator, Authy, Microsoft Authenticator
- Verification window allows ±30 seconds clock drift

### 2.2 Backup Codes
- 8 single-use backup codes generated on MFA enrollment
- Stored as **SHA-256 hashes** — raw codes shown once and never stored
- Used codes are immediately removed (burned) from the database

### 2.3 Email OTP Fallback
- 6-digit OTP with 10-minute TTL
- Rate-limited independently
- Auto-expires via MongoDB TTL index on the OTP collection

---

## 3. CSRF Protection

- Double-Submit Cookie pattern implemented
- CSRF token generated using `crypto.randomBytes(32)` — cryptographically secure
- Token set in a readable (non-httpOnly) cookie, read by frontend JS
- Frontend sends token in `x-csrf-token` header with every mutating request
- Server validates header matches cookie value
- All state-changing routes enforce CSRF middleware

---

## 4. Rate Limiting

| Route | Limit | Window |
|-------|-------|--------|
| Auth routes (login, register) | 10 requests | 15 minutes |
| General API routes | 100 requests | 15 minutes |
| Admin routes | 50 requests | 15 minutes |

- Implemented with `express-rate-limit`
- Returns `429 Too Many Requests` with `Retry-After` header
- Rate limit state stored in memory (Redis recommended for production)

---

## 5. Account Lockout

- After **5 consecutive failed login attempts**, the account is locked for **30 minutes**
- Lock is stored in `user.lockUntil` field in MongoDB
- Lockout resets automatically when timer expires or after successful login
- A security alert is triggered on account lockout
- Admin can view and manage locked accounts

---

## 6. Input Validation & Sanitization

### 6.1 Server-Side Validation
- All inputs validated with custom middleware using `validators.js`
- Email format, password complexity, name length checked server-side
- Returns descriptive validation errors with 400 status

### 6.2 MongoDB Injection Protection
- `express-mongo-sanitize` strips any keys containing `$` or `.` from `req.body`, `req.query`, `req.params`
- Prevents NoSQL injection attacks (OWASP A03:2021)

### 6.3 XSS Protection
- Helmet's `X-XSS-Protection` header set
- Input data is not rendered as HTML — React's JSX escaping handles frontend XSS
- Body size limited to `10kb` to prevent payload attacks

---

## 7. Security Headers (Helmet)

The following headers are set on every response:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-XSS-Protection` | `1; mode=block` | Legacy XSS filter |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Force HTTPS |
| `Content-Security-Policy` | Configured | Prevent code injection |
| `Referrer-Policy` | `no-referrer` | Limit referrer leakage |
| `Permissions-Policy` | Restricted | Limit browser APIs |

---

## 8. Audit Logging

Every security-relevant action is recorded in `AuditLog`:
- `REGISTER`, `LOGIN`, `LOGOUT`, `EMAIL_VERIFIED`
- `MFA_ENABLED`, `MFA_DISABLED`, `MFA_LOGIN`
- `PASSWORD_CHANGE`, `PASSWORD_RESET`, `FORGOT_PASSWORD`
- `PROFILE_UPDATE`, `SESSION_REVOCATION`, `ALL_SESSIONS_REVOCATION`
- `ACCOUNT_BLOCKED`, `ACCOUNT_UNBLOCKED`, `ROLE_CHANGE`, `USER_DELETED`
- `ALERT_RESOLVED`, `ADMIN_SESSION_TERMINATE`

Each log record includes: `userId`, `userEmail`, `action`, `details`, `ipAddress`, `userAgent`, `timestamp`

---

## 9. Security Alert System

Alerts are triggered and stored in `SecurityAlert` for:

| Alert Type | Severity | Trigger |
|------------|----------|---------|
| `FAILED_LOGIN` | MEDIUM | 1+ failed password attempts |
| `MFA_FAILED` | HIGH | Failed MFA verification |
| `REFRESH_TOKEN_REUSE` | CRITICAL | Possible token theft detected |
| `ACCOUNT_BLOCKED` | HIGH | Admin blocked account |
| `MFA_DISABLED` | HIGH | User disabled 2FA |
| `FAILED_PASSWORD_CHANGE` | MEDIUM | Wrong current password entered |

---

## 10. Threat Model

### Mitigated Threats

| Threat | Mitigation |
|--------|-----------|
| Credential Stuffing | Rate limiting + account lockout |
| Brute Force | bcrypt slowness + lockout after 5 attempts |
| Session Hijacking | HTTP-only cookies + token rotation + reuse detection |
| Token Theft | Short-lived access tokens (15min) + refresh rotation |
| CSRF | Double-submit cookie pattern |
| XSS | React escaping + Content-Security-Policy |
| NoSQL Injection | express-mongo-sanitize |
| Man-in-the-Middle | HSTS + Secure cookies |
| Clickjacking | X-Frame-Options: DENY |
| Privilege Escalation | Role-based middleware on every admin route |

### Remaining Considerations for Production
- Store rate limit state in **Redis** (not in-memory)
- Enable **MongoDB encryption at rest**
- Use **HSM or AWS KMS** for JWT secret management
- Deploy behind **Nginx TLS termination**
- Implement **IP allowlisting** for admin endpoints
- Set up **real-time alerting** (PagerDuty/Slack) for CRITICAL alerts
- Regular **penetration testing** every 6 months

---

## 11. OWASP Top 10 Compliance

| OWASP Category | Status | Implementation |
|----------------|--------|----------------|
| A01 — Broken Access Control | ✅ | Role middleware, JWT validation |
| A02 — Cryptographic Failures | ✅ | bcrypt, HTTPS, HTTP-only cookies |
| A03 — Injection | ✅ | Mongo sanitize, parameterized queries |
| A04 — Insecure Design | ✅ | Defense in depth, audit logging |
| A05 — Security Misconfiguration | ✅ | Helmet, CORS whitelist, env vars |
| A06 — Vulnerable Components | ⚠️ | Regular `npm audit` recommended |
| A07 — Authentication Failures | ✅ | MFA, lockout, token rotation |
| A08 — Software Integrity Failures | ✅ | Package lock, CI integrity checks |
| A09 — Logging & Monitoring | ✅ | Full audit logs, security alerts |
| A10 — SSRF | ✅ | No external URL fetching from user input |
