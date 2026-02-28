# app/models/client.py
from app.extensions import db
import json

class Client(db.Model):
    __tablename__ = "clients"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    client_id = db.Column(db.String(10), unique=True, nullable=False)  # e.g., C001
    client_name = db.Column(db.String(100), nullable=False)
    industry = db.Column(db.String(50))
    delivery_date = db.Column(db.Date)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(100))
    total_requested = db.Column(db.Integer, default=0)
    total_completed = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default="Pending")
    assigned_team = db.Column(db.String(100)) # New field to track assignment
    slug = db.Column(db.String(150), unique=True) # Permanent slug for reliable URLs
    requirements_json = db.Column(db.Text)  # JSON stored as text
    activity_codes_json = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

    def to_dict(self):
        return {
            "id": self.id,
            "clientID": self.client_id,
            "clientName": self.client_name,
            "slug": self.slug,
            "industry": self.industry,
            "deliveryDate": str(self.delivery_date) if self.delivery_date else None,
            "phone": self.phone,
            "email": self.email,
            "totalRequestedAmount": self.total_requested,
            "totalCompletedAmount": self.total_completed,
            "totalAmount": self.total_requested, # Align with frontend expected naming
            "status": self.status,
            "assignedTeam": self.assigned_team,
            "requirements": json.loads(self.requirements_json) if self.requirements_json else {},
            "activityCodes": json.loads(self.activity_codes_json) if self.activity_codes_json else {},
            "createdAt": str(self.created_at)
        }
