from app import create_app
from app.models.employee import Employee

app = create_app()
with app.app_context():
    emps = Employee.query.all()
    print(f"Total employees: {len(emps)}")
    for e in emps:
        print(f"ID: {e.id}, Name: {e.name}, Role: {e.role}, Team: {e.team}")
