import os
from app import create_app, db
from sqlalchemy import text

app = create_app()

def add_updated_at_column():
    with app.app_context():
        print("Checking for 'updated_at' column in 'tasks' table...")
        try:
            db.session.execute(text("SELECT updated_at FROM tasks LIMIT 1"))
            print("Column 'updated_at' already exists.")
        except Exception:
            print("Adding column 'updated_at' to 'tasks' table...")
            try:
                # Add column
                db.session.execute(text("ALTER TABLE tasks ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"))
                db.session.commit()
                print("Column added successfully.")
            except Exception as e:
                print(f"Failed to add column: {e}")

if __name__ == "__main__":
    add_updated_at_column()
