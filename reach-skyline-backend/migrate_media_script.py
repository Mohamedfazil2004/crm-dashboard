from app import create_app
from app.extensions import db
from app.models.media_asset import MediaAsset
import random

def migrate_and_seed_script_type():
    app = create_app()
    with app.app_context():
        # 1. Add column if it doesn't exist (using raw SQL for safer migration if not using Alembic)
        try:
            db.session.execute(db.text("ALTER TABLE media_assets ADD COLUMN script_type VARCHAR(50)"))
            db.session.commit()
            print("Successfully added script_type column.")
        except Exception as e:
            # Column might already exist
            db.session.rollback()
            print(f"Column addition skipped: {e}")

        # 2. Seed existing media assets with random script types
        script_options = [
            "Social Media", 
            "Service Promotion", 
            "Testimonial", 
            "Educational", 
            "Behind the Scene (BTS)"
        ]
        
        assets = MediaAsset.query.all()
        print(f"Found {len(assets)} assets to seed.")
        
        updated_count = 0
        for asset in assets:
            if not asset.script_type or asset.script_type == "Unassigned":
                asset.script_type = random.choice(script_options)
                updated_count += 1
        
        db.session.commit()
        print(f"Randomly assigned script types to {updated_count} assets.")

if __name__ == "__main__":
    migrate_and_seed_script_type()
