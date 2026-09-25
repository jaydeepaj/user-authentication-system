import asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.core.security import hash_password

async def seed():
    print(f"Connecting to MongoDB: {settings.MONGODB_URI}")
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db_name = settings.MONGODB_URI.split("/")[-1].split("?")[0] or "secureauth-x"
    db = client[db_name]

    # Delete existing seed users
    await db.users.delete_many({"email": {"$in": ["admin@secureauth.com", "demo@secureauth.com"]}})

    # Create Admin
    admin_user = {
        "firstName": "Super",
        "lastName": "Admin",
        "email": "admin@secureauth.com",
        "password": hash_password("Admin@SecureAuth123"),
        "role": "Admin",
        "isVerified": True,
        "loginAttempts": 0,
        "mfaEnabled": False,
        "isBlocked": False,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc)
    }
    admin_res = await db.users.insert_one(admin_user)
    print(f"Admin created: admin@secureauth.com (ID: {admin_res.inserted_id})")

    # Create Demo User
    demo_user = {
        "firstName": "Demo",
        "lastName": "User",
        "email": "demo@secureauth.com",
        "password": hash_password("Demo@SecureAuth123"),
        "role": "User",
        "isVerified": True,
        "loginAttempts": 0,
        "mfaEnabled": False,
        "isBlocked": False,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc)
    }
    demo_res = await db.users.insert_one(demo_user)
    print(f"Demo user created: demo@secureauth.com (ID: {demo_res.inserted_id})")

    # Seed an Audit Log
    await db.auditlogs.insert_one({
        "userId": admin_res.inserted_id,
        "userEmail": "admin@secureauth.com",
        "action": "SYSTEM_SEED",
        "details": "Initial seed of admin and demo user accounts completed.",
        "ipAddress": "127.0.0.1",
        "userAgent": "Python Seed Script",
        "createdAt": datetime.now(timezone.utc)
    })

    client.close()
    print("Database seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed())
