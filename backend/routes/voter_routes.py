# backend/routes/voter_routes.py
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from datetime import datetime

# Import shared db and models
from extensions import db
from models.voter import Voter
from models.election import Election
from models.candidate import Candidate
from models.vote import Vote      # ← required for voting

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

    if not voter or not check_password_hash(voter.password, password):
        return jsonify({"message": "Invalid email or password"}), 401

    # Create JWT token
    access_token = create_access_token(identity=str(voter.id))

    return jsonify({
        "success": True,
        "message": "Login successful",
        "token": access_token,
        "voter": {
            "id": voter.id,
            "student_name": voter.student_name,
            "roll_no": voter.roll_no,
            "major": voter.major,
            "course": voter.course,
            "year": voter.year,
            "email": voter.email
        }
    }), 200


# ── Get all voters (with optional filtering) ── for Admin ViewVoter
@voter_bp.route('/voters', methods=['GET'])
def get_voters():
    query = Voter.query

    # Optional query parameters for filtering
    student_name = request.args.get('student_name')
    roll_no = request.args.get('roll_no')
    year = request.args.get('year')
    major = request.args.get('major')
    course = request.args.get('course')

    if student_name:
        query = query.filter(Voter.student_name.ilike(f'%{student_name}%'))
    if roll_no:
        query = query.filter(Voter.roll_no.ilike(f'%{roll_no}%'))
    if year:
        try:
            query = query.filter(Voter.year == int(year))
        except ValueError:
            pass
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


@voter_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_voter_profile():
    print("=== GET /api/voter/profile called ===")
    print("Request method:", request.method)
    print("Request headers:", dict(request.headers))
    print("JWT identity:", get_jwt_identity())
    print("Request args:", request.args)
    print("Request json:", request.get_json(silent=True))

    try:
        current_voter_id = get_jwt_identity()
        voter = Voter.query.get(current_voter_id)
        
        if not voter:
            print(f"Voter not found for id: {current_voter_id}")
            return jsonify({"message": "Voter not found"}), 404

        print(f"Returning data for voter: {voter.student_name}")
        return jsonify({
            "student_name": voter.student_name,
            "roll_no": voter.roll_no,
            "major": voter.major,
            "course": voter.course,
            "year": voter.year,
            "email": voter.email
        }), 200

    except Exception as e:
        import traceback
        print("ERROR IN PROFILE ROUTE:")
        traceback.print_exc()
        return jsonify({
            "msg": "Server error",
            "error": str(e)
        }), 500


