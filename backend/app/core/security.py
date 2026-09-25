import hashlib
import secrets
import io
import base64
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
import jwt
from passlib.context import CryptContext
import pyotp
import qrcode
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

def hash_sha256(data: str) -> str:
    return hashlib.sha256(data.encode('utf-8')).hexdigest()

def generate_csrf_token() -> str:
    return secrets.token_hex(32)

def generate_otp_code(length: int = 6) -> str:
    return "".join(secrets.choice("0123456789") for _ in range(length))

def create_access_token(user_id: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_ACCESS_EXPIRY_MINUTES)
    to_encode = {
        "id": user_id,
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(to_encode, settings.JWT_ACCESS_SECRET, algorithm="HS256")

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, settings.JWT_ACCESS_SECRET, algorithms=["HS256"])
        return payload
    except jwt.PyJWTError:
        return None

def create_refresh_token() -> str:
    return secrets.token_hex(40)

# MFA / TOTP Utilities
def generate_totp_secret() -> str:
    return pyotp.random_base32()

def get_totp_uri(secret: str, email: str) -> str:
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=email, issuer_name=settings.MFA_APP_NAME)

def generate_qr_code_data_url(uri: str) -> str:
    qr = qrcode.QRCode(version=1, box_size=8, border=2)
    qr.add_data(uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    return f"data:image/png;base64,{b64}"

def verify_totp_code(secret: str, code: str) -> bool:
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=1)

def generate_backup_codes(count: int = 8) -> Dict[str, Any]:
    raw_codes: List[str] = []
    hashed_codes: List[str] = []
    for _ in range(count):
        raw = f"{secrets.token_hex(4)}-{secrets.token_hex(4)}".upper()
        raw_codes.append(raw)
        hashed_codes.append(hash_sha256(raw))
    return {"raw_codes": raw_codes, "hashed_codes": hashed_codes}
