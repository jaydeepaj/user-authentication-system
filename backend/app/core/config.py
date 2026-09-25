import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

class Settings(BaseSettings):
    PROJECT_NAME: str = "SecureAuth X"
    VERSION: str = "2.0.0"
    PORT: int = int(os.getenv("PORT", 5000))
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/secureauth-x")
    NODE_ENV: str = os.getenv("NODE_ENV", "development")

    # JWT Secrets
    JWT_ACCESS_SECRET: str = os.getenv("JWT_ACCESS_SECRET", "super_secure_access_secret_key_12938471928347")
    JWT_REFRESH_SECRET: str = os.getenv("JWT_REFRESH_SECRET", "super_secure_refresh_secret_key_98237498237492")
    JWT_ACCESS_EXPIRY_MINUTES: int = 15
    JWT_REFRESH_EXPIRY_DAYS: int = 7

    # Cookies & CSRF
    COOKIE_SECRET: str = os.getenv("COOKIE_SECRET", "cookie_parser_secret_signature_87654321")
    CLIENT_URL: str = os.getenv("CLIENT_URL", "http://localhost:5173")

    # MFA
    MFA_APP_NAME: str = os.getenv("MFA_APP_NAME", "SecureAuthX")

    # Email
    EMAIL_HOST: str = os.getenv("EMAIL_HOST", "smtp.gmail.com")
    EMAIL_PORT: int = int(os.getenv("EMAIL_PORT", 465))
    EMAIL_USER: str = os.getenv("EMAIL_USER", "jdaj9529@gmail.com")
    EMAIL_PASS: str = os.getenv("EMAIL_PASS", "optqcublqxlsgpiv")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "noreply@secureauth-x.com")

settings = Settings()
