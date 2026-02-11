from flask import Blueprint, request, jsonify

# Import shared db and Admin model
from extensions import db
from models.admin import Admin

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@admin_bp.route('/login', methods=['POST'])
def admin_login():
    data = request.get_json()
    
    # Debug print
    print("[ADMIN LOGIN ATTEMPT]", data)

    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        print("[ADMIN] Missing email or password")
        return jsonify({"message": "Email and password are required"}), 400

    # Normalize email
    email = email.strip().lower()
    
    admin = Admin.query.filter_by(email=email).first()

    if not admin:
        print(f"[ADMIN] No user found for email: {email}")
        return jsonify({"message": "Invalid email or password"}), 401

    # Debug prints for comparison
    print(f"[ADMIN] Stored password : {admin.password}")
    print(f"[ADMIN] Entered password : {password}")

    # Plain text comparison (as requested)
    if admin.password == password:
        print("[ADMIN] Login SUCCESS")
        return jsonify({
            "success": True,
            "message": "Admin login successful",
            "admin": {
                "id": admin.id,
                "name": admin.name,
                "email": admin.email,
                "admin_id": admin.admin_id,
                # Never return password in production!
            }
        }), 200
    else:
        print("[ADMIN] Password mismatch")
        return jsonify({"message": "Invalid email or password"}), 401
@admin_bp.route('/logout', methods=['POST'])
def admin_logout():
    # For now it's stateless → client just removes localStorage
    # If you later implement JWT / session, invalidate token here
    return jsonify({
        "success": True,
        "message": "Logged out successfully"
    }), 200