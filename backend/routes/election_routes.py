from flask import Blueprint, request, jsonify
from flask_login import login_required
from models.election import Election
from extensions import db
from datetime import datetime
import traceback

election_bp = Blueprint('elections', __name__, url_prefix='/api/admin')

@election_bp.route('/elections', methods=['POST'])
# @login_required  # ← comment this out completely for now (test without login)
def create_election():
    try:
        data = request.get_json()
        print("Received data:", data)  # ← print to terminal for debugging

        if not data:
            return jsonify({'error': 'No JSON data received'}), 400

        required = [
            'election_name', 'start_date', 'start_time',
            'end_date', 'end_time', 'result_date', 'result_time'
        ]
        missing = [f for f in required if f not in data or not data[f]]
        if missing:
            return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

        # Parse strings into date/time objects
        election_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        election_time = datetime.strptime(data['start_time'], '%H:%M').time()
        end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
        end_time = datetime.strptime(data['end_time'], '%H:%M').time()
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
        # Catches wrong date/time format
        print("ValueError:", str(ve))
        return jsonify({'error': f'Invalid date or time format: {str(ve)}'}), 400

    except Exception as e:
        db.session.rollback()
        print("--- FULL ERROR CREATING ELECTION ---")
        print(traceback.format_exc())  # ← shows exact line & stack trace in terminal
        return jsonify({'error': str(e)}), 500