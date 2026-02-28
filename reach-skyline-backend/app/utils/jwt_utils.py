import jwt
import uuid
from datetime import datetime, timedelta
from flask import current_app

ALGORITHM = "HS256"

def _get_secret():
    # Use SECRET_KEY from config for JWT signing. You may prefer a separate JWT_SECRET.
    return current_app.config.get("SECRET_KEY")

def generate_access_token(identity: dict, minutes: int = 15):
    """
    identity: dict with at least {'employee_id': 'B001', 'email': 'b001@dummy.com', 'team': 'Branding'}
    """
    now = datetime.utcnow()
    jti = str(uuid.uuid4())
    payload = {
        "jti": jti,
        "sub": identity.get("employee_id"),
        "email": identity.get("email"),
        "team": identity.get("team"),
        "iat": now,
        "nbf": now,
        "exp": now + timedelta(minutes=minutes),
        "type": "access",
    }
    token = jwt.encode(payload, _get_secret(), algorithm=ALGORITHM)
    return token, jti

def generate_refresh_token(identity: dict, days: int = 30):
    now = datetime.utcnow()
    jti = str(uuid.uuid4())
    payload = {
        "jti": jti,
        "sub": identity.get("employee_id"),
        "email": identity.get("email"),
        "iat": now,
        "nbf": now,
        "exp": now + timedelta(days=days),
        "type": "refresh",
    }
    token = jwt.encode(payload, _get_secret(), algorithm=ALGORITHM)
    return token, jti

def decode_token(token: str, verify_exp: bool = True):
    options = {"verify_exp": verify_exp}
    return jwt.decode(token, _get_secret(), algorithms=[ALGORITHM], options=options)
