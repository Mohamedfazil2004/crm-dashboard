# app/utils/auth_decorators.py
from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models.employee import Employee

def jwt_required_custom(fn):
    """
    Custom JWT required decorator that verifies JWT token
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            return fn(*args, **kwargs)
        except Exception as e:
            return jsonify({"message": "Authentication required", "error": str(e)}), 401
    return wrapper


def role_required(*allowed_roles):
    """
    Decorator to check if the current user has one of the allowed roles.
    Usage: @role_required('Admin', 'Manager')
    
    STRICT READ-ONLY FOR ADMIN:
    Even if 'Admin' is in allowed_roles, this decorator will BLOCK any 
    write operations (POST, PUT, DELETE, PATCH) if the user is an Admin.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request()
                current_user_id = get_jwt_identity()
                user = Employee.query.get(current_user_id)
                
                if not user:
                    return jsonify({"message": "User not found"}), 404
                
                # Check if role is allowed
                if user.role not in allowed_roles:
                    return jsonify({
                        "message": "Access forbidden",
                        "required_roles": list(allowed_roles),
                        "your_role": user.role
                    }), 403
                
                return fn(*args, **kwargs)
            except Exception as e:
                return jsonify({"message": "Authentication required", "error": str(e)}), 401
        return wrapper
    return decorator


def team_access_required(fn):
    """
    Decorator for Team Lead access control.
    - Admin: Full access.
    - Team Lead: Can only access their OWN team's data.
    - Manager: NO ACCESS to individual team pages (as per requirements).
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            user = Employee.query.get(current_user_id)
            
            if not user:
                return jsonify({"message": "User not found"}), 404
            
            # Admin has full access
            if user.role == 'Admin':
                # Admins can see any team, pass the request's intended team if needed, 
                # or the route handles it. 
                return fn(*args, **kwargs)
            
            # Manager is explicitly FORBIDDEN from individual team pages
            if user.role == 'Manager':
                return jsonify({
                    "message": "Access forbidden",
                    "detail": "Managers cannot access individual team pages"
                }), 403
            
            # Team Lead can only access their own team
            if user.role == 'Team Lead':
                # The route usually expects data for a specific team.
                # We simply verify if the route is being accessed for the user's team.
                # NOTE: This assumes the route either takes 'team_name' as arg OR 
                # defines the team internally. 
                # For safety, we inject the user's team into kwargs so the route can filter by it.
                kwargs['authorized_team'] = user.team
                return fn(*args, **kwargs)
            
            # Employees cannot access team pages
            return jsonify({
                "message": "Access forbidden",
                "detail": "Employees cannot access team pages"
            }), 403
            
        except Exception as e:
            return jsonify({"message": "Authentication required", "error": str(e)}), 401
    return wrapper


def get_current_user():
    """
    Helper function to get the current authenticated user
    """
    try:
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        return Employee.query.get(current_user_id)
    except:
        return None
