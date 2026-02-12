from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import os
from extensions import db
from models.candidate import Candidate
from models.election import Election

candidate_bp = Blueprint('candidates', __name__, url_prefix='/api')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# GET /api/elections/upcoming
@candidate_bp.route('/elections/upcoming', methods=['GET'])
def get_upcoming_elections():
    try:
        elections = Election.query.filter_by(election_status='UPCOMING').all()
        return jsonify([
            {
                'id': election.id,
                'election_name': election.election_name   # corrected field name
            }
            for election in elections
        ]), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching upcoming elections: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to load upcoming elections'}), 500


# POST /api/candidates
@candidate_bp.route('/candidates', methods=['POST'])
def add_candidate():
    try:
        required_fields = ['election_id', 'name', 'email', 'roll_no', 'year', 'course', 'major']
        for field in required_fields:
            if field not in request.form or not request.form[field].strip():
                return jsonify({'error': f'Missing or empty field: {field}'}), 400

        election_id = int(request.form['election_id'])
        name = request.form['name'].strip()
        email = request.form['email'].strip()
        roll_no = request.form['roll_no'].strip()
        course = request.form['course'].strip()
        major = request.form['major'].strip()

        try:
            year = int(request.form['year'])
            if not (1 <= year <= 5):
                return jsonify({'error': 'Year must be between 1 and 5'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid year value'}), 400

        # Validate election exists
        election = Election.query.get(election_id)
        if not election:
            return jsonify({'error': 'Invalid election ID'}), 400

        # File handling
        if 'symbol' not in request.files:
            return jsonify({'error': 'Symbol image is required'}), 400

        file = request.files['symbol']
        if file.filename == '':
            return jsonify({'error': 'No file selected for upload'}), 400

        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Allowed: png, jpg, jpeg, gif'}), 400

        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        if file_size > MAX_FILE_SIZE:
            return jsonify({'error': 'File too large. Max 2MB allowed'}), 400

        filename = secure_filename(file.filename)
        save_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(save_path)

        # Relative path for frontend / static serving
        symbol_path = f'symbols/{filename}'

        # Create candidate
        candidate = Candidate(
            election_id=election_id,
            name=name,
            roll_no=roll_no,
            major=major,
            course=course,
            year=year,
            symbol=symbol_path,
            email=email
        )

        db.session.add(candidate)
        db.session.commit()

        return jsonify({
            'message': 'Candidate added successfully',
            'candidate': {
                'id': candidate.id,
                'name': candidate.name,
                'roll_no': candidate.roll_no,
                'email': candidate.email
            }
        }), 201

    except ValueError as ve:
        db.session.rollback()
        return jsonify({'error': f'Invalid input: {str(ve)}'}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error adding candidate: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500