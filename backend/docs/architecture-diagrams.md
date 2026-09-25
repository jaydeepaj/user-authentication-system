# SecureAuth X — Architecture Diagrams

The following diagrams illustrate the core architectural and structural components of the SecureAuth X platform.

---

## 1. System Architecture Diagram
High-level overview of the MERN stack components, external integrations, and the reverse proxy.

```mermaid
graph TD
    Client[Web Browser Client] -->|HTTPS / WSS| Nginx[Nginx Reverse Proxy / Load Balancer]
    Nginx -->|Proxy| API[Node.js + Express API]
    Nginx -->|Serve Static| React[React SPA Frontend]
    API -->|Mongoose ODM| DB[(MongoDB)]
    API -->|SMTP| Email[Email Server / SMTP]
    API -.-> Redis[(Redis - Optional for Rate Limiting)]
    
    subgraph Frontend
    React
    end
    
    subgraph Backend Services
    API
    DB
    Redis
    end
```

---

## 2. Authentication Flow (Sequence Diagram)
Demonstrates the secure login process with Multi-Factor Authentication and JWT issuance.

```mermaid
sequenceDiagram
    actor User
    participant Frontend as React Client
    participant Backend as Express API
    participant DB as MongoDB
    
    User->>Frontend: Submit Email & Password
    Frontend->>Backend: POST /api/auth/login
    Backend->>DB: Fetch User (by Email)
    DB-->>Backend: Return User Hash
    Backend->>Backend: Compare bcrypt Hash
    
    alt Invalid Credentials
        Backend-->>Frontend: 401 Unauthorized
        Frontend-->>User: Show Error
    else Valid Credentials
        alt MFA Enabled
            Backend-->>Frontend: 200 OK { requiresMfa: true }
            Frontend-->>User: Prompt for TOTP
            User->>Frontend: Enter TOTP
            Frontend->>Backend: POST /api/auth/mfa/verify
            Backend->>DB: Validate TOTP against Secret
        end
        
        Backend->>Backend: Generate Access JWT & Refresh Token
        Backend->>DB: Save Refresh Token Hash
        Backend-->>Frontend: 200 OK (Access JWT in body, Refresh JWT in HttpOnly Cookie, CSRF Token in Header)
        Frontend-->>User: Redirect to Dashboard
    end
```

---

## 3. Entity-Relationship (ER) Diagram
Overview of the MongoDB collections and their conceptual relationships.

```mermaid
erDiagram
    USER ||--o{ SESSION : has
    USER ||--o{ OTP : generates
    USER ||--o{ SECURITY_ALERT : triggers
    USER ||--o{ AUDIT_LOG : performs
    USER ||--o{ LOGIN_HISTORY : records
    SESSION ||--o{ REFRESH_TOKEN : owns

    USER {
        ObjectId _id PK
        String email UK
        String password
        String role
        Boolean isVerified
        Boolean mfaEnabled
        String mfaSecret
        Date lockUntil
    }

    SESSION {
        ObjectId _id PK
        ObjectId userId FK
        String ipAddress
        String userAgent
        Boolean isActive
    }

    REFRESH_TOKEN {
        ObjectId _id PK
        ObjectId sessionId FK
        String tokenHash
        Boolean isUsed
        Boolean isRevoked
    }

    SECURITY_ALERT {
        ObjectId _id PK
        ObjectId userId FK
        String severity
        String message
        Boolean isResolved
    }
```

---

## 4. Use Case Diagram
Core interactions available to Users and Admins.

```mermaid
usecaseDiagram
    actor User
    actor Admin
    
    User <|-- Admin
    
    rectangle "SecureAuth X System" {
        usecase "Register & Verify Email" as UC1
        usecase "Login & Authenticate" as UC2
        usecase "Manage MFA" as UC3
        usecase "Update Profile" as UC4
        usecase "View Login History" as UC5
        usecase "Terminate Sessions" as UC6
        
        usecase "View Platform Stats" as UC7
        usecase "Manage Users (Block/Delete)" as UC8
        usecase "Resolve Security Alerts" as UC9
        usecase "View Global Audit Logs" as UC10
    }
    
    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    
    Admin --> UC7
    Admin --> UC8
    Admin --> UC9
    Admin --> UC10
```

---

## 5. Deployment Diagram
How the Docker containers are orchestrated in production.

```mermaid
graph TD
    subgraph Host OS [Docker Host - e.g., Ubuntu/AWS EC2]
        subgraph Docker Network [secureauth-network]
            Nginx[secureauth-frontend:80/443]
            API[secureauth-backend:5000]
            Mongo[(secureauth-mongodb:27017)]
            Volume[mongodb_data volume]
        end
    end
    
    Internet((Internet)) -->|HTTPS| Nginx
    Nginx -->|API Requests| API
    API -->|Mongoose| Mongo
    Mongo --- Volume
```

---

## 6. Class Diagram (Backend Services)
High-level view of the service layer separation of concerns.

```mermaid
classDiagram
    class AuthService {
        +register(userData)
        +login(credentials)
        +verifyEmail(otp)
        +refreshToken(cookie)
    }
    class TokenService {
        +generateAccessToken(user)
        +generateRefreshToken(session)
        +verifyToken(token, secret)
        +rotateToken(oldToken)
    }
    class SecurityService {
        +detectThreat(req, user)
        +createAlert(type, severity)
        +handleFailedLogin(user)
    }
    class AuditService {
        +logAction(action, user, details)
        +getLogs(filters)
    }
    
    AuthService ..> TokenService : uses
    AuthService ..> SecurityService : triggers
    AuthService ..> AuditService : logs
```
