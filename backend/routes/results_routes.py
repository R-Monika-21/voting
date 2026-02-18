# routes/results_routes.py

from datetime import datetime
from flask import Blueprint, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from models.election import Election
from models.candidate import Candidate
from extensions import db

results_bp = Blueprint('results', __name__, url_prefix='/api')


# ────────────────────────────────────────────────
# GET ALL CLOSED ELECTIONS (optional JWT)
# ────────────────────────────────────────────────
@results_bp.route('/elections/results/closed', methods=['GET'])
def get_closed_elections():
    try:
        # ✅ Optional JWT check for admin or logged-in voter
        verify_jwt_in_request(optional=True)
        user = get_jwt_identity()  # Will be None if not logged in
    except:
        user = None

    now = datetime.now()

    # Auto-close elections if end_time has passed
    elections = Election.query.all()
    for e in elections:
        end_datetime = datetime.combine(e.end_date, e.end_time)
        if now > end_datetime and e.election_status == "ACTIVE":
            e.election_status = "CLOSED"
            db.session.commit()

    # Get only CLOSED elections
    elections = Election.query.filter_by(election_status="CLOSED") \
        .order_by(Election.end_date.desc()) \
        .all()

    result = []
    for e in elections:
        total_votes = db.session.query(db.func.sum(Candidate.count)) \
            .filter(Candidate.election_id == e.id) \
            .scalar() or 0

        result.append({
            'id': e.id,
            'title': e.election_name,
            'end_date': e.end_date.isoformat(),
            'total_votes': int(total_votes)
        })

    return jsonify(result), 200


# ────────────────────────────────────────────────
# GET DETAILED RESULTS FOR ONE ELECTION (optional JWT)
# ────────────────────────────────────────────────
@results_bp.route('/elections/<int:election_id>/results', methods=['GET'])
def get_election_results(election_id):
    try:
        # Optional JWT (admin or voter)
        verify_jwt_in_request(optional=True)
        user = get_jwt_identity()
    except:
        user = None

    election = Election.query.get_or_404(election_id)

    if election.election_status != "CLOSED":
        return jsonify({"error": "Results only available for closed elections"}), 403

    candidates = Candidate.query.filter_by(election_id=election_id).all()
    total_votes = sum(c.count for c in candidates) or 0

    # Determine max votes and potential ties
    if candidates:
        max_votes = max(c.count for c in candidates)
        winners = [c for c in candidates if c.count == max_votes]
    else:
        max_votes = 0
        winners = []

    # Build candidate results
    candidates_result = []
    for c in candidates:
        percentage = (c.count / total_votes * 100) if total_votes > 0 else 0
        is_winner = len(winners) == 1 and c in winners and max_votes > 0

        candidates_result.append({
            'id': c.id,
            'name': c.name,
            'course': getattr(c, 'course', None),
            'major': getattr(c, 'major', None),
            'symbol_url': c.get_symbol_url() if hasattr(c, 'get_symbol_url') else None,
            'vote_count': c.count,
            'percentage': round(percentage, 2),
            'is_winner': is_winner
        })

    # Prepare winner data
    winner_data = None
    if max_votes == 0:
        winner_data = None
    elif len(winners) == 1:
        w = winners[0]
        margin = 0
        if len(candidates) > 1:
            second_count = sorted([c.count for c in candidates], reverse=True)[1]
            margin = w.count - second_count

        winner_data = {
            'name': w.name,
            'vote_count': w.count,
            'percentage': round((w.count / total_votes * 100), 2) if total_votes > 0 else 0,
            'course': getattr(w, 'course', None),
            'major': getattr(w, 'major', None),
            'margin': margin,
            'tie': False
        }
    else:
        winner_data = {
            'tie': True,
            'names': [c.name for c in winners],
            'vote_count': max_votes,
            'percentage': round((max_votes / total_votes * 100), 2) if total_votes > 0 else 0
        }

    return jsonify({
        'election': {
            'id': election.id,
            'title': election.election_name,
            'end_date': election.end_date.isoformat(),
        },
        'candidates': candidates_result,
        'winner': winner_data,
        'total_votes': total_votes
    }), 200
