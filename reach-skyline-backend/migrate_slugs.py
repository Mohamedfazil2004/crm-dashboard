import os
from app import create_app, db
from app.models.client import Client
from sqlalchemy import text

app = create_app()

def slugify(name, client_id):
    # Requirement: lowercase, spaces replaced with hyphens, Name + ID
    # abishek-c001
    base = f"{name}-{client_id}"
    return base.lower().strip().replace(' ', '-')

def setup_slugs():
    with app.app_context():
        # 1. Add column if it doesn't exist
        print("Checking for 'slug' column...")
        try:
            db.session.execute(text("SELECT slug FROM clients LIMIT 1"))
            print("Column 'slug' already exists.")
        except Exception:
            print("Adding column 'slug' to 'clients' table...")
            try:
                # Add column
                db.session.execute(text("ALTER TABLE clients ADD COLUMN slug VARCHAR(150) UNIQUE"))
                db.session.commit()
                print("Column added successfully.")
            except Exception as e:
                print(f"Failed to add column: {e}")
                return

        # 2. Populate slugs for existing clients
        clients = Client.query.all()
        print(f"Populating slugs for {len(clients)} clients...")
        for c in clients:
            if not c.slug:
                new_slug = slugify(c.client_name, c.client_id)
                c.slug = new_slug
                print(f"Generated slug for {c.client_name}: {new_slug}")
        
        try:
            db.session.commit()
            print("Finished populating slugs.")
        except Exception as e:
            db.session.rollback()
            print(f"Error committing slugs: {e}")

if __name__ == "__main__":
    setup_slugs()
