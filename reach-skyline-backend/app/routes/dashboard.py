# app/routes/dashboard.py
from flask import Blueprint, jsonify, request
from app.extensions import db
from app.models.client import Client
from app.utils.auth_decorators import role_required
import json

bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")

# ---------------------------------------------------------
# GET UNASSIGNED TASKS (Dashboard)
# Only Admin and Manager can access
# ---------------------------------------------------------
@bp.route("/tasks", methods=["GET"])
@role_required('Admin', 'Manager')
def get_tasks():
    clients = Client.query.filter_by(status="Pending").all()

    result = []
    for c in clients:
        result.append({
            "id": c.id,
            "clientID": c.client_id,
            "clientName": c.client_name,
            "industry": c.industry,
            "deliveryDate": str(c.delivery_date),
            "phone": c.phone,
            "email": c.email,
            "requirements": json.loads(c.requirements_json or "{}"),
            "activityCodes": json.loads(c.activity_codes_json or "{}")
        })

    return jsonify(result), 200


# ---------------------------------------------------------
# ASSIGN TASK TO TEAMS
# Only Admin and Manager can assign tasks
# ---------------------------------------------------------
@bp.route("/tasks/assign/<int:client_id>", methods=["PUT"])
@role_required('Admin', 'Manager')
def assign_tasks(client_id):
    data = request.get_json()

    client = Client.query.get(client_id)
    if not client:
        return jsonify({"success": False, "message": "Client not found"}), 404

    # Update status
    client.status = "Assigned"

    # Save activity codes (optional)
    if "activityCodes" in data:
        client.activity_codes_json = json.dumps(data["activityCodes"])

    db.session.commit()

    return jsonify({"success": True, "message": "Task assigned"}), 200

