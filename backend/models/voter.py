# models/voter.py
from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash

class Voter(db.Model):
    __tablename__ = 'voter'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_name = db.Column(db.String(100), nullable=False)
    roll_no = db.Column(db.String(50), unique=True, nullable=False)
    major = db.Column(db.String(50), nullable=False)
    course = db.Column(db.String(50), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)

    def __init__(self, student_name, roll_no, major, course, year, email, password):
        self.student_name = student_name
        self.roll_no = roll_no
        self.major = major
        self.course = course
        self.year = year
        self.email = email
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)