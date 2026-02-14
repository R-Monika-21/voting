from extensions import db

class Vote(db.Model):
    __tablename__ = 'vote'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    voter_id     = db.Column(db.Integer, nullable=False)
    candidate_id = db.Column(db.Integer, nullable=False)
    election_id  = db.Column(db.Integer, nullable=False)

    __table_args__ = (
        db.UniqueConstraint('voter_id', 'election_id', name='unique_voter_election'),
    )