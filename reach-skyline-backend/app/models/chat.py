# app/models/chat.py
from app.extensions import db
from datetime import datetime

class Chat(db.Model):
    __tablename__ = "chats"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    task_id = db.Column(db.Integer, db.ForeignKey("tasks.id"), nullable=False)
    emp_id = db.Column(db.String(20), db.ForeignKey("employees.id"), nullable=False)
    team_leader_id = db.Column(db.String(20), db.ForeignKey("employees.id"), nullable=False)
    department = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    messages = db.relationship("ChatMessage", backref="chat", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "task_id": self.task_id,
            "emp_id": self.emp_id,
            "team_leader_id": self.team_leader_id,
            "department": self.department,
            "created_at": self.created_at.isoformat()
        }

class ChatMessage(db.Model):
    __tablename__ = "chat_messages"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    chat_id = db.Column(db.Integer, db.ForeignKey("chats.id"), nullable=True)
    sender_id = db.Column(db.String(20), db.ForeignKey("employees.id"), nullable=False)
    receiver_id = db.Column(db.String(20), db.ForeignKey("employees.id"), nullable=False)
    message_text = db.Column(db.Text, nullable=False) # Changed from 'message' to 'message_text' to match user request
    attachment_path = db.Column(db.String(255), nullable=True) # Changed from 'file_path' to 'attachment_path'
    created_at = db.Column(db.DateTime, default=datetime.utcnow) # Changed from 'timestamp'
    read_status = db.Column(db.Boolean, default=False)
    
    # Task code as fallback/extra metadata
    task_code = db.Column(db.String(50))

    def to_dict(self):
        return {
            "id": self.id,
            "chat_id": self.chat_id,
            "sender_id": self.sender_id,
            "receiver_id": self.receiver_id,
            "message_text": self.message_text,
            "attachment_path": self.attachment_path,
            "created_at": self.created_at.isoformat(),
            "read_status": self.read_status,
            "task_code": self.task_code
        }
