from extensions import db

class Candidate(db.Model):
    __tablename__ = 'candidate'

    id = db.Column(db.Integer, primary_key=True)
    election_id = db.Column(db.Integer, db.ForeignKey('elections.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    roll_no = db.Column(db.String(50), nullable=False, unique=True)
    major = db.Column(db.String(100), nullable=False)
    course = db.Column(db.String(100), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    symbol = db.Column(db.String(255), nullable=False)  # relative path e.g. symbols/filename.jpg
    email = db.Column(db.String(120), nullable=False, unique=True)

    def __repr__(self):
        return f'<Candidate {self.name} (ID: {self.id})>'

    def to_dict(self):
        return {
            'id': self.id,
            'election_id': self.election_id,
            'name': self.name,
            'roll_no': self.roll_no,
            'major': self.major,
            'course': self.course,
            'year': self.year,
            'symbol': self.symbol,
            'email': self.email
        }
    

    