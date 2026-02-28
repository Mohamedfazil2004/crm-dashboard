"""
Update Branding Team Leader Email
This script updates the Branding Team Leader's email from the current address
to the official working email.
"""

from app import create_app
from app.extensions import db
from app.models.employee import Employee

def update_branding_tl_email():
    app = create_app()
    
    with app.app_context():
        # Find the Branding Team Leader
        # Based on actual data dump:
        # ID: TLB001, Role: 'Team Lead', Team: 'Branding'
        branding_tl = Employee.query.filter_by(
            id='TLB001'
        ).first()
        
        # Fallback search if ID changed
        if not branding_tl:
            branding_tl = Employee.query.filter_by(
                role='Team Lead',
                team='Branding'
            ).first()
        
        if branding_tl:
            old_email = branding_tl.email
            new_email = 'microsoftmohamed2004@gmail.com'
            
            print(f"Found: {branding_tl.name} ({branding_tl.id})")
            print(f"Current email: {old_email}")
            print(f"Updating to: {new_email}")
            
            # Update the email
            branding_tl.email = new_email
            
            try:
                db.session.commit()
                print("[SUCCESS] Email updated successfully!")
                print(f"\nVerification:")
                print(f"  ID: {branding_tl.id}")
                print(f"  Name: {branding_tl.name}")
                print(f"  Role: {branding_tl.role}")
                print(f"  Team: {branding_tl.team}")
                print(f"  Email: {branding_tl.email}")
            except Exception as e:
                db.session.rollback()
                print(f"[ERROR] Error updating email: {str(e)}")
        else:
            print("[ERROR] Could not find Branding Team Leader (TLB001 or Role='Team Lead' & Team='Branding')")

if __name__ == "__main__":
    update_branding_tl_email()
