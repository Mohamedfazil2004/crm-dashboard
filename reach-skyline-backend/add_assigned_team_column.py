import os
from flask import Flask
from app import create_app, db
from sqlalchemy import text

app = create_app()

def add_column():
    with app.app_context():
        # Check if column exists
        try:
            # This is a simple way to check if 'assigned_team' exists by querying it
            db.session.execute(text("SELECT assigned_team FROM clients LIMIT 1"))
            print("Column 'assigned_team' already exists.")
        except Exception:
            # If it fails, add the column
            print("Adding column 'assigned_team' to 'clients' table...")
            try:
                # Assuming MySQL or SQLite
                db.session.execute(text("ALTER TABLE clients ADD COLUMN assigned_team VARCHAR(100)"))
                db.session.commit()
                print("Column added successfully.")
            except Exception as e:
                print(f"Failed to add column: {e}")

if __name__ == "__main__":
    add_column()
