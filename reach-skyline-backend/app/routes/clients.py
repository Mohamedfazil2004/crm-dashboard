from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.client import Client
from app.utils.auth_decorators import role_required
import json
from datetime import datetime

bp = Blueprint("clients", __name__, url_prefix="/api/clients")


# -----------------------------
# GET ALL CLIENTS
# Only Admin and Manager can view client list
# -----------------------------
@bp.route("", methods=["GET"])
@role_required('Admin', 'Manager', 'Team Lead')
def get_clients():
    # Only return clients that are NOT Sent or Archived by default
    # Dashboard uses this to show only pending/unassigned tasks
    show_all = request.args.get('all', 'false').lower() == 'true'
    
    if show_all:
        clients = Client.query.all()
    else:
        # Default filtered view for the Dashboard
        clients = Client.query.filter(Client.status != 'Sent', Client.status != 'Archived').all()
        
    result = [c.to_dict() for c in clients]
    return jsonify(result), 200


# -----------------------------
# CREATE CLIENT REQUEST
# Only Admin and Manager can create client requests
# -----------------------------
@bp.route("", methods=["POST"])
@role_required('Admin', 'Manager')
def create_client():
    try:
        data = request.get_json(force=True)

        client_name = data.get("clientName")
        if not client_name:
            return jsonify({"success": False, "message": "clientName required"}), 400

        # Auto-generate client ID
        last = Client.query.order_by(Client.id.desc()).first()
        new_id = f"C{(last.id + 1) if last else 1:03}"

        delivery_date = None
        if data.get("deliveryDate"):
            try:
                delivery_date = datetime.fromisoformat(data["deliveryDate"]).date()
            except:
                pass

        requirements = data.get("requirements") or {}
        # Calculate total requested amount
        total_requested = 0
        for req in requirements.values():
            if isinstance(req, dict):
                total_requested += int(req.get("amount") or req.get("amo") or 0)

        # Generate slug: Name + ID, lowercase, spaces to hyphens
        slug = f"{client_name}-{new_id}".lower().strip().replace(' ', '-')

        client = Client(
            client_id=new_id,
            client_name=client_name,
            slug=slug, # Save permanent slug
            industry=data.get("industry"),
            phone=data.get("phone"),
            email=data.get("email"),
            delivery_date=delivery_date,
            requirements_json=json.dumps(requirements),
            activity_codes_json=json.dumps({}),
            total_requested=total_requested,
            status="Pending"
        )

        db.session.add(client)
        db.session.commit()

        return jsonify({
            "success": True,
            "clientID": new_id,
            "requestID": client.id,
            "slug": slug
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Create client failed: {e}"}), 500


# -----------------------------
# GET CLIENT BY SLUG (NAME)
# Restricted to Admin/Manager
# -----------------------------
@bp.route("/slug/<string:slug>", methods=["GET"])
@role_required('Admin', 'Manager')
def get_client_by_slug(slug):
    from app.models.task import Task
    # Requirement: Match the slug exactly as stored. No lowercase or replacement during lookup.
    client = Client.query.filter_by(slug=slug).first()
    if not client:
        return jsonify({"message": "Client not found"}), 404
    
    client_dict = client.to_dict()
    
    # Calculate scope status for each requirement
    tasks = Task.query.filter_by(client_id=client.client_id).all()
    requirements = client_dict.get('requirements', {})
    
    scope_status = {}
    for service, meta in requirements.items():
        # Check if service is actually active/requested
        is_active = False
        if isinstance(meta, dict):
            is_active = meta.get('checked', False) or int(meta.get('count') or 0) > 0
        
        if is_active:
            # Check tasks for this service. Match by content_type (Service key)
            service_tasks = [t for t in tasks if t.content_type == service]
            if not service_tasks:
                # If requested but no tasks created yet, it's pending/in progress
                scope_status[service] = "In Progress"
            else:
                # Requirement is completed ONLY if all tasks are in a finished state
                is_done = all(t.status in ['Completed', 'Call Completed'] for t in service_tasks)
                scope_status[service] = "Completed" if is_done else "In Progress"
    
    client_dict['scope_status'] = scope_status
    # Include tasks for timeline view in export
    client_dict['tasks'] = [t.to_dict() for t in tasks]

    # Fetch media assets associated with this client
    # Assuming project_name in MediaAsset corresponds to client_name
    from app.models.media_asset import MediaAsset
    media_assets = MediaAsset.query.filter_by(project_name=client.client_name).all()
    client_dict['media_assets'] = [m.to_dict() for m in media_assets]
    
    return jsonify(client_dict), 200


# -----------------------------
# UPDATE CLIENT (Mark as Sent / Update Requirements)
# -----------------------------
@bp.route("/<string:client_id>", methods=["PUT"])
@role_required('Admin', 'Manager')
def update_client(client_id):
    try:
        client = Client.query.filter_by(client_id=client_id).first()
        if not client:
            return jsonify({"success": False, "message": "Client not found"}), 404

        data = request.get_json(force=True)

        # Update requirements if provided
        if "requirements" in data:
            requirements = data["requirements"]
            client.requirements_json = json.dumps(requirements)
            
            # Recalculate total requested amount
            total_requested = 0
            for req in requirements.values():
                if isinstance(req, dict):
                    total_requested += int(req.get("amount") or req.get("amo") or 0)
            client.total_requested = total_requested
        
        # Update status (e.g., 'Sent', 'Archived')
        if "status" in data:
            client.status = data["status"]
            
        # Update assigned team
        if "assignedTeam" in data:
            client.assigned_team = data.get("assignedTeam")

        db.session.commit()

        return jsonify({"success": True, "message": "Client updated successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Update failed: {e}"}), 500

