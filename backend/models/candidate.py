from extensions import db

class Candidate(db.Model):
    __tablename__ = 'candidate'  # plural is conventional

    id = db.Column(db.Integer, primary_key=True)
    election_id = db.Column(db.Integer, db.ForeignKey('elections.id'), nullable=False)  # table name should match Election
    name = db.Column(db.String(100), nullable=False)
    roll_no = db.Column(db.String(50), nullable=False, unique=True)
    major = db.Column(db.String(100), nullable=False)
    course = db.Column(db.String(100), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    symbol = db.Column(db.String(255), nullable=False)  # relative path
    email = db.Column(db.String(120), nullable=False, unique=True)

    def __repr__(self):
        return f'<Candidate {self.name} (ID: {self.id})>'