# app/models/task.py
from app.extensions import db
import json

class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    activity_code = db.Column(db.String(50), unique=True, nullable=False)
    # referencing clients.client_id (unique)
    client_id = db.Column(db.String(10), db.ForeignKey("clients.client_id"), nullable=False)
    team = db.Column(db.String(50), nullable=False)
    employee_id = db.Column(db.String(20), db.ForeignKey("employees.id"))
    status = db.Column(db.String(50), default="Pending")
    content_type = db.Column(db.String(50))
    amount = db.Column(db.Integer)
    minutes = db.Column(db.Integer)
    is_web_work = db.Column(db.Boolean, default=False)
    web_completion_json = db.Column(db.Text)  # JSON: {"Website": true, "SEO": false}
    client_sent_at = db.Column(db.String(50)) # When manager sends to team
    team_sent_at = db.Column(db.String(50))   # When lead sends to employee
    active_status = db.Column(db.String(20), default="Working") # Working / Leave
    
    # Submission Fields (Ensure these are in MySQL)
    submission_link = db.Column(db.String(255))
    manual_attended_calls = db.Column(db.Integer)
    remarks = db.Column(db.Text)
    employee_remark = db.Column(db.Text)
    updated_at = db.Column(db.DateTime, onupdate=db.func.current_timestamp(), default=db.func.current_timestamp())
    completed_at = db.Column(db.DateTime) # Track when task is marked Completed

    # Relationship to Client
    client = db.relationship("Client", backref="tasks")

    def to_dict(self):
        return {
            "id": self.id,
            "activityCode": self.activity_code,
            "clientID": self.client_id,
            "client": self.client.client_name if self.client else "Unknown",
            "clientSlug": self.client.slug if self.client and hasattr(self.client, 'slug') else None,
            "phone": self.client.phone if self.client else "N/A",
            "email": self.client.email if self.client else "N/A",
            "deliveryDate": str(self.client.delivery_date) if self.client and self.client.delivery_date else "N/A",
            "team": self.team,
            "assignedTo": self.employee_id, # Frontend expects assignedTo
            "status": self.status,
            "activeStatus": self.active_status, # Working / Leave
            "activityType": self.content_type, # Frontend expects activityType
            "serviceType": self.content_type,
            "amount": { self.content_type: self.amount } if self.content_type else {}, # Map to object for frontend getTotal
            "minutes": { self.content_type: self.minutes } if self.content_type else {}, # Map to object for frontend getMinutes
            "count": { self.content_type: 1 }, # Default count to 1 for task display
            "isWebWork": self.is_web_work,
            "webCompletionStatus": json.loads(self.web_completion_json) if self.web_completion_json else {},
            "clientSentAt": self.client_sent_at,
            "teamSentAt": self.team_sent_at,
            "submissionLink": self.submission_link,
            "manualAttendedCalls": self.manual_attended_calls,
            "remarks": self.remarks,
            "employeeRemark": self.employee_remark,
            "updatedAt": str(self.updated_at) if self.updated_at else None,
            "completedAt": str(self.completed_at) if self.completed_at else None
        }
