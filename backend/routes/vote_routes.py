# vote_routes.py  (or you can put it in candidate_routes.py if you prefer one file)

from flask import Blueprint, request, jsonify, current_app
from extensions import db
from models.candidate import Candidate
from models.vote import Vote
from flask_jwt_extended import jwt_required, get_jwt_identity


vote_bp = Blueprint('vote', __name__, url_prefix='/api')

# ────────────────────────────────────────────────────────────────
#   GET /api/elections/<int:election_id>/candidates-and-vote-status
# ────────────────────────────────────────────────────────────────
@vote_bp.route('/elections/<int:election_id>/candidates-and-vote-status', methods=['GET'])
@jwt_required()

def get_candidates_and_vote_status(election_id):
    current_user_id = get_jwt_identity()

    """
    Returns:
    - list of candidates for the given election
    - boolean has_voted: whether current logged-in user already voted in this election
    """
    try:
        # Fetch all candidates for this election
        candidates = Candidate.query.filter_by(election_id=election_id).all()

        # Check if user has already voted in this election
        existing_vote = Vote.query.filter_by(
            voter_id=current_user_id,
            election_id=election_id
        ).first()

        has_voted = existing_vote is not None

        return jsonify({
            'candidates': [candidate.to_dict() for candidate in candidates],
            'has_voted': has_voted
        }), 200

    except Exception as e:
        current_app.logger.error(
            f"Error fetching candidates + vote status for election {election_id}: {str(e)}",
            exc_info=True
        )
        return jsonify({'error': 'Failed to load candidates and vote status'}), 500


# ────────────────────────────────────────────────────────────────
#   POST /api/elections/<int:eid>/vote
# ────────────────────────────────────────────────────────────────
@vote_bp.route('/elections/<int:eid>/vote', methods=['POST'])
@jwt_required()

def submit_vote(eid):
    current_user_id = get_jwt_identity()

    """
    Submit a vote for a candidate in the given election
    Expects JSON: {"candidate_id": 123}
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'Invalid JSON payload'}), 400

        candidate_id = data.get('candidate_id')
        if not candidate_id:
            return jsonify({'message': 'candidate_id is required'}), 400

        # Make sure candidate exists and belongs to this election
        candidate = Candidate.query.filter_by(
            id=candidate_id,
            election_id=eid
        ).first()

        if not candidate:
            return jsonify({'message': 'Invalid candidate for this election'}), 400

        # Check if user already voted
        existing_vote = Vote.query.filter_by(
            voter_id=current_user_id,
            election_id=eid
        ).first()

        if existing_vote:
            return jsonify({'message': 'You have already voted in this election'}), 403

        # Record the vote
        new_vote = Vote(
            voter_id=current_user_id,
            election_id=eid,
            candidate_id=candidate_id
        )
        db.session.add(new_vote)

        # Increment vote count
        candidate.count += 1

        db.session.commit()

        return jsonify({
            'message': 'Vote submitted successfully',
            'candidate_id': candidate_id
        }), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Vote submission failed: {str(e)}", exc_info=True)
        return jsonify({'message': 'Failed to submit vote'}), 500