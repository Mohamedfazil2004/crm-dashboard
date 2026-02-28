from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.media_asset import MediaAsset
from app.models.employee import Employee
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.google_drive import get_drive_service, sync_folder
from google_auth_oauthlib.flow import Flow
import os
import json
from datetime import datetime

bp = Blueprint('media', __name__, url_prefix='/api/media')

@bp.route('/assets', methods=['GET'])
@jwt_required()
def get_assets():
    """Fetch all media assets with optional filtering."""
    project = request.args.get('project')
    status = request.args.get('status')
    shoot_day = request.args.get('shoot_day')
    script_type = request.args.get('script_type')
    
    query = MediaAsset.query
    
    if project:
        query = query.filter(MediaAsset.project_name == project)
    if status:
        query = query.filter(MediaAsset.status == status)
    if shoot_day:
        query = query.filter(MediaAsset.shoot_day == shoot_day)
    if script_type:
        query = query.filter(MediaAsset.script_type == script_type)
        
    assets = query.order_by(MediaAsset.created_at.desc()).all()
    return jsonify([asset.to_dict() for asset in assets]), 200

@bp.route('/assets/<int:asset_id>/status', methods=['PATCH'])
@jwt_required()
def update_asset_status(asset_id):
    """Update the status of a media asset (e.g., RAW -> APPROVED)."""
    data = request.json
    new_status = data.get('status')
    
    if new_status not in ['RAW', 'REVIEWED', 'APPROVED']:
        return jsonify({"msg": "Invalid status"}), 400
        
    asset = MediaAsset.query.get_or_404(asset_id)
    asset.status = new_status
    db.session.commit()
    
    return jsonify({"msg": f"Asset status updated to {new_status}", "asset": asset.to_dict()}), 200

@bp.route('/assets/<int:asset_id>/assign', methods=['PATCH'])
@jwt_required()
def assign_reviewer(asset_id):
    """Assign a reviewer to a media asset."""
    data = request.json
    reviewer_id = data.get('reviewer_id')
    
    reviewer = Employee.query.filter_by(id=reviewer_id).first()
    if not reviewer:
        return jsonify({"msg": "Reviewer not found"}), 404
        
    asset = MediaAsset.query.get_or_404(asset_id)
    asset.assigned_reviewer_id = reviewer_id
    db.session.commit()
    
    return jsonify({"msg": f"Asset assigned to {reviewer.name}", "asset": asset.to_dict()}), 200

@bp.route('/assets/<int:asset_id>/project', methods=['PATCH'])
@jwt_required()
def update_asset_project(asset_id):
    """Update the project (client) of a media asset."""
    data = request.json
    project_name = data.get('project_name')
    
    if not project_name:
        return jsonify({"msg": "Project name is required"}), 400
        
    asset = MediaAsset.query.get_or_404(asset_id)
    asset.project_name = project_name
    db.session.commit()
    
    return jsonify({"msg": f"Asset assigned to project {project_name}", "asset": asset.to_dict()}), 200

@bp.route('/assets/<int:asset_id>/script', methods=['PATCH'])
@jwt_required()
def update_asset_script(asset_id):
    """Update the script type of a media asset. Only for Admin/Manager."""
    current_user_id = get_jwt_identity()
    current_user = Employee.query.get(current_user_id)
    
    if not current_user or current_user.role not in ['Admin', 'Manager']:
        return jsonify({"msg": "Forbidden: Only Admins and Managers can update script types"}), 403
        
    data = request.json
    script_type = data.get('script_type')
    
    valid_scripts = ["Social Media", "Service Promotion", "Testimonial", "Educational", "Behind the Scene (BTS)"]
    if script_type and script_type not in valid_scripts:
        return jsonify({"msg": "Invalid script type"}), 400
        
    asset = MediaAsset.query.get_or_404(asset_id)
    asset.script_type = script_type
    db.session.commit()
    
    return jsonify({"msg": f"Asset script updated to {script_type}", "asset": asset.to_dict()}), 200

