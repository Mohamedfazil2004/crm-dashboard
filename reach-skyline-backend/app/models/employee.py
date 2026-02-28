# app/models/employee.py
from app.extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import re
from sqlalchemy.orm import validates

class Employee(db.Model):
    __tablename__ = "employees"

    id = db.Column(db.String(20), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(100), nullable=False)
    team = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    team_leader_id = db.Column(db.String(20), db.ForeignKey("employees.id"), nullable=True)
    status = db.Column(db.String(20), default="Active")
    
    # New tracking fields
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.String(20), nullable=True)

    def set_password(self, password):
        """Hashes the password and stores it."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verifies the password against its hash."""
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)

    @validates('email')
    def validate_email(self, key, email):
        if not email:
            raise ValueError("Email address cannot be empty")
        # Same regex as used in email_service.py
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, email):
            raise ValueError(f"Invalid email format: {email}")
        return email

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "role": self.role,
            "team": self.team,
            "email": self.email,
            "team_leader_id": self.team_leader_id,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "created_by": self.created_by
        }
