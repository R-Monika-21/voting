from flask import Blueprint, request, jsonify
from extensions import db
from models.vote import Vote
from models.candidate import Candidate
from flask_login import current_user, login_required

vote_bp = Blueprint('vote', __name__)

@vote_bp.route('/elections/<int:eid>/vote', methods=['POST'])
@login_required
def vote(eid):
    data = request.json
    cid = data.get('candidate_id')
    if not cid:
        return jsonify({'message': 'Candidate ID required'}), 400

    existing_vote = Vote.query.filter_by(voter_id=current_user.id, election_id=eid).first()
    if existing_vote:
        return jsonify({'message': 'You have already voted for this election'}), 400

    new_vote = Vote(voter_id=current_user.id, election_id=eid, candidate_id=cid)
    db.session.add(new_vote)

    candidate = Candidate.query.get(cid)
    if candidate:
        candidate.count += 1
    else:
        return jsonify({'message': 'Invalid candidate'}), 400

    db.session.commit()
    return jsonify({'message': 'Vote submitted successfully'})