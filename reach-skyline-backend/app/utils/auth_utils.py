# app/utils/auth_utils.py
from flask_jwt_extended import get_jwt
from functools import wraps
from flask import jsonify

def require_roles(*roles):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            claims = get_jwt()
            if claims.get("role") not in roles:
                return jsonify({"error": "Unauthorized"}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper
