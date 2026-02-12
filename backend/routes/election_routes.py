from flask import Blueprint, request, jsonify
from flask_login import login_required
from models.election import Election
from extensions import db
from datetime import datetime
import traceback

election_bp = Blueprint('elections', __name__, url_prefix='/api/admin')

# POST /api/admin/elections  → create new election (admin only)
@election_bp.route('/elections', methods=['POST'])
# @login_required   # ← comment out during development, uncomment later
def create_election():
    try:
        data = request.get_json()
        print("Received data:", data)  # debug

        if not data:
            return jsonify({'error': 'No JSON data received'}), 400

        required = [
            'election_name', 'start_date', 'start_time',
            'end_date', 'end_time', 'result_date', 'result_time'
        ]
        missing = [f for f in required if f not in data or not data[f]]
        if missing:
            return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

        # Parse dates and times
        start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        start_time = datetime.strptime(data['start_time'], '%H:%M').time()
        end_date   = datetime.strptime(data['end_date'],   '%Y-%m-%d').date()
        end_time   = datetime.strptime(data['end_time'],   '%H:%M').time()
        result_date = datetime.strptime(data['result_date'], '%Y-%m-%d').date()
        result_time = datetime.strptime(data['result_time'], '%H:%M').time()

        new_election = Election(
            election_name=data['election_name'].strip(),
            election_date=start_date,
            election_time=start_time,
            end_date=end_date,
            end_time=end_time,
            result_date=result_date,
            result_time=result_time,
            election_status='UPCOMING'
        )

        db.session.add(new_election)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Election created successfully',
            'election_id': new_election.id
        }), 201

    except ValueError as ve:
        print("ValueError:", str(ve))
        return jsonify({'error': f'Invalid date or time format: {str(ve)}'}), 400

    except Exception as e:
        db.session.rollback()
        print("--- ERROR CREATING ELECTION ---")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


# GET /api/admin/elections  → list all elections
@election_bp.route('/elections', methods=['GET'])
# @login_required   # ← comment out during development
def get_elections():
    try:
        elections = Election.query.all()
        result = []
        for election in elections:
            result.append({
                'id': election.id,
                'election_name': election.election_name,
                'start_date': election.election_date.isoformat(),
                'start_time': election.election_time.strftime('%H:%M'),
                'end_date': election.end_date.isoformat(),
                'end_time': election.end_time.strftime('%H:%M'),
                'result_date': election.result_date.isoformat(),
                'result_time': election.result_time.strftime('%H:%M'),
                'status': election.election_status
            })
        return jsonify(result), 200

    except Exception as e:
        print("--- ERROR FETCHING ELECTIONS ---")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500