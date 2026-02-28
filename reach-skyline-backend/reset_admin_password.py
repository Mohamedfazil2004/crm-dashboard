from app import create_app, db
from app.models.employee import Employee

app = create_app()

with app.app_context():
    admin = Employee.query.filter_by(email="admin@reachskyline.com").first()

    if admin:
        admin.set_password("admin123")
        db.session.commit()
        print("✔ Admin password reset to: admin123")
    else:
        print("Admin does not exist!")
