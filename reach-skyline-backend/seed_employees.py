# seed_employees.py
from app import create_app
from app.extensions import db
from app.models.employee import Employee
from werkzeug.security import generate_password_hash

app = create_app()

employees_data = [
    # ADMIN
    {"id": "ADM001", "name": "Admin User", "role": "Admin", "team": "Management", "email": "admin@reachskyline.com", "password": "password123"},
    
    # MANAGER
    {"id": "M001", "name": "Manager User", "role": "Manager", "team": "Management", "email": "manager@reachskyline.com", "password": "password123"},
    
    # TEAM LEADERS
    {"id": "TLB001", "name": "TL Branding", "role": "Team Lead", "team": "Branding", "email": "tlbranding@reachskyline.com", "password": "password123"},
    {"id": "TLW001", "name": "TL Website", "role": "Team Lead", "team": "Website", "email": "tlwebsite@reachskyline.com", "password": "password123"},
    {"id": "TLS001", "name": "TL SEO", "role": "Team Lead", "team": "SEO", "email": "tlseo@reachskyline.com", "password": "password123"},
    {"id": "TLC001", "name": "TL Campaign", "role": "Team Lead", "team": "Campaign", "email": "tlcampaign@reachskyline.com", "password": "password123"},
    {"id": "TLT001", "name": "TL Telecaller", "role": "Team Lead", "team": "Telecaller", "email": "tltelecaller@reachskyline.com", "password": "password123"},
    
    # EMPLOYEES
    {"id": "B001", "name": "Emp Branding", "role": "Employee", "team": "Branding", "email": "empbranding@reachskyline.com", "password": "password123"},
    {"id": "W001", "name": "Emp Website", "role": "Employee", "team": "Website", "email": "empwebsite@reachskyline.com", "password": "password123"},
    {"id": "S001", "name": "Emp SEO", "role": "Employee", "team": "SEO", "email": "empseo@reachskyline.com", "password": "password123"},
    {"id": "C001", "name": "Emp Campaign", "role": "Employee", "team": "Campaign", "email": "empcampaign@reachskyline.com", "password": "password123"},
    {"id": "T001", "name": "Emp Telecaller", "role": "Employee", "team": "Telecaller", "email": "emptelecaller@reachskyline.com", "password": "password123"},
]

with app.app_context():
    print("Ensuring tables exist and seeding employees...")
    db.create_all()  # make sure tables exist

    inserted = 0
    for emp in employees_data:
        # skip if email or id exists
        existing = Employee.query.filter((Employee.email == emp["email"]) | (Employee.id == emp["id"])).first()
        if existing:
            print(f"Skipping existing: {emp['email']} ({emp['id']})")
            continue

        new_emp = Employee(
            id=emp["id"],
            name=emp["name"],
            role=emp["role"],
            team=emp["team"],
            email=emp["email"],
            password_hash=generate_password_hash(emp["password"]),
            status="Active"
        )
        db.session.add(new_emp)
        inserted += 1

    db.session.commit()
    print(f"Seeded {inserted} users into the database.")
