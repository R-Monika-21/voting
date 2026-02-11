# models/admin.py
from extensions import db

class Admin(db.Model):
    __tablename__ = 'admin'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    admin_id = db.Column(db.String(50), unique=True, nullable=False)
    position = db.Column(db.String(100))
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)

    def __init__(self, name, admin_id, position, email, password):
        self.name = name
        self.admin_id = admin_id
        self.position = position
        self.email = email
        self.password = password   # plain text as requested