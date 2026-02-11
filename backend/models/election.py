# backend/models/election.py
from extensions import db          # ← fixed: ..extensions
from datetime import datetime

class Election(db.Model):
    __tablename__ = 'elections'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    election_name = db.Column(db.String(100), nullable=False)
    election_date = db.Column(db.Date, nullable=False)          # start date
    election_time = db.Column(db.Time, nullable=False)          # start time
    end_date = db.Column(db.Date, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    result_date = db.Column(db.Date, nullable=False)
    result_time = db.Column(db.Time, nullable=False)
    
    election_status = db.Column(
        db.Enum('UPCOMING', 'ACTIVE', 'CLOSED', name='election_status_enum'),
        default='UPCOMING',
        nullable=False
    )


    def __repr__(self):
        return f"<Election {self.election_name} - {self.election_status}>"

    def to_dict(self):
        return {
            'id': self.id,
            'election_name': self.election_name,
            'start_date': self.election_date.isoformat() if self.election_date else None,
            'start_time': self.election_time.strftime('%H:%M') if self.election_time else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'end_time': self.end_time.strftime('%H:%M') if self.end_time else None,
            'result_date': self.result_date.isoformat() if self.result_date else None,
            'result_time': self.result_time.strftime('%H:%M') if self.result_time else None,
            'status': self.election_status,
        }