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
import io
import os


# For PDF
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics import renderPDF
from reportlab.graphics.charts.legends import Legend


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
            'election_date': e.election_date.isoformat(),
            'election_time': e.election_time.isoformat(),
            'end_date': e.end_date.isoformat(),
            'end_time': e.end_time.isoformat(),
            'result_date': e.result_date.isoformat() if e.result_date else None,
            'result_time': e.result_time.isoformat() if e.result_time else None,
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


@results_bp.route('/elections/<int:election_id>/results/export/pdf', methods=['GET'])
def export_results_pdf(election_id):

    election = Election.query.get_or_404(election_id)
    candidates = Candidate.query.filter_by(election_id=election_id).all()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()

    total_votes = sum(c.count for c in candidates)

    # =========================
    # DETERMINE WINNER
    # =========================
    winner = None
    margin = 0

    if candidates and total_votes > 0:
        sorted_candidates = sorted(candidates, key=lambda x: x.count, reverse=True)
        winner = sorted_candidates[0]

        if len(sorted_candidates) > 1:
            margin = winner.count - sorted_candidates[1].count

    # =========================
    # HEADER
    # =========================
    elements.append(Paragraph("<b>OFFICIAL ELECTION RESULTS REPORT</b>", styles["Title"]))
    elements.append(Spacer(1, 0.4 * inch))

    # =========================
    # ELECTION DETAILS
    # =========================
    details_data = [
        ["Election Name", election.election_name],
        ["Election Date", f"{election.election_date} {election.election_time}"],
        ["End Date", f"{election.end_date} {election.end_time}"],
        ["Result Declared On", f"{election.result_date} {election.result_time}" if election.result_date else "N/A"],
        ["Status", election.election_status],
        ["Total Votes Cast", str(total_votes)]
    ]

    details_table = Table(details_data, colWidths=[2.5 * inch, 3.5 * inch])
    details_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.whitesmoke),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))

    elements.append(details_table)
    elements.append(Spacer(1, 0.5 * inch))

    # =========================
    # WINNER SECTION
    # =========================
    elements.append(Paragraph("<b>WINNER OF THE ELECION: </b>", styles["Heading2"]))
    elements.append(Spacer(1, 0.3 * inch))

    if winner:
        winner_data = [
            ["Name", winner.name],
            ["Email", winner.email],
            ["Course", winner.course],
            ["Major", winner.major],
            ["Votes Secured", str(winner.count)],
            ["Winning Margin", str(margin)]
        ]

        winner_table = Table(winner_data, colWidths=[2.5 * inch, 3.5 * inch])
        winner_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))

        elements.append(winner_table)
        elements.append(Spacer(1, 0.3 * inch))

        # Add Symbol if exists
        if hasattr(winner, "symbol") and winner.symbol:
            symbol_path = os.path.join("uploads", winner.symbol)
            if os.path.exists(symbol_path):
                elements.append(Paragraph("<b>Symbol of the winner:</b>", styles["Normal"]))
                elements.append(Spacer(1, 0.2 * inch))
                img = Image(symbol_path, width=1.5 * inch, height=1.5 * inch)
                elements.append(img)

    else:
        elements.append(Paragraph("No votes were cast in this election.", styles["Normal"]))

    elements.append(Spacer(1, 0.6 * inch))

    total_registered_voters = Voter.query.count()

    turnout_percentage = (
        (total_votes / total_registered_voters * 100)
        if total_registered_voters > 0 else 0
    )

    elements.append(Paragraph("<b>ELECTION TURNOUT SUMMARY</b>", styles["Heading2"]))
    elements.append(Spacer(1, 0.3 * inch))

    turnout_data = [
        ["Total Registered Voters", str(total_registered_voters)],
        ["Total Votes Cast", str(total_votes)],
        ["Turnout Percentage", f"{round(turnout_percentage, 2)} %"]
    ]

    turnout_table = Table(turnout_data, colWidths=[2.5 * inch, 3.5 * inch])
    turnout_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.whitesmoke),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))

    elements.append(turnout_table)
    elements.append(Spacer(1, 0.5 * inch))


    # =========================
    # FULL RESULTS TABLE
    # =========================
    elements.append(Paragraph("<b>DETAILED RESULTS</b>", styles["Heading2"]))
    elements.append(Spacer(1, 0.3 * inch))

    table_data = [["S.No", "Candidate Name", "Email", "Course", "Votes", "Percentage"]]

    for index, c in enumerate(sorted_candidates, start=1):
        percentage = (c.count / total_votes * 100) if total_votes > 0 else 0

        table_data.append([
            str(index),
            c.name,
            c.email,
            c.course,
            str(c.count),
            f"{round(percentage, 2)}%"
        ])

    results_table = Table(table_data, repeatRows=1)
    results_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ALIGN', (4, 1), (-1, -1), 'CENTER'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
    ]))

    elements.append(results_table)
    elements.append(Spacer(1, 0.6 * inch))

    # =========================
    # FOOTER
    # =========================
    elements.append(Paragraph(
        f"Report Generated On: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        styles["Normal"]
    ))

    elements.append(Spacer(1, 0.2 * inch))
    elements.append(Paragraph(
        "This document is system generated and serves as the official election result record.",
        styles["Italic"]
    ))

    doc.build(elements)
    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"{election.election_name}_Official_Results_Report.pdf",
        mimetype='application/pdf'
    )

