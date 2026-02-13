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
    """
    Returns list of upcoming elections (useful for dropdown when adding candidates)
    """
    try:
        elections = Election.query.filter_by(election_status='UPCOMING').all()
        return jsonify([
            {
                'id': election.id,
                'election_name': election.election_name
            }
            for election in elections
        ]), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching upcoming elections: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to load upcoming elections'}), 500


# GET /api/candidates?election_id=<id>
@candidate_bp.route('/candidates', methods=['GET'])
def get_candidates():
    """
    Get all candidates or filter by election_id
    """
    election_id = request.args.get('election_id', type=int)
    try:
        if election_id:
            candidates = Candidate.query.filter_by(election_id=election_id).all()
        else:
            candidates = Candidate.query.all()
        
        return jsonify([c.to_dict() for c in candidates]), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching candidates: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to load candidates'}), 500


# POST /api/candidates
@candidate_bp.route('/candidates', methods=['POST'])
def add_candidate():
    """
    Add a new candidate with symbol image upload
    Expects multipart/form-data
    """
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

        # Validate year
        try:
            year = int(request.form['year'])
            if not (1 <= year <= 5):
                return jsonify({'error': 'Year must be between 1 and 5'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid year value'}), 400

        # Check if election exists
        election = Election.query.get(election_id)
        if not election:
            return jsonify({'error': 'Invalid election ID'}), 400

        # Handle symbol upload
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

        # Store relative path (adjust prefix as needed)
        symbol_path = f'symbols/{filename}'   # frontend will access /symbols/filename

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
            'candidate': candidate.to_dict()
        }), 201

    except ValueError as ve:
        db.session.rollback()
        return jsonify({'error': f'Invalid input: {str(ve)}'}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error adding candidate: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500


# PUT /api/candidates/<id>
@candidate_bp.route('/candidates/<int:id>', methods=['PUT'])
def update_candidate(id):
    """
    Update candidate details (text fields only)
    Note: Symbol/image change not supported in this endpoint
    """
    candidate = Candidate.query.get_or_404(id)
    data = request.get_json()

    try:
        if 'name' in data:
            candidate.name = data['name'].strip()
        if 'roll_no' in data:
            candidate.roll_no = data['roll_no'].strip()
        if 'major' in data:
            candidate.major = data['major'].strip()
        if 'course' in data:
            candidate.course = data['course'].strip()
        if 'year' in data:
            year = int(data['year'])
            if not (1 <= year <= 5):
                return jsonify({'error': 'Year must be between 1 and 5'}), 400
            candidate.year = year
        if 'email' in data:
            candidate.email = data['email'].strip()

        # If you later want to allow symbol update, you'd need to accept multipart/form-data here too

        db.session.commit()
        return jsonify(candidate.to_dict()), 200

    except ValueError as ve:
        db.session.rollback()
        return jsonify({'error': f'Invalid value: {str(ve)}'}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating candidate: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to update candidate'}), 500


# DELETE /api/candidates/<id>
@candidate_bp.route('/candidates/<int:id>', methods=['DELETE'])
def delete_candidate(id):
    """
    Delete a candidate
    """
    candidate = Candidate.query.get_or_404(id)
    try:
        # Optional: delete symbol file from disk
        if candidate.symbol:
            file_path = os.path.join(
                current_app.config['UPLOAD_FOLDER'],
                candidate.symbol.replace('symbols/', '')
            )
            if os.path.exists(file_path):
                os.remove(file_path)

        db.session.delete(candidate)
        db.session.commit()
        return jsonify({'message': 'Candidate deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting candidate: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to delete candidate'}), 500