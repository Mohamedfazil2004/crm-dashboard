# add_active_status_and_logs.py
from app import create_app
from app.extensions import db
from sqlalchemy import text

def run_migration():
    app = create_app()
    with app.app_context():
        # 1. Add active_status column to tasks table
        try:
            db.session.execute(text("ALTER TABLE tasks ADD COLUMN active_status VARCHAR(20) DEFAULT 'Working'"))
            db.session.commit()
            print("Successfully added active_status column to tasks table.")
        except Exception as e:
            db.session.rollback()
            print(f"Column active_status might already exist or error: {e}")

        # 2. Create task_status_logs table
        try:
            db.session.execute(text("""
                CREATE TABLE IF NOT EXISTS task_status_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    employee_id VARCHAR(20) NOT NULL,
                    task_code VARCHAR(50) NOT NULL,
                    previous_status VARCHAR(50),
                    new_status VARCHAR(50) NOT NULL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """))
            db.session.commit()
            print("Successfully created task_status_logs table.")
        except Exception as e:
            db.session.rollback()
            print(f"Error creating task_status_logs table: {e}")

if __name__ == "__main__":
    run_migration()
