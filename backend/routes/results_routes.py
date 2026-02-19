# routes/results_routes.py
# (Admin + Voter - Final Combined Version)

from datetime import datetime
from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import verify_jwt_in_request
from sqlalchemy import func
from models.election import Election
from models.candidate import Candidate
from models.voter import Voter
from extensions import db
import csv
import io
import os

# For PDF
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.pagesizes import A4


results_bp = Blueprint('results', __name__, url_prefix='/api')


# ────────────────────────────────────────────────
# AUTO CLOSE ELECTIONS
# ────────────────────────────────────────────────
def auto_close_elections():
    now = datetime.now()
    elections = Election.query.all()

    for e in elections:
        if e.end_date and e.end_time:
            end_datetime = datetime.combine(e.end_date, e.end_time)
            if now > end_datetime and e.election_status == "ACTIVE":
                e.election_status = "CLOSED"
                db.session.commit()


# ────────────────────────────────────────────────
# GET ALL CLOSED ELECTIONS
# ────────────────────────────────────────────────
@results_bp.route('/elections/results/closed', methods=['GET'])
def get_closed_elections():

    verify_jwt_in_request(optional=True)
    auto_close_elections()

    elections = Election.query.filter_by(election_status="CLOSED") \
        .order_by(Election.end_date.desc()) \
        .all()

    result = []

    for e in elections:
        total_votes = db.session.query(func.sum(Candidate.count)) \
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
# GET DETAILED RESULTS (Admin + Voter)
# ────────────────────────────────────────────────
@results_bp.route('/elections/<int:election_id>/results', methods=['GET'])
def get_election_results(election_id):

    verify_jwt_in_request(optional=True)
    auto_close_elections()

    election = Election.query.get_or_404(election_id)

    if election.election_status != "CLOSED":
        return jsonify({"error": "Results only available for closed elections"}), 403

    search = request.args.get("search", "").lower()

    candidates = Candidate.query.filter_by(election_id=election_id).all()

    if search:
        candidates = [c for c in candidates if search in c.name.lower()]

    total_votes = sum(c.count for c in candidates) or 0
    total_registered_voters = Voter.query.count()

    # Determine winner / tie
    if candidates:
        max_votes = max(c.count for c in candidates)
        winners = [c for c in candidates if c.count == max_votes]
    else:
        max_votes = 0
        winners = []

    candidate_list = []

    for c in candidates:
        percentage = (c.count / total_votes * 100) if total_votes > 0 else 0

        is_winner = len(winners) == 1 and c in winners and max_votes > 0

        candidate_list.append({
            "id": c.id,
            "name": c.name,
            "roll_no": c.roll_no,
            "major": c.major,
            "course": c.course,
            "symbol_url": c.get_symbol_url() if hasattr(c, "get_symbol_url") else None,
            "vote_count": c.count,
            "percentage": round(percentage, 2),
            "email": c.email,
            "is_winner": is_winner
        })

    # Winner Data
    winner_data = None

    if max_votes == 0:
        winner_data = {
            "message": "No votes cast yet",
            "tie": False
        }

    elif len(winners) == 1:
        w = winners[0]

        margin = 0
        if len(candidates) > 1:
            second_count = sorted(
                [c.count for c in candidates],
                reverse=True
            )[1]
            margin = w.count - second_count

        winner_data = {
            "name": w.name,
            "vote_count": w.count,
            "percentage": round((w.count / total_votes * 100), 2)
            if total_votes > 0 else 0,
            "major": w.major,
            "course": w.course,
            "margin": margin,
            "symbol_url": w.get_symbol_url() if hasattr(w, "get_symbol_url") else None,

            "tie": False
        }

    else:
        winner_data = {
            "tie": True,
            "names": [w.name for w in winners],
            "vote_count": max_votes,
            "percentage": round((max_votes / total_votes * 100), 2)
            if total_votes > 0 else 0
        }

    turnout = (
        (total_votes / total_registered_voters * 100)
        if total_registered_voters > 0 else 0
    )

    return jsonify({
        "election": {
            "id": election.id,
            "title": election.election_name,
            "end_date": election.end_date.isoformat()
        },
        "candidates": candidate_list,
        "winner": winner_data,
        "summary": {
            "total_registered_voters": total_registered_voters,
            "total_votes": total_votes,
            "turnout_percentage": round(turnout, 2)
        }
    }), 200


# ────────────────────────────────────────────────
# EXPORT CSV (Admin)
# ────────────────────────────────────────────────
@results_bp.route('/elections/<int:election_id>/results/export/csv', methods=['GET'])
def export_results_csv(election_id):

    verify_jwt_in_request(optional=True)

    candidates = Candidate.query.filter_by(election_id=election_id).all()

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["Name", "Major", "Course", "Votes"])

    for c in candidates:
        writer.writerow([c.name, c.major, c.course, c.count])

    output.seek(0)

    return send_file(
        io.BytesIO(output.getvalue().encode()),
        mimetype='text/csv',
        as_attachment=True,
        download_name=f"election_{election_id}_results.csv"
    )


# ────────────────────────────────────────────────
# EXPORT PDF (Admin)
# ────────────────────────────────────────────────
@results_bp.route('/elections/<int:election_id>/results/export/pdf', methods=['GET'])
def export_results_pdf(election_id):

    verify_jwt_in_request(optional=True)

    election = Election.query.get_or_404(election_id)
    candidates = Candidate.query.filter_by(election_id=election_id).all()

    file_path = f"election_{election_id}_results.pdf"

    doc = SimpleDocTemplate(file_path, pagesize=A4)
    elements = []

    elements.append(
        Paragraph(f"Election: {election.election_name}",
                  ParagraphStyle('Normal'))
    )
    elements.append(Spacer(1, 20))

    for c in candidates:
        elements.append(
            Paragraph(
                f"{c.name} ({c.major}) - Votes: {c.count}",
                ParagraphStyle('Normal')
            )
        )
        elements.append(Spacer(1, 10))

    doc.build(elements)

    return send_file(file_path, as_attachment=True)