@results_bp.route('/elections/<int:election_id>/results/winner/<int:candidate_id>/export/pdf', methods=['GET'])
def export_winner_pdf(election_id, candidate_id):

    election = Election.query.get_or_404(election_id)
    winner = Candidate.query.filter_by(
        id=candidate_id,
        election_id=election_id
    ).first_or_404()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()

    # =========================
    # HEADER
    # =========================
    elements.append(Paragraph("<b>OFFICIAL WINNER CERTIFICATE</b>", styles["Title"]))
    elements.append(Spacer(1, 0.4 * inch))

    # =========================
    # ELECTION DETAILS
    # =========================
    elements.append(Paragraph(f"<b>Election Name:</b> {election.election_name}", styles["Normal"]))
    elements.append(Paragraph(f"<b>Election Date:</b> {election.election_date} at {election.election_time}", styles["Normal"]))
    elements.append(Paragraph(f"<b>Election End Date:</b> {election.end_date} at {election.end_time}", styles["Normal"]))
    elements.append(Paragraph(f"<b>Result Declared :</b> {election.result_date} at {election.result_time}" if election.result_date else "<b>Result Date:</b> N/A", styles["Normal"]))
    elements.append(Spacer(1, 0.4 * inch))

    # =========================
    # SYMBOL IMAGE
    # =========================
    if hasattr(winner, "symbol") and winner.symbol:
        symbol_path = os.path.join("uploads", winner.symbol)
        if os.path.exists(symbol_path):
            img = Image(symbol_path, width=1.8 * inch, height=1.8 * inch)
            elements.append(img)
            elements.append(Spacer(1, 0.3 * inch))

    # =========================
    # WINNER DETAILS TABLE
    # =========================
    winner_data = [
        ["Name", winner.name],
        ["Email", winner.email],
        ["Roll No", winner.roll_no],
        ["Major", winner.major],
        ["Course", winner.course],
        ["Total Votes", str(winner.count)]
    ]

    winner_table = Table(winner_data, colWidths=[2.5 * inch, 3.5 * inch])
    winner_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.whitesmoke),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))

    elements.append(winner_table)
    elements.append(Spacer(1, 0.5 * inch))

    elements.append(Paragraph(
        "This certificate is awarded for securing the highest number of votes "
        "and being officially declared as the winner of the election.",
        styles["Italic"]
    ))

    elements.append(Spacer(1, 1 * inch))
    elements.append(Paragraph("______________________________", styles["Normal"]))
    elements.append(Spacer(1, 0.2 * inch))
    elements.append(Paragraph("Election Authority Signature", styles["Normal"]))

    elements.append(Spacer(1, 0.5 * inch))
    elements.append(Paragraph(
        f"Generated On: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        styles["Normal"]
    ))

    doc.build(elements)
    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"Winner_{winner.name}_Certificate.pdf",
        mimetype='application/pdf'
    )
