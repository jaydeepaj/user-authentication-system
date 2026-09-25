import re

def validate_email(email: str) -> bool:
    pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    return bool(re.match(pattern, email))

def validate_password_strength(password: str) -> dict:
    """
    Validates that password meets enterprise security standards:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    - At least one special character
    """
    has_min_len = len(password) >= 8
    has_upper = bool(re.search(r"[A-Z]", password))
    has_lower = bool(re.search(r"[a-z]", password))
    has_digit = bool(re.search(r"\d", password))
    has_special = bool(re.search(r"[!@#$%^&*(),.?\":{}|<>]", password))

    valid = all([has_min_len, has_upper, has_lower, has_digit, has_special])
    return {
        "isValid": valid,
        "errors": [
            err for cond, err in [
                (has_min_len, "Password must be at least 8 characters long."),
                (has_upper, "Password must contain at least one uppercase letter."),
                (has_lower, "Password must contain at least one lowercase letter."),
                (has_digit, "Password must contain at least one number."),
                (has_special, "Password must contain at least one special character.")
            ] if not cond
        ]
    }
