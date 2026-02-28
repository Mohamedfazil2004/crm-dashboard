from flask import Blueprint, jsonify, request
from app.models.task import Task
from app.extensions import db
from app.utils.auth_decorators import team_access_required, get_current_user
from app.models.employee import Employee
from app.services.email_service import send_task_email

bp = Blueprint("seo", __name__, url_prefix="/api/seo")

@bp.route("/tasks", methods=["GET"])
@team_access_required
def get_seo_tasks(authorized_team=None):
    if authorized_team and authorized_team != 'SEO':
        return jsonify({"message": "Access Forbidden: You are not a SEO Team Lead"}), 403

    tasks = Task.query.filter_by(team="SEO").all()
    
    grouped = {}
    for t in tasks:
        cid = t.client_id
        if cid not in grouped:
            grouped[cid] = {
                "client": t.client.client_name if t.client else "Unknown",
                "clientID": cid,
                "team": t.team,
                "count": 0,
                "tasks": [],
                "clientSentAt": t.client_sent_at,
                "deliveryDate": str(t.client.delivery_date) if t.client and t.client.delivery_date else "N/A"
            }
        grouped[cid]["tasks"].append(t.to_dict())
        grouped[cid]["count"] += 1

    results = []
    for g in grouped.values():
        task_list = g["tasks"]
        statuses = [t["status"] for t in task_list]
        assigned_to_list = [t.get("assignedTo") for t in task_list]
        
        # Determine aggregate status
        # Priority: Leave > In Progress > Assigned > Completed > Unassigned
        if any(s == "Leave" for s in statuses):
            g["status"] = "Leave"
        elif all(s == "Completed" for s in statuses):
            g["status"] = "Completed"
        elif any(s == "In Progress" for s in statuses):
            g["status"] = "In Progress"
        elif any(a is not None for a in assigned_to_list):
            g["status"] = "Assigned"
        else:
            g["status"] = "Unassigned"
            
        results.append(g)

    return jsonify(results), 200

@bp.route("/tasks/<int:task_id>/assign", methods=["PUT"])
@team_access_required
def assign_seo(task_id, authorized_team=None):
    if authorized_team and authorized_team != 'SEO':
        return jsonify({"message": "Access Forbidden: You are not a SEO Team Lead"}), 403

    data = request.get_json() or {}
    t = Task.query.get(task_id)
    if not t: return jsonify({"error":"Task not found"}), 404
    
    emp_id = data.get("employee_id")
    
    # Check if reassignment is allowed
    if t.employee_id and t.employee_id != emp_id and t.active_status != "Leave":
        return jsonify({"error": "Cannot reassign a task while current employee is 'Working'. Status must be 'Leave'."}), 403

    is_new_assignment = str(t.employee_id) != str(emp_id) if emp_id else False

    t.employee_id = emp_id
    if data.get("teamSentAt"):
        t.team_sent_at = data.get("teamSentAt")
    db.session.commit()

    if is_new_assignment and emp_id:
        employee = Employee.query.get(emp_id)
        current_tl = get_current_user()
        if employee:
            send_task_email(employee, [t], current_tl)

    return jsonify({"message":"Assigned"}), 200

@bp.route("/assign-bulk", methods=["POST"])
@team_access_required
def assign_seo_bulk(authorized_team=None):
    if authorized_team and authorized_team != 'SEO':
        return jsonify({"message": "Access Forbidden"}), 403

    data = request.get_json() or {}
    task_ids = data.get("task_ids", [])
    emp_id = data.get("employee_id")
    time_stamp = data.get("teamSentAt")

    if not task_ids or not emp_id:
        return jsonify({"message": "Missing task_ids or employee_id"}), 400

    employee = Employee.query.get(emp_id)
    if not employee:
        return jsonify({"message": "Employee not found"}), 404

    tasks_to_notify = []
    for tid in task_ids:
        t = Task.query.get(tid)
        if t:
            is_new = str(t.employee_id) != str(emp_id)
            
            # Skip if currently Working by someone else
            if t.employee_id and is_new and t.active_status != "Leave":
                continue
                
            t.employee_id = emp_id
            if time_stamp:
                t.team_sent_at = time_stamp
            if is_new:
                tasks_to_notify.append(t)

    db.session.commit()

    if tasks_to_notify:
        current_tl = get_current_user()
        send_task_email(employee, tasks_to_notify, current_tl)

    return jsonify({"message": f"Successfully assigned {len(task_ids)} tasks"}), 200