@bp.route('/assets/bulk-script', methods=['POST'])
@jwt_required()
def bulk_update_script():
    """Bulk update script type. Only for Admin/Manager."""
    current_user_id = get_jwt_identity()
    current_user = Employee.query.get(current_user_id)
    
    if not current_user or current_user.role not in ['Admin', 'Manager']:
        return jsonify({"msg": "Forbidden: Only Admins and Managers can update script types"}), 403
        
    data = request.json
    asset_ids = data.get('asset_ids', [])
    script_type = data.get('script_type')
    
    valid_scripts = ["Social Media", "Service Promotion", "Testimonial", "Educational", "Behind the Scene (BTS)"]
    if script_type and script_type not in valid_scripts:
        return jsonify({"msg": "Invalid script type"}), 400
        
    if not asset_ids:
        return jsonify({"msg": "Asset IDs are required"}), 400
        
    try:
        MediaAsset.query.filter(MediaAsset.id.in_(asset_ids)).update(
            {MediaAsset.script_type: script_type},
            synchronize_session=False
        )
        db.session.commit()
        return jsonify({"msg": f"Successfully assigned {len(asset_ids)} assets to {script_type}"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Bulk update failed: {str(e)}"}), 500

@bp.route('/assets/bulk-assign', methods=['POST'])
@jwt_required()
def bulk_assign_project():
    """Assign multiple assets to a project (client)."""
    data = request.json
    asset_ids = data.get('asset_ids', [])
    project_name = data.get('project_name')
    
    if not asset_ids or not project_name:
        return jsonify({"msg": "Asset IDs and Project Name are required"}), 400
        
    try:
        # Update all matching assets
        MediaAsset.query.filter(MediaAsset.id.in_(asset_ids)).update(
            {MediaAsset.project_name: project_name},
            synchronize_session=False
        )
        db.session.commit()
        return jsonify({"msg": f"Successfully assigned {len(asset_ids)} assets to {project_name}"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Bulk assignment failed: {str(e)}"}), 500

@bp.route('/auth-url', methods=['GET'])
@jwt_required()
def get_auth_url():
    """Generate the Google OAuth URL for the user to authorize."""
    client_config = {
        "web": {
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "project_id": "reach-skyline",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "redirect_uris": ["http://localhost:5000/api/media/oauth-callback"]
        }
    }
    flow = Flow.from_client_config(
        client_config,
        scopes=['https://www.googleapis.com/auth/drive.metadata.readonly', 'https://www.googleapis.com/auth/drive.readonly']
    )
    flow.redirect_uri = "http://localhost:5000/api/media/oauth-callback"
    
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true'
    )
    return jsonify({"auth_url": authorization_url}), 200

@bp.route('/oauth-callback', methods=['GET'])
def oauth_callback():
    """Handle the callback from Google and save the token."""
    code = request.args.get('code')
    if not code:
        return "Authorization failed: No code provided", 400
        
    client_config = {
        "web": {
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "project_id": "reach-skyline",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "redirect_uris": ["http://localhost:5000/api/media/oauth-callback"]
        }
    }
    flow = Flow.from_client_config(
        client_config,
        scopes=['https://www.googleapis.com/auth/drive.metadata.readonly', 'https://www.googleapis.com/auth/drive.readonly']
    )
    flow.redirect_uri = "http://localhost:5000/api/media/oauth-callback"
    
    flow.fetch_token(code=code)
    credentials = flow.credentials
    
    # Save the token
    with open('token.json', 'w') as token_file:
        token_file.write(credentials.to_json())
        
    return "<h1>Authorization Successful!</h1><p>You can close this window and return to the dashboard.</p>", 200

@bp.route('/sync', methods=['POST'])
@jwt_required()
def sync_with_drive():
    """Sync the Media Hub with Google Drive files."""
    service, _ = get_drive_service()
    if not service:
        return jsonify({"msg": "Google Drive not authorized. Please visit /auth-url first."}), 401
    
    folder_id = os.getenv("GOOGLE_DRIVE_FOLDER_ID", "root")
    try:
        drive_files = sync_folder(service, folder_id)
        new_count = 0
        
        for file in drive_files:
            # Check if already exists
            existing = MediaAsset.query.filter_by(drive_file_id=file['id']).first()
            if not existing:
                # Basic parsing of project/day from filename or parent folder logic
                # For now, we assume simple file mapping
                new_asset = MediaAsset(
                    drive_file_id=file['id'],
                    filename=file['name'],
                    mime_type=file['mimeType'],
                    thumbnail_url=file.get('thumbnailLink'),
                    play_url=f"https://drive.google.com/file/d/{file['id']}/preview",
                    project_name="Unassigned",
                    shoot_day=1,
                    meta_data=file.get('videoMediaMetadata', {})
                )
                db.session.add(new_asset)
                new_count += 1
        
        db.session.commit()
        return jsonify({"msg": f"Sync complete. Added {new_count} new assets.", "total_received": len(drive_files)}), 200
    except Exception as e:
        return jsonify({"msg": f"Sync failed: {str(e)}"}), 500

@bp.route('/projects', methods=['GET'])
@jwt_required()
def get_projects():
    """Fetch unique project names for filtering."""
    projects = db.session.query(MediaAsset.project_name).distinct().all()
    return jsonify([p[0] for p in projects if p[0]]), 200
