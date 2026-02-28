import os
from app import create_app, db
from sqlalchemy import text

app = create_app()

def add_completed_at_column():
    with app.app_context():
        print("Checking for 'completed_at' column in 'tasks' table...")
        try:
            db.session.execute(text("SELECT completed_at FROM tasks LIMIT 1"))
            print("Column 'completed_at' already exists.")
        except Exception:
            print("Adding column 'completed_at' to 'tasks' table...")
            try:
                db.session.execute(text("ALTER TABLE tasks ADD COLUMN completed_at DATETIME"))
                db.session.commit()
                print("Column added successfully.")
            except Exception as e:
                print(f"Failed to add column: {e}")

if __name__ == "__main__":
    add_completed_at_column()
