from flask import Blueprint, jsonify, request
from app.models.employee import Employee
from app.extensions import db
from app.utils.auth_decorators import role_required, team_access_required
from flask_jwt_extended import jwt_required, get_jwt_identity

# Define Blueprint WITHOUT prefix to avoid routing ambiguity
employees_bp = Blueprint('employees', __name__)

@employees_bp.route("/api/employees", methods=["GET"], strict_slashes=False)
@employees_bp.route("/api/employees/", methods=["GET"], strict_slashes=False)
@role_required('Admin', 'Manager', 'Team Lead')
def fetch_all_employees_route():
    """
    Fetch employees with filtering.
    - team: Filter by team name (case-insensitive)
    - status: Defaults to 'Active' as per requirement
    - role: Filter by role (case-insensitive)
    """
    team = request.args.get('team')
    status = request.args.get('status', 'Active') # Default to Active
    role = request.args.get('role')

    query = Employee.query
    
    if status:
        query = query.filter(db.func.lower(Employee.status) == status.lower())
    
    if team:
        # Case-insensitive team filtering
        query = query.filter(db.func.lower(Employee.team) == team.lower())
    
    if role:
        query = query.filter(db.func.lower(Employee.role) == role.lower())
        
    employees = query.all()
    # Debug print to server console to track requests
    print(f"[DEBUG] Fetch Employees: team={team}, status={status}, role={role}, found={len(employees)}")
    
    return jsonify([emp.to_dict() for emp in employees])

@employees_bp.route("/api/employees/next-id", methods=["GET"])
@role_required('Admin', 'Team Lead')
def get_next_employee_id():
    team = request.args.get('team')
    if not team:
        return jsonify({"message": "Team is required"}), 400
    
    prefix_map = {
        'Branding': 'B',
        'Website': 'W',
        'SEO': 'S',
        'Telecaller': 'T',
        'Campaign': 'C'
    }
    prefix = prefix_map.get(team)
    if not prefix:
        return jsonify({"message": f"Invalid team: {team}"}), 400

    # Find the last ID for this team
    last_emp = Employee.query.filter(Employee.id.like(f"{prefix}%")).order_by(Employee.id.desc()).first()
    
    next_num = 1
    if last_emp:
        try:
            # Extract number from ID (e.g., 'B001' -> 1)
            num_part = last_emp.id[len(prefix):]
            if num_part.isdigit():
                next_num = int(num_part) + 1
        except Exception:
            next_num = 1
            
    next_id = f"{prefix}{next_num:03d}"
    return jsonify({"next_id": next_id}), 200

@employees_bp.route("/api/employees", methods=["POST"], strict_slashes=False)
@jwt_required()
def create_employee():
    current_user_id = get_jwt_identity()
    current_user = Employee.query.get(current_user_id)
    
    if not current_user:
        return jsonify({"message": "Unauthorized"}), 401
    
    # RBAC: Only Team Lead or Admin can create employees
    if current_user.role not in ['Team Lead', 'Admin']:
        return jsonify({"message": "Access Forbidden: Only Team Leaders or Admins can create employees"}), 403
        
    data = request.get_json()
    if not data:
        return jsonify({"message": "Invalid request"}), 400
        
    name = data.get("name")
    email = data.get("email")
    role = data.get("role")
    team = data.get("team") # Department
    password = data.get("password")
    
    if not all([name, email, role, team, password]):
        return jsonify({"message": "Missing required fields"}), 400
        
    # Department restriction for Team Leaders
    if current_user.role == 'Team Lead' and team != current_user.team:
        return jsonify({"message": f"You can only create employees for your own department ({current_user.team})"}), 403

    # Generate Employee ID
    prefix_map = {'Branding': 'B', 'Website': 'W', 'SEO': 'S', 'Telecaller': 'T', 'Campaign': 'C'}
    prefix = prefix_map.get(team)
    if not prefix:
        return jsonify({"message": "Invalid team specified"}), 400

    last_emp = Employee.query.filter(Employee.id.like(f"{prefix}%")).order_by(Employee.id.desc()).first()
    next_num = 1
    if last_emp:
        try:
            num_part = last_emp.id[len(prefix):]
            if num_part.isdigit():
                next_num = int(num_part) + 1
        except:
            pass
    emp_id = f"{prefix}{next_num:03d}"

    # Ensure uniqueness
    while Employee.query.get(emp_id):
        next_num += 1
        emp_id = f"{prefix}{next_num:03d}"

    # Check if email already exists
    if Employee.query.filter_by(email=email).first():
        return jsonify({"message": f"Email {email} already exists"}), 400

    try:
        new_emp = Employee(
            id=emp_id,
            name=name,
            email=email,
            role=role,
            team=team,
            team_leader_id=current_user.id if current_user.role == 'Team Lead' else None,
            created_by=current_user_id,
            status="Active"
        )
        new_emp.set_password(password)
        
        db.session.add(new_emp)
        db.session.commit()
        
        return jsonify({"message": "Employee created successfully", "employee": new_emp.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error creating employee: {str(e)}"}), 500

@employees_bp.route("/api/employees/<string:emp_id>", methods=["GET"])
@jwt_required()
def get_employee_by_id(emp_id):
    current_user_id = get_jwt_identity()
    current_user = Employee.query.get(current_user_id)
    
    if not current_user:
        return jsonify({"message": "Unauthorized"}), 401
    
    employee = Employee.query.get(emp_id)
    if not employee:
        return jsonify({"message": "Employee not found"}), 404
    
    # Authorization check
    is_management = current_user.role in ['Admin', 'Manager', 'Team Lead']
    is_self = current_user.id == emp_id
    
    if not (is_management or is_self):
        return jsonify({"message": "Access Forbidden"}), 403
    
    return jsonify(employee.to_dict()), 200
    
@employees_bp.route("/api/employees/<string:emp_id>", methods=["PATCH"])
@role_required('Admin', 'Manager')
def update_employee_email(emp_id):
    """
    Allow Admin or Manager to update employee/TL email.
    """
    data = request.get_json() or {}
    new_email = data.get("email")

    if not new_email:
        return jsonify({"message": "Email is required"}), 400

    from app.services.email_service import validate_email
    if not validate_email(new_email):
        return jsonify({"message": "Invalid email format"}), 400

    employee = Employee.query.get(emp_id)
    if not employee:
        return jsonify({"message": "Employee not found"}), 404

    # Check if email is already taken
    existing = Employee.query.filter(Employee.email == new_email, Employee.id != emp_id).first()
    if existing:
        return jsonify({"message": "Email already in use by another account"}), 400

    try:
        employee.email = new_email
        db.session.commit()
        return jsonify({"message": "Email updated successfully", "employee": employee.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error updating email: {str(e)}"}), 500
