from app.extensions import db
from app.models.employee import Employee


class EmployeeService:

    # ----------------------------------------------------
    # GET ALL EMPLOYEES
    # ----------------------------------------------------
    @staticmethod
    def get_all_employees():
        employees = Employee.query.all()
        return [emp.to_dict() for emp in employees]

    # ----------------------------------------------------
    # GET EMPLOYEES BY TEAM
    # Branding / Website / SEO / Campaign
    # ----------------------------------------------------
    @staticmethod
    def get_by_team(team_name):
        employees = Employee.query.filter_by(team=team_name).all()
        return [emp.to_dict() for emp in employees]

    # ----------------------------------------------------
    # ADD A NEW EMPLOYEE
    # ----------------------------------------------------
    @staticmethod
    def add_employee(data):
        emp_id = data.get("id")

        # Check if ID already exists
        if Employee.query.get(emp_id):
            return {"success": False, "error": "Employee ID already exists"}

        emp = Employee(
            id=emp_id,
            name=data.get("name"),
            role=data.get("role"),
            team=data.get("team")
        )

        db.session.add(emp)
        db.session.commit()

        return {"success": True, "message": "Employee added successfully"}

    # ----------------------------------------------------
    # GET EMPLOYEE BY ID
    # ----------------------------------------------------
    @staticmethod
    def get_by_id(emp_id):
        emp = Employee.query.get(emp_id)
        return emp.to_dict() if emp else None

    # ----------------------------------------------------
    # VALIDATE EMPLOYEE TEAM BEFORE ASSIGNING
    # ----------------------------------------------------
    @staticmethod
    def validate_employee_for_team(emp_id, team_name):
        emp = Employee.query.get(emp_id)

        if not emp:
            return {"success": False, "error": "Employee not found"}

        if emp.team != team_name:
            return {
                "success": False,
                "error": f"Employee belongs to {emp.team}, not {team_name}"
            }

        return {"success": True, "employee": emp}
