from flask import Blueprint, request, jsonify, send_from_directory, current_app
from app.extensions import db
from app.models.task import Task
from app.models.employee import Employee
from app.utils.auth_decorators import role_required
from flask_jwt_extended import jwt_required, get_jwt_identity
import json
import os
import uuid
from werkzeug.utils import secure_filename
from app.models.task_log import TaskStatusLog
from app.services.email_service import send_leave_notification_email


bp = Blueprint("tasks", __name__, url_prefix="/api/tasks")

@bp.route("", methods=["POST"])
@role_required('Admin', 'Manager')
def create_task():
    try:
        data = request.get_json(force=True)
        
        # In a batch send, we might receive multiple tasks or one by one
        # Frontend is currently iterate and send, so let's handle single task for now
        
        activity_code = data.get("activityCode")
        client_id = data.get("clientID")
        team = data.get("team")
        
        if not activity_code or not client_id or not team:
            return jsonify({"success": False, "message": "Missing required fields"}), 400

        # Check if task already exists (optional, depends on requirements)
        existing = Task.query.filter_by(activity_code=activity_code).first()
        if existing:
            # Maybe update or ignore? Let's just create if it doesn't exist
            # but activity_code is unique in model, so we must handle it
            pass

        task = Task(
            activity_code=activity_code,
            client_id=client_id,
            team=team,
            status=data.get("status", "Pending"),
            content_type=data.get("serviceType"),
            amount=data.get("amount", 0),
            minutes=data.get("minutes", 0),
            is_web_work=data.get("isWebWork", False),
            web_completion_json=json.dumps(data.get("webCompletionStatus") or {}),
            client_sent_at=data.get("clientSentAt")
        )

        db.session.add(task)
        db.session.commit()

        return jsonify({"success": True, "message": "Task created successfully", "taskID": task.id}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Create task failed: {e}"}), 500

@bp.route("/<int:task_id>", methods=["PATCH"])
@jwt_required()
def update_task(task_id):
    current_user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"message": "Task not found"}), 404
        
    # Authorization: Only the assigned employee or management can update
    is_assigned = task.employee_id == current_user_id
    current_user = Employee.query.get(current_user_id)
    is_management = current_user and current_user.role in ['Admin', 'Manager', 'Team Lead']
    
    if not (is_assigned or is_management):
        return jsonify({"message": "Access Forbidden"}), 403
        
    # Fields allowed to be updated by employee
    if 'status' in data:
        new_status = data['status']
        # If transitioning to Completed, set completed_at
        if new_status in ['Completed', 'Call Completed', 'Done'] and task.status not in ['Completed', 'Call Completed', 'Done']:
            from datetime import datetime
            task.completed_at = datetime.now()
        task.status = new_status
    if 'submissionLink' in data:
        task.submission_link = data['submissionLink'] # Note: use submission_link in DB
    if 'manualAttendedCalls' in data:
        task.manual_attended_calls = data['manualAttendedCalls']
    if 'remarks' in data:
        task.remarks = data['remarks']
    if 'employeeRemark' in data:
        task.employee_remark = data['employeeRemark']
        
    db.session.commit()
    return jsonify({"message": "Task updated successfully", "task": task.to_dict()}), 200

@bp.route("/<int:task_id>/active-status", methods=["PATCH"])
@jwt_required()
def update_active_status(task_id):
    current_user_id = get_jwt_identity()
    data = request.get_json() or {}
    new_active_status = data.get("activeStatus") # "Working" or "Leave"

    if new_active_status not in ["Working", "Leave"]:
        return jsonify({"message": "Invalid status"}), 400

    task = Task.query.get(task_id)
    if not task:
        return jsonify({"message": "Task not found"}), 404

    # Only assigned employee can change their status
    if task.employee_id != current_user_id:
        return jsonify({"message": "Forbidden: You are not assigned to this task"}), 403

    previous_active_status = task.active_status
    if previous_active_status == new_active_status:
        return jsonify({"message": "Status already set", "task": task.to_dict()}), 200

    # Log the change
    log = TaskStatusLog(
        employee_id=current_user_id,
        task_code=task.activity_code,
        previous_status=previous_active_status,
        new_status=new_active_status
    )
    db.session.add(log)

    # Update task
    task.active_status = new_active_status
    email_result = None
    
    # If Leave, update task status to "Leave"
    if new_active_status == "Leave":
        task.status = "Leave"
        # Send Email with validation
        employee = Employee.query.get(current_user_id)
        email_result = send_leave_notification_email(employee, task)
        
        # Commit changes even if email fails
        db.session.commit()
        
        # Return response based on email result
        if email_result and email_result.get("success"):
            return jsonify({
                "message": "Active status updated and notification sent",
                "task": task.to_dict(),
                "email_sent": True
            }), 200
        else:
            # Status updated but email failed
            error_message = email_result.get("message") if email_result else "Email delivery failed"
            return jsonify({
                "message": "Leave recorded but email delivery failed",
                "task": task.to_dict(),
                "email_sent": False,
                "email_error": error_message,
                "warning": True
            }), 200
            
    elif new_active_status == "Working" and previous_active_status == "Leave":
        # When returning from Leave to Working, revert status to Pending (shows as "Assigned")
        task.status = "Pending"

    db.session.commit()
    return jsonify({"message": "Active status updated", "task": task.to_dict(), "email_sent": False}), 200