# ── Update current voter's profile ──
@voter_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_voter_profile():
    current_voter_id = get_jwt_identity()
    voter = Voter.query.get(current_voter_id)
    
    if not voter:
        return jsonify({"message": "Voter not found"}), 404

    data = request.get_json()

    # Only these fields are allowed to be updated by the voter
    allowed_fields = ['student_name', 'roll_no', 'major', 'course', 'year']

    updated = False

    for field in allowed_fields:
        if field in data and data[field] is not None:
            value = data[field]

            # Special handling
            if field == 'roll_no':
                value = str(value).strip().upper()
                # Prevent duplicate roll_no
                existing = Voter.query.filter(
                    Voter.roll_no == value,
                    Voter.id != current_voter_id
                ).first()
                if existing:
                    return jsonify({"message": "Roll number already in use"}), 400

            if field == 'year':
                try:
                    value = int(value)
                    if value < 1 or value > 5:
                        return jsonify({"message": "Year must be between 1 and 5"}), 400
                except (ValueError, TypeError):
                    return jsonify({"message": "Year must be a valid number"}), 400

            # Only update if value actually changed
            if getattr(voter, field) != value:
                setattr(voter, field, value)
                updated = True

    if not updated:
        return jsonify({
            "message": "No changes detected",
            "voter": {
                "student_name": voter.student_name,
                "roll_no": voter.roll_no,
                "major": voter.major,
                "course": voter.course,
                "year": voter.year,
                "email": voter.email
            }
        }), 200

    try:
        db.session.commit()
        return jsonify({
            "message": "Profile updated successfully",
            "voter": {
                "student_name": voter.student_name,
                "roll_no": voter.roll_no,
                "major": voter.major,
                "course": voter.course,
                "year": voter.year,
                "email": voter.email
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Failed to update profile", "error": str(e)}), 500


# ────────────────────────────────────────────────────────────────
#  Existing route: list elections + candidates
# ────────────────────────────────────────────────────────────────
@voter_bp.route('/elections-with-candidates', methods=['GET'])
@jwt_required()
def get_elections_with_candidates():
    try:
        # You can add .filter(Election.election_date >= date.today()) later if needed
        elections = Election.query.order_by(Election.election_date.desc()).all()

        result = []
        for election in elections:
            candidates = Candidate.query.filter_by(election_id=election.id).all()

            election_data = {
                "id": election.id,
                "election_name": election.election_name,
                "candidates": [
                    {
                        "id": c.id,
                        "name": c.name,
                        "roll_no": c.roll_no,
                        "major": c.major,
                        "course": c.course,
                        "year": c.year,
                        "email": c.email,
                        "symbol_url": c.get_symbol_url()
                        # ← uses the property from model
                    }
                    for c in candidates
                ]
            }
            result.append(election_data)

        return jsonify(result), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": "Failed to load election data",
            "detail": str(e)
        }), 500


# ────────────────────────────────────────────────────────────────
#  NEW: Get candidates + whether the voter has already voted (single election)
# ────────────────────────────────────────────────────────────────
@voter_bp.route('/elections/<int:election_id>/vote-status', methods=['GET'])
@jwt_required()
def get_election_vote_status(election_id):
    """
    Returns:
    - election basic info
    - list of candidates with vote count
    - has_voted: true/false for current voter
    """
    try:
        election = Election.query.get_or_404(election_id)
        candidates = Candidate.query.filter_by(election_id=election_id).all()

        has_voted = Vote.query.filter_by(
            voter_id=get_jwt_identity(),
            election_id=election_id
        ).first() is not None

        return jsonify({
            "election": {
                "id": election.id,
                "election_name": election.election_name,
                "election_status": election.election_status,
                "start": f"{election.election_date.isoformat()} {election.election_time.strftime('%H:%M')}",
                "end":   f"{election.end_date.isoformat()}   {election.end_time.strftime('%H:%M')}",
            },
            "candidates": [
                {
                    "id": c.id,
                    "name": c.name,
                    "roll_no": c.roll_no,
                    "major": c.major,
                    "course": c.course,
                    "year": c.year,
                    "symbol_url": c.get_symbol_url(),
                    "count": c.count or 0
                }
                for c in candidates
            ],
            "has_voted": has_voted
        }), 200

    except Exception as e:
        return jsonify({"error": "Failed to load vote status", "detail": str(e)}), 500


# ────────────────────────────────────────────────────────────────
#  NEW: Submit vote (increments candidate.count, prevents double vote)
# ────────────────────────────────────────────────────────────────
@voter_bp.route('/elections/<int:election_id>/vote', methods=['POST'])
@jwt_required()
def submit_vote(election_id):
    voter_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    candidate_id = data.get('candidate_id')
    if not candidate_id:
        return jsonify({"error": "candidate_id is required"}), 400

    try:
        election = Election.query.get_or_404(election_id)
        candidate = Candidate.query.get_or_404(candidate_id)

        if candidate.election_id != election_id:
            return jsonify({"error": "Candidate does not belong to this election"}), 400

        # Check voting period
        now = datetime.now()
        start_dt = datetime.combine(election.election_date, election.election_time)
        end_dt   = datetime.combine(election.end_date, election.end_time)

        if now < start_dt or now > end_dt:
            return jsonify({"error": "Voting is not open at this time"}), 403

        # Check for existing vote (unique constraint also protects, but we give nice message)
        if Vote.query.filter_by(voter_id=voter_id, election_id=election_id).first():
            return jsonify({"error": "You have already voted in this election"}), 403

        # Record vote
        new_vote = Vote(
            voter_id=voter_id,
            candidate_id=candidate_id,
            election_id=election_id
        )

        # Increment vote count
        candidate.count = (candidate.count or 0) + 1

        db.session.add(new_vote)
        db.session.commit()

        return jsonify({"message": "Vote recorded successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to record vote", "detail": str(e)}), 500