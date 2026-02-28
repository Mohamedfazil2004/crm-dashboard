from app import create_app
from app.models.employee import Employee

app = create_app()
with app.app_context():
    print("ID | Name | Role | Team | Email")
    print("-" * 50)
    for e in Employee.query.all():
        print(f"{e.id} | {e.name} | {e.role} | {e.team} | {e.email}")