@bp.route("/<int:task_id>/upload", methods=["POST"])
@jwt_required()
def upload_task_file(task_id):
    current_user_id = get_jwt_identity()
    task = Task.query.get(task_id)
    
    if not task:
        return jsonify({"message": "Task not found"}), 404
        
    if task.employee_id != current_user_id:
        return jsonify({"message": "Forbidden: You are not assigned to this task"}), 403
        
    if 'file' not in request.files:
        return jsonify({"message": "No file part"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"message": "No selected file"}), 400
        
    if file:
        filename = secure_filename(file.filename)
        # Generate unique filename: task_id-employee_id-client_id-uuid-filename
        ext = os.path.splitext(filename)[1]
        unique_name = f"{task.id}_{task.employee_id}_{task.client_id}_{uuid.uuid4().hex}{ext}"
        
        upload_folder = current_app.config['UPLOAD_FOLDER']
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
            
        filepath = os.path.join(upload_folder, unique_name)
        file.save(filepath)
        
        # Link is the relative URL to the file
        file_url = f"/api/tasks/uploads/{unique_name}"
        task.submission_link = file_url
        db.session.commit()
        
        return jsonify({"message": "File uploaded successfully", "link": file_url, "task": task.to_dict()}), 200

@bp.route("/uploads/<string:filename>", methods=["GET"])
def serve_upload(filename):
    # This serves files from the uploads folder
    upload_folder = current_app.config['UPLOAD_FOLDER']
    return send_from_directory(upload_folder, filename)

@bp.route("", methods=["GET"])
@jwt_required()
def get_tasks():
    employee_id = request.args.get('employee_id')
    team = request.args.get('team')
    group_by_client = request.args.get('group_by_client') == 'true'
    
    query = Task.query
    if employee_id:
        query = query.filter_by(employee_id=employee_id)
    if team:
        query = query.filter_by(team=team)
    
    tasks = query.all()
    from datetime import datetime
    today_str = datetime.now().strftime('%Y-%m-%d')
    
    if group_by_client:
        grouped = {}
        for t in tasks:
            cid = t.client_id
            if cid not in grouped:
                grouped[cid] = {
                    "client": t.client.client_name if t.client else "Unknown",
                    "clientID": cid,
                    "clientSlug": t.client.slug if t.client and hasattr(t.client, 'slug') else None,
                    "tasks": [],
                    "count": 0,
                    "teamSentAt": t.team_sent_at,
                    "deliveryDate": str(t.client.delivery_date) if t.client and t.client.delivery_date else "N/A",
                    "isToday": False
                }
            task_dict = t.to_dict()
            sent_date = t.team_sent_at.split(' | ')[0] if t.team_sent_at else ""
            task_dict["isToday"] = (sent_date == today_str)
            
            grouped[cid]["tasks"].append(task_dict)
            grouped[cid]["count"] += 1
            if task_dict["isToday"]:
                grouped[cid]["isToday"] = True
            
        results = []
        for g in grouped.values():
            # Status: Completed only if all tasks are finished
            all_completed = all(tk["status"] in ["Completed", "Call Completed", "Done"] for tk in g["tasks"])
            g["status"] = "Completed" if g["tasks"] and all_completed else "In Progress"
            
            # Representative activity type for display
            if g["tasks"]:
                g["activityType"] = g["tasks"][0].get("activityType", "N/A")
                if len(g["tasks"]) > 1:
                    types = set(tk.get("activityType") for tk in g["tasks"] if tk.get("activityType"))
                    if len(types) > 1:
                        g["activityType"] = "Multiple"
            
            results.append(g)
        return jsonify(results), 200

    results = []
    for t in tasks:
        td = t.to_dict()
        sent_date = t.team_sent_at.split(' | ')[0] if t.team_sent_at else ""
        td["isToday"] = (sent_date == today_str)
        results.append(td)
    return jsonify(results), 200

@bp.route("/bulk", methods=["POST"])
@role_required('Admin', 'Manager')
def create_tasks_bulk():
    try:
        tasks_data = request.get_json(force=True)
        if not isinstance(tasks_data, list):
            return jsonify({"success": False, "message": "Expected a list of tasks"}), 400
        
        created_tasks = []
        for data in tasks_data:
            activity_code = data.get("activityCode")
            
            # IMPROVEMENT: If activityCode is "PENDING" or missing, generate a unique one
            if not activity_code or activity_code == "PENDING":
                last_task = Task.query.order_by(Task.id.desc()).first()
                next_id = (last_task.id + 1) if last_task else 1
                activity_code = f"ACT-{next_id:04}"

            # Check if this activity_code already exists to avoid Unique Constraint violation
            existing = Task.query.filter_by(activity_code=activity_code).first()
            if existing:
                # If it already exists, increment until unique
                count = 1
                base_code = activity_code
                while Task.query.filter_by(activity_code=activity_code).first():
                    activity_code = f"{base_code}-{count}"
                    count += 1

            task = Task(
                activity_code=activity_code,
                client_id=data.get("clientID"),
                team=data.get("team"),
                status=data.get("status", "Pending"),
                content_type=data.get("serviceType"),
                amount=data.get("amount", 0),
                minutes=data.get("minutes", 0),
                is_web_work=data.get("isWebWork", False),
                web_completion_json=json.dumps(data.get("webCompletionStatus") or {}),
                client_sent_at=data.get("clientSentAt")
            )
            db.session.add(task)
            created_tasks.append(task)
            
        db.session.commit()
        return jsonify({"success": True, "count": len(created_tasks)}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Bulk creation failed: {str(e)}"}), 500
