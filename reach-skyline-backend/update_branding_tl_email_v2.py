from app import create_app
from app.extensions import db
from app.models.employee import Employee

app = create_app()
with app.app_context():
    tl = Employee.query.get('TLB001')
    if tl:
        old_email = tl.email
        tl.email = 'microsoftmohamed25@gmail.com'
        db.session.commit()
        print(f"Successfully updated {tl.name} (TLB001) email from {old_email} to {tl.email}")
    else:
        print("Error: Could not find TLB001")
