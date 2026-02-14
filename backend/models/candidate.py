from extensions import db

class Candidate(db.Model):
    __tablename__ = 'candidate'

    id = db.Column(db.Integer, primary_key=True)
    election_id = db.Column(db.Integer, db.ForeignKey('elections.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    roll_no = db.Column(db.String(50), nullable=False, unique=True)
    major = db.Column(db.String(50), nullable=False)
    course = db.Column(db.String(50), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    symbol = db.Column(db.String(255), nullable=False)  # e.g. "symbols/naruto.jpg"
    email = db.Column(db.String(100), nullable=False, unique=True)
    count = db.Column(db.Integer, default=0, nullable=False)

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
            'email': self.email,
            # ────────────── Add this line ──────────────
            'symbol_url': self.get_symbol_url()
        }

    def get_symbol_url(self):
        """
        Returns full public URL for the symbol.
        Assumes files are served from /uploads/symbols/
        and database stores path like 'symbols/filename.jpg'
        """
        if not self.symbol:
            return None
        
        # If it already starts with /uploads/ → use as is
        if self.symbol.startswith('/uploads/'):
            return self.symbol
            
        # If it starts with symbols/ → convert to full URL
        if self.symbol.startswith('symbols/'):
            filename = self.symbol.replace('symbols/', '', 1)
            return f"/uploads/symbols/{filename}"
        
        # Fallback: assume it's just filename
        return f"/uploads/symbols/{self.symbol}"