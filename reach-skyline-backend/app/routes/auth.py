from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.employee import Employee
from flask_jwt_extended import (
    create_access_token, 
    create_refresh_token,
    jwt_required,
    get_jwt_identity
)
from datetime import timedelta

bp = Blueprint("auth", __name__, url_prefix="/api/auth")

# ----------------------------
# LOGIN
# ----------------------------
@bp.route("/login", methods=["POST"])
def login():
    """
    Login endpoint - validates credentials and returns JWT tokens
    Supports all roles: Admin, Manager, Team Lead, Employee
    """
    try:
        data = request.get_json()
        if not data:
            print("[LOGIN] No JSON data received")
            return jsonify({"message": "Invalid request"}), 400

        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        
        print(f"[LOGIN] Attempting login for email: {email}")

        if not email or not password:
            print("[LOGIN] Missing email or password")
            return jsonify({"message": "Email and password are required"}), 400

        # Find user by email (case-insensitive search)
        user = Employee.query.filter(db.func.lower(Employee.email) == email).first()

        # Verify user exists
        if not user:
            print(f"[LOGIN] User not found: {email}")
            return jsonify({"message": "Invalid email or password"}), 401
        
        # Verify status is Active
        if user.status != "Active":
            print(f"[LOGIN] User inactive: {email}")
            return jsonify({"message": "Your account is inactive. Please contact your manager."}), 403

        # Verify password is correct using werkzeug
        if not user.check_password(password):
            print(f"[LOGIN] Invalid password for: {email}")
            return jsonify({"message": "Invalid email or password"}), 401

        # Create JWT tokens
        # Note: Authorization (RBAC) is enforced at the route level via decorators,
        # login only authenticates identity.
        access_token = create_access_token(
            identity=user.id,
            additional_claims={
                "role": user.role,
                "team": user.team,
                "name": user.name
            },
            expires_delta=timedelta(hours=8)
        )
        
        refresh_token = create_refresh_token(
            identity=user.id,
            expires_delta=timedelta(days=7)
        )

        print(f"[LOGIN] Success for: {email}, role: {user.role}")
        return jsonify({
            "message": "Login successful",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": user.to_dict()
        }), 200
    except Exception as e:
        print(f"[LOGIN ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": f"Server error: {str(e)}"}), 500


# ----------------------------
# REFRESH TOKEN
# ----------------------------
@bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """
    Refresh endpoint - generates new access token using refresh token
    """
    current_user_id = get_jwt_identity()
    user = Employee.query.get(current_user_id)
    
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    new_access_token = create_access_token(
        identity=user.id,
        additional_claims={
            "role": user.role,
            "team": user.team,
            "name": user.name
        },
        expires_delta=timedelta(hours=8)
    )

    return jsonify({
        "access_token": new_access_token
    }), 200


# ----------------------------
# GET CURRENT USER
# ----------------------------
@bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    """
    Get current authenticated user's information
    """
    current_user_id = get_jwt_identity()
    user = Employee.query.get(current_user_id)
    
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    return jsonify({
        "user": user.to_dict()
    }), 200


# ----------------------------
# LOGOUT
# ----------------------------
@bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    """
    Logout endpoint - client should discard tokens
    Note: With JWT, logout is handled client-side by removing tokens
    This endpoint exists for consistency and future token blacklisting
    """
    return jsonify({
        "message": "Logout successful"
    }), 200

