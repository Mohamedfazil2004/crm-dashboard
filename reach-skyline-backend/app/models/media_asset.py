from app.extensions import db
from datetime import datetime

class MediaAsset(db.Model):
    __tablename__ = "media_assets"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    drive_file_id = db.Column(db.String(255), unique=True, nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    mime_type = db.Column(db.String(100))
    thumbnail_url = db.Column(db.Text)
    play_url = db.Column(db.Text)  # drive.google.com/file/d/[ID]/preview
    project_name = db.Column(db.String(100), index=True)
    shoot_date = db.Column(db.Date)
    shoot_day = db.Column(db.Integer)  # e.g., Day 1, Day 2
    crew_member_id = db.Column(db.String(20), db.ForeignKey("employees.id"), nullable=True)
    status = db.Column(db.Enum('RAW', 'REVIEWED', 'APPROVED', name='media_asset_status'), default='RAW')
    assigned_reviewer_id = db.Column(db.String(20), db.ForeignKey("employees.id"), nullable=True)
    meta_data = db.Column(db.JSON)  # Stores duration, resolution, etc.
    script_type = db.Column(db.String(50), index=True) # Social Media, Service Promotion, Testimonial, Educational, BTS
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    crew_member = db.relationship('Employee', foreign_keys=[crew_member_id], backref='uploaded_assets')
    reviewer = db.relationship('Employee', foreign_keys=[assigned_reviewer_id], backref='reviewed_assets')

    def to_dict(self):
        return {
            "id": self.id,
            "drive_file_id": self.drive_file_id,
            "filename": self.filename,
            "mime_type": self.mime_type,
            "thumbnail_url": self.thumbnail_url,
            "play_url": self.play_url,
            "project_name": self.project_name,
            "shoot_date": self.shoot_date.isoformat() if self.shoot_date else None,
            "shoot_day": self.shoot_day,
            "crew_member": self.crew_member.name if self.crew_member else None,
            "status": self.status,
            "script_type": self.script_type or "Unassigned",
            "assigned_reviewer": self.reviewer.name if self.reviewer else None,
            "meta_data": self.meta_data,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
