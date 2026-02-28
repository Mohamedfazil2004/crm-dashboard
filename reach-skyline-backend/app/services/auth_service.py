from app.extensions import db
from app.models.employee import Employee
from app.models.refresh_token import RefreshToken
from werkzeug.security import check_password_hash
from app.utils.jwt_utils import generate_access_token, generate_refresh_token, decode_token
from datetime import datetime
import json

class AuthService:

    @staticmethod
    def authenticate(email: str, password: str):
        user = Employee.query.filter_by(email=email).first()
        if not user:
            return {"success": False, "error": "Invalid credentials"}, 401

        if not check_password_hash(user.password_hash, password):
            return {"success": False, "error": "Invalid credentials"}, 401

        # Identity payload
        identity = {
            "employee_id": user.id,
            "email": user.email,
            "team": user.team
        }

        access_token, access_jti = generate_access_token(identity)
        refresh_token, refresh_jti = generate_refresh_token(identity)

        # Store refresh token in DB
        expires_at = datetime.utcnow() + (datetime.utcnow() - datetime.utcnow())  # placeholder
        # Instead compute from decoded refresh token
        decoded = decode_token(refresh_token)
        expires_at = datetime.utcfromtimestamp(decoded["exp"])

        rt = RefreshToken(
            token=refresh_token,
            jti=refresh_jti,
            employee_id=user.id,
            revoked=False,
            expires_at=expires_at
        )
        db.session.add(rt)
        db.session.commit()

        return {
            "success": True,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "employee": user.to_dict()
        }, 200

    @staticmethod
    def refresh(refresh_token: str):
        try:
            decoded = decode_token(refresh_token)
        except Exception as e:
            return {"success": False, "error": "Invalid refresh token"}, 401

        jti = decoded.get("jti")
        sub = decoded.get("sub")
        rt = RefreshToken.query.filter_by(jti=jti, token=refresh_token, employee_id=sub, revoked=False).first()

        if not rt:
            return {"success": False, "error": "Refresh token not recognized"}, 401

        if rt.is_expired():
            return {"success": False, "error": "Refresh token expired"}, 401

        # Load user
        user = Employee.query.get(sub)
        if not user:
            return {"success": False, "error": "User not found"}, 404

        identity = {"employee_id": user.id, "email": user.email, "team": user.team}
        access_token, access_jti = generate_access_token(identity)
        # Optionally rotate refresh token:
        refresh_token_new, refresh_jti_new = generate_refresh_token(identity)

        # revoke old token (or mark it used)
        rt.revoked = True

        # store new refresh token
        expires_at = datetime.utcfromtimestamp(decode_token(refresh_token_new)["exp"])
        new_rt = RefreshToken(token=refresh_token_new, jti=refresh_jti_new, employee_id=user.id, revoked=False, expires_at=expires_at)
        db.session.add(new_rt)
        db.session.commit()

        return {"success": True, "access_token": access_token, "refresh_token": refresh_token_new}, 200

    @staticmethod
    def logout(refresh_token: str):
        try:
            decoded = decode_token(refresh_token, verify_exp=False)
        except Exception:
            return {"success": False, "error": "Invalid token"}, 400

        jti = decoded.get("jti")
        rt = RefreshToken.query.filter_by(jti=jti, token=refresh_token).first()
        if not rt:
            return {"success": False, "error": "Token not found"}, 404

        rt.revoked = True
        db.session.commit()
        return {"success": True, "message": "Logged out"}, 200
