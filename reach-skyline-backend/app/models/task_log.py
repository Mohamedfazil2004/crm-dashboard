# app/models/task_log.py
from app.extensions import db
from datetime import datetime

class TaskStatusLog(db.Model):
    __tablename__ = "task_status_logs"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    employee_id = db.Column(db.String(20), nullable=False)
    task_code = db.Column(db.String(50), nullable=False)
    previous_status = db.Column(db.String(50))
    new_status = db.Column(db.String(50), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "employeeId": self.employee_id,
            "taskCode": self.task_code,
            "previousStatus": self.previous_status,
            "newStatus": self.new_status,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }
