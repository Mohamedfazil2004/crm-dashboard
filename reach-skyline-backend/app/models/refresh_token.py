# app/models/refresh_token.py
from app.extensions import db
from datetime import datetime, timedelta

class RefreshToken(db.Model):
    __tablename__ = "refresh_tokens"

    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(255), unique=True, nullable=False)
    user_id = db.Column(db.String(20), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)

    @staticmethod
    def generate_expiry(days=7):
        return datetime.utcnow() + timedelta(days=days)
