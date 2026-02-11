from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

# Import shared db and Voter model
from extensions import db
from models.voter import Voter

voter_bp = Blueprint('voter', __name__, url_prefix='/api/voter')

# ── Check if email already exists ──
@voter_bp.route('/check-email', methods=['POST'])
def check_email():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({"error": "Email is required"}), 400

    exists = Voter.query.filter_by(email=email.strip().lower()).first() is not None
    return jsonify({"exists": exists})


# ── Register new voter ──
@voter_bp.route('/register', methods=['POST'])
def register_voter():
    data = request.get_json()

    required_fields = ['student_name', 'roll_no', 'major', 'course', 'year', 'email', 'password']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({"message": f"{field} is required"}), 400

    # Check duplicates
    if Voter.query.filter_by(email=data['email'].strip().lower()).first():
        return jsonify({"message": "Email already registered"}), 400

    if Voter.query.filter_by(roll_no=data['roll_no'].strip().upper()).first():
        return jsonify({"message": "Roll number already registered"}), 400

    # Validate year
    try:
        year = int(data['year'])
        if year < 1 or year > 5:
            return jsonify({"message": "Year must be between 1 and 5"}), 400
    except ValueError:
        return jsonify({"message": "Invalid year format"}), 400

    # Create voter (password is hashed in model __init__)
    new_voter = Voter(
        student_name=data['student_name'].strip(),
        roll_no=data['roll_no'].strip().upper(),
        major=data['major'],
        course=data['course'].strip(),
        year=year,
        email=data['email'].strip().lower(),
        password=data['password']
    )

    try:
        db.session.add(new_voter)
        db.session.commit()
        return jsonify({
            "success": True,
            "message": "Voter registered successfully",
            "voter_id": new_voter.id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Database error", "error": str(e)}), 500


# ── Voter Login ──
@voter_bp.route('/login', methods=['POST'])
def voter_login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    voter = Voter.query.filter_by(email=email.strip().lower()).first()

    if not voter:
        return jsonify({"message": "Invalid email or password"}), 401

    # Verify hashed password
    if check_password_hash(voter.password, password):
        return jsonify({
            "success": True,
            "message": "Login successful",
            "voter": {
                "id": voter.id,
                "student_name": voter.student_name,
                "roll_no": voter.roll_no,
                "email": voter.email,
                "major": voter.major,
                "course": voter.course,
                "year": voter.year
            }
        }), 200
    else:
        return jsonify({"message": "Invalid email or password"}), 401


# ── Get all voters (with optional filtering) ── for Admin ViewVoter
@voter_bp.route('/voters', methods=['GET'])
def get_voters():
    query = Voter.query

    # Optional query parameters for filtering
    student_name = request.args.get('student_name')
    roll_no = request.args.get('roll_no')
    year = request.args.get('year')
    major = request.args.get('major')
    course = request.args.get('course')  # or department

    if student_name:
        query = query.filter(Voter.student_name.ilike(f'%{student_name}%'))
    if roll_no:
        query = query.filter(Voter.roll_no.ilike(f'%{roll_no}%'))
    if year:
        try:
            query = query.filter(Voter.year == int(year))
        except ValueError:
            pass  # ignore invalid year
    if major:
        query = query.filter(Voter.major.ilike(f'%{major}%'))
    if course:
        query = query.filter(Voter.course.ilike(f'%{course}%'))

    voters = query.all()

    return jsonify([{
        "id": v.id,
        "student_name": v.student_name,
        "roll_no": v.roll_no,
        "major": v.major,
        "course": v.course,
        "year": v.year,
        "email": v.email
    } for v in voters]), 200