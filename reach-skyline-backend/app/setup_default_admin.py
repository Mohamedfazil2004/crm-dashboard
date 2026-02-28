from app.extensions import db
from app.models.employee import Employee

def create_default_admin():
    users_data = [
        # ADMIN
        {"id": "ADM001", "name": "Admin User", "role": "Admin", "team": "Management", "email": "admin@reachskyline.com", "password": "password123"},
        # MANAGER
        {"id": "M001", "name": "Manager User", "role": "Manager", "team": "Management", "email": "manager@reachskyline.com", "password": "password123"},
        # TEAM LEADERS
        {"id": "TLB001", "name": "TL Branding", "role": "Team Lead", "team": "Branding", "email": "tlbranding@reachskyline.com", "password": "password123"},
        {"id": "TLW001", "name": "TL Website", "role": "Team Lead", "team": "Website", "email": "tlwebsite@reachskyline.com", "password": "password123"},
        {"id": "TLS001", "name": "TL SEO", "role": "Team Lead", "team": "SEO", "email": "tlseo@reachskyline.com", "password": "password123"},
        # EMPLOYEES
        {"id": "B001", "name": "Emp Branding", "role": "Employee", "team": "Branding", "email": "empbranding@reachskyline.com", "password": "password123"},
        {"id": "W001", "name": "Emp Website", "role": "Employee", "team": "Website", "email": "empwebsite@reachskyline.com", "password": "password123"},
    ]

    for data in users_data:
        existing = Employee.query.filter((Employee.email == data["email"]) | (Employee.id == data["id"])).first()
        if not existing:
            new_user = Employee(
                id=data["id"],
                name=data["name"],
                role=data["role"],
                team=data["team"],
                email=data["email"]
            )
            new_user.set_password(data["password"])
            db.session.add(new_user)
            print(f"✔ Created {data['role']}: {data['email']}")
    
    db.session.commit()
