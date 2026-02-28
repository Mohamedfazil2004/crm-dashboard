from app.extensions import db
from app.models.task import Task
from app.models.employee import Employee
from app.models.client import Client
import json
from app.services.email_service import send_task_email
from datetime import datetime



class TaskService:

    # ----------------------------------------------------
    # CREATE NEW TASK
    # ----------------------------------------------------
    @staticmethod
    def create_task(data):
        try:
            task = Task(
                activity_code=data.get("activityCode"),
                client_id=data.get("clientID"),
                team=data.get("team"),
                employee_id=data.get("assignedEmployee"),
                status=data.get("status", "Pending"),
                content_type=data.get("contentType"),
                amount=data.get("amount"),
                minutes=data.get("minutes"),
                is_web_work=data.get("isWebWork", False),
                web_completion_json=json.dumps(data.get("webCompletionStatus", {}))
            )

            db.session.add(task)
            db.session.commit()

            return {"success": True, "message": "Task created successfully"}

        except Exception as e:
            return {"success": False, "error": str(e)}

    # ----------------------------------------------------
    # GET ALL TASKS
    # ----------------------------------------------------
    @staticmethod
    def get_all_tasks():
        tasks = Task.query.all()
        return [t.to_dict() for t in tasks]

    # ----------------------------------------------------
    # GET TASK BY ID
    # ----------------------------------------------------
    @staticmethod
    def get_task_by_id(task_id):
        return Task.query.get(task_id)

    # ----------------------------------------------------
    # UPDATE TASK STATUS
    # ----------------------------------------------------
    @staticmethod
    def update_status(task_id, new_status):
        task = Task.query.get(task_id)

        if not task:
            return {"success": False, "error": "Task not found"}

        task.status = new_status
        db.session.commit()

        return {"success": True, "message": "Status updated"}

   # ----------------------------------------------------
# ASSIGN EMPLOYEE TO TASK
# Ensures the employee belongs to correct team
# ----------------------------------------------------
@staticmethod
def assign_employee(task_id, employee_id):
    task = Task.query.get(task_id)
    emp = Employee.query.get(employee_id)

    if not task:
        return {"success": False, "error": "Task not found"}
    if not emp:
        return {"success": False, "error": "Employee not found"}

    # Validate team match
    if emp.team != task.team:
        return {
            "success": False,
            "error": f"Employee is in {emp.team}, but task requires {task.team}"
        }

    # Assign employee
    task.employee_id = employee_id
    db.session.commit()

    # 🔥 Send email to employee (backend only)
    send_task_email(employee=emp, tasks=[task], team_leader=None)

    return {"success": True, "message": "Employee assigned and email sent"}


    # ----------------------------------------------------
    # MARK WEB-WORK STEP COMPLETE
    # Website → SEO → Branding
    # ----------------------------------------------------
    @staticmethod
    def mark_web_step(task_id, team_name):
        task = Task.query.get(task_id)

        if not task:
            return {"success": False, "error": "Task not found"}

        if not task.is_web_work:
            return {"success": False, "error": "This is not a web-work task"}

        # Load or initialize web progress JSON
        progress = json.loads(task.web_completion_json) if task.web_completion_json else {}

        # Mark step as completed
        progress[team_name] = True

        task.web_completion_json = json.dumps(progress)
        db.session.commit()

        return {"success": True, "message": f"{team_name} step completed"}

    # ----------------------------------------------------
    # GET TASKS BY TEAM
    # ----------------------------------------------------
    @staticmethod
    def get_tasks_by_team(team_name):
        tasks = Task.query.filter_by(team=team_name).all()
        return [t.to_dict() for t in tasks]

    # ----------------------------------------------------
    # GET TASKS BY STATUS
    # ----------------------------------------------------
    @staticmethod
    def get_tasks_by_status(status):
        tasks = Task.query.filter_by(status=status).all()
        return [t.to_dict() for t in tasks]
