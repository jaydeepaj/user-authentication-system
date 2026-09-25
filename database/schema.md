# SecureAuth X — Database Schema

**Database:** MongoDB  
**ODM:** Mongoose  
**Connection:** `MONGODB_URI` environment variable

---

## Collections

### `users`
Core user account data.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Auto-generated primary key |
| `email` | String (unique, indexed) | User's email address (lowercase) |
| `password` | String (select: false) | bcrypt hashed password |
| `firstName` | String | User's first name |
| `lastName` | String | User's last name |
| `role` | String (enum: User/Admin) | Account role, default: "User" |
| `isVerified` | Boolean | Email verified flag, default: false |
| `loginAttempts` | Number | Failed login counter |
| `lockUntil` | Date | Account lock expiry timestamp |
| `mfaEnabled` | Boolean | MFA enabled flag |
| `mfaSecret` | String (select: false) | TOTP secret key |
| `mfaBackupCodes` | [String] (select: false) | SHA-256 hashed backup codes |
| `isBlocked` | Boolean | Admin-blocked flag |
| `createdAt` | Date | Auto-managed by timestamps |
| `updatedAt` | Date | Auto-managed by timestamps |

**Virtuals:** `fullName`, `isLocked`  
**Indexes:** `email` (unique)

---

### `sessions`
Active login sessions per user.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Session ID |
| `userId` | ObjectId (ref: User) | Owning user |
| `sessionToken` | String | SHA-256 session identifier |
| `ipAddress` | String | Client IP address |
| `userAgent` | String | Raw User-Agent header |
| `deviceInfo` | Object | `{ browser, os, device }` parsed from UA |
| `isActive` | Boolean | Active flag (false = terminated) |
| `lastActiveAt` | Date | Last activity timestamp |
| `createdAt` | Date | Session start time |

**Indexes:** `userId`, `isActive`

---

### `refreshtokens`
Hashed refresh tokens linked to sessions.

| Field | Type | Description |
|-------|------|-------------|
| `userId` | ObjectId (ref: User) | Owning user |
| `tokenHash` | String | SHA-256 hash of the refresh token |
| `sessionId` | ObjectId (ref: Session) | Associated session |
| `isUsed` | Boolean | Marks token as consumed |
| `isRevoked` | Boolean | Marks token as revoked |
| `expiresAt` | Date | Token expiry (7 days) |
| `createdAt` | Date | Auto timestamp |

---

### `otps`
One-time passwords for email verification and MFA.

| Field | Type | Description |
|-------|------|-------------|
| `userId` | ObjectId (ref: User) | Owning user |
| `otpHash` | String | SHA-256 hashed OTP |
| `type` | String (enum) | `EMAIL_VERIFICATION` or `MFA_OTP` |
| `expiresAt` | Date | Expiry (10 minutes default) |
| `isUsed` | Boolean | Consumed flag |
| `createdAt` | Date | Auto timestamp (TTL indexed) |

**TTL Index:** `expiresAt` — documents auto-deleted after expiry

---

### `loginhistories`
Complete login attempt log.

| Field | Type | Description |
|-------|------|-------------|
| `userId` | ObjectId (ref: User, optional) | Null for non-existent email attempts |
| `emailAttempted` | String | Email used in the login attempt |
| `ipAddress` | String | Client IP |
| `userAgent` | String | Raw User-Agent |
| `deviceInfo` | Object | `{ browser, os, device }` |
| `status` | String (enum) | `SUCCESS`, `FAILED`, `LOCKED` |
| `failureReason` | String | Human-readable failure description |
| `createdAt` | Date | Timestamp |

---

### `auditlogs`
Immutable security action audit trail.

| Field | Type | Description |
|-------|------|-------------|
| `userId` | ObjectId (ref: User) | Acting user |
| `userEmail` | String | Snapshot of email at time of action |
| `action` | String | Action code (see Security Docs) |
| `details` | String | Human-readable description |
| `ipAddress` | String | Client IP |
| `userAgent` | String | User-Agent |
| `createdAt` | Date | Timestamp |

---

### `securityalerts`
Security alerts triggered by suspicious activity.

| Field | Type | Description |
|-------|------|-------------|
| `userId` | ObjectId (ref: User) | Affected user |
| `alertType` | String | e.g., `FAILED_LOGIN`, `REFRESH_TOKEN_REUSE` |
| `severity` | String (enum) | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `message` | String | Alert description |
| `ipAddress` | String | Source IP |
| `isResolved` | Boolean | Resolution status |
| `resolvedAt` | Date | When resolved |
| `resolvedBy` | ObjectId (ref: User) | Admin who resolved |
| `createdAt` | Date | Timestamp |

---

### `passwordresets`
Password reset tokens (single-use, 15-minute TTL).

| Field | Type | Description |
|-------|------|-------------|
| `userId` | ObjectId (ref: User) | Owning user |
| `token` | String | SHA-256 hash of raw reset token |
| `expiresAt` | Date | 15 minutes from creation |
| `createdAt` | Date | Auto timestamp |

---

### `roles`
(Optional) Extended role definitions for RBAC expansion.

| Field | Type | Description |
|-------|------|-------------|
| `name` | String (unique) | Role name |
| `permissions` | [String] | List of permission strings |
| `createdAt` | Date | Auto timestamp |

---

## ER Diagram (Textual)

```
User (1) ──────── (N) Session
User (1) ──────── (N) RefreshToken
User (1) ──────── (N) OTP
User (1) ──────── (N) LoginHistory
User (1) ──────── (N) AuditLog
User (1) ──────── (N) SecurityAlert
User (1) ──────── (1) PasswordReset

Session (1) ───── (N) RefreshToken
```

---

## Index Strategy

| Collection | Index | Type |
|------------|-------|------|
| users | email | Unique |
| sessions | userId | Regular |
| refreshtokens | tokenHash | Regular |
| otps | expiresAt | TTL |
| loginhistories | userId | Regular |
| auditlogs | userId, action | Compound |
| securityalerts | userId, severity, isResolved | Compound |
