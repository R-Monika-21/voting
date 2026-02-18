# backend/routes/election_routes.py
from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required  # uncomment when auth is ready
from models.election import Election
from extensions import db
from datetime import datetime

election_bp = Blueprint('elections', __name__, url_prefix='/api/admin')

# POST /api/admin/elections - Create new election
@election_bp.route('/elections', methods=['POST'])
# @login_required
def create_election():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400

        required = [
            'election_name', 'election_date', 'election_time',
            'end_date', 'end_time', 'result_date', 'result_time'
        ]
        missing = [f for f in required if f not in data or not data[f]]
        if missing:
            return jsonify({'error': f'Missing required fields: {", ".join(missing)}'}), 400

        # Parse dates and times
        election_date = datetime.strptime(data['election_date'], '%Y-%m-%d').date()
        election_time = datetime.strptime(data['election_time'], '%H:%M').time()
        end_date   = datetime.strptime(data['end_date'],   '%Y-%m-%d').date()
        end_time   = datetime.strptime(data['end_time'],   '%H:%M').time()
        result_date = datetime.strptime(data['result_date'], '%Y-%m-%d').date()
        result_time = datetime.strptime(data['result_time'], '%H:%M').time()

        new_election = Election(
            election_name=data['election_name'].strip(),
            election_date=election_date,
            election_time=election_time,
            end_date=end_date,
            end_time=end_time,
            result_date=result_date,
            result_time=result_time,
            election_status='UPCOMING'  # default
        )

        db.session.add(new_election)
        db.session.commit()

        return jsonify(new_election.to_dict()), 201

    except ValueError as ve:
        db.session.rollback()
        current_app.logger.error(f"Invalid date/time format: {str(ve)}")
        return jsonify({'error': f'Invalid date or time format: {str(ve)}'}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating election: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to create election'}), 500


# GET /api/admin/elections - List all elections
@election_bp.route('/elections', methods=['GET'])
# @login_required
def get_elections():
    try:
        elections = Election.query.all()
        return jsonify([e.to_dict() for e in elections]), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching elections: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to fetch elections'}), 500


# PUT /api/admin/elections/<id> - Update election (partial update)
@election_bp.route('/elections/<int:id>', methods=['PUT'])
# @login_required
def update_election(id):
    election = Election.query.get_or_404(id)
    data = request.get_json()

    try:
        if 'election_name' in data:
            election.election_name = data['election_name'].strip()

        if 'election_date' in data:
            election.election_date = datetime.strptime(data['election_date'], '%Y-%m-%d').date()

        if 'election_time' in data:
            election.election_time = datetime.strptime(data['election_time'], '%H:%M').time()

        if 'end_date' in data:
            election.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()

        if 'end_time' in data:
            election.end_time = datetime.strptime(data['end_time'], '%H:%M').time()

        if 'result_date' in data:
            election.result_date = datetime.strptime(data['result_date'], '%Y-%m-%d').date()

        if 'result_time' in data:
            election.result_time = datetime.strptime(data['result_time'], '%H:%M').time()

        if 'election_status' in data:
            status = data['election_status'].upper()
            if status in ['UPCOMING', 'ACTIVE', 'CLOSED']:
                election.election_status = status

        db.session.commit()
        return jsonify(election.to_dict()), 200

    except ValueError as ve:
        db.session.rollback()
        current_app.logger.error(f"Invalid format in update: {str(ve)}")
        return jsonify({'error': f'Invalid date/time format: {str(ve)}'}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating election: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to update election'}), 500


# DELETE /api/admin/elections/<id> - Delete election
@election_bp.route('/elections/<int:id>', methods=['DELETE'])
# @login_required
def delete_election(id):
    election = Election.query.get_or_404(id)
    try:
        db.session.delete(election)
        db.session.commit()
        return jsonify({'message': 'Election deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting election: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to delete election'}), 500


