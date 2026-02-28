from app.extensions import db
from app.models.employee import Employee

def create_default_admin():
    admin_email = "admin@reachskyline.com"

    # Already exists?
    existing = Employee.query.filter_by(email=admin_email).first()
    if existing:
        if existing.role != "Admin":
           existing.role = "Admin"
           db.session.commit()
           print("Updated Admin role to 'Admin'")
        else:
           print("Default admin already exists.")
        return

    admin = Employee(
        id="E000",
        name="Admin User",
        role="Admin",
        team="Management",
        email=admin_email
    )
    admin.set_password("admin123")

    db.session.add(admin)
    db.session.commit()

    print("✔ Default admin created: admin@reachskyline.com / admin123")
