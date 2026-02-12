from dotenv import load_dotenv
load_dotenv()  # loads variables from .env file

import os
from flask import Flask
from flask_cors import CORS

# Import shared extensions
from extensions import db

# Import all models so they are registered with SQLAlchemy
from models.voter import Voter
from models.admin import Admin
from models.election import Election
from models.candidate import Candidate
# from models.vote import Vote  # uncomment when needed

# Import blueprints
from routes.voter_routes import voter_bp
from routes.admin_routes import admin_bp
from routes.election_routes import election_bp
from routes.candidate_routes import candidate_bp
# from routes.vote_routes import vote_bp  # if exists

app = Flask(__name__)

# Upload folder setup
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
app.config['UPLOAD_FOLDER'] = os.path.join(BASE_DIR, 'uploads', 'symbols')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# CORS configuration - allow frontend (use specific origin in production)
CORS(app, resources={
    r"/api/*": {
        "origins": "*",  # ← change to "http://localhost:3000" or your frontend URL in production
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Load configuration from config.py
app.config.from_object('config.Config')

# Initialize extensions
db.init_app(app)

# Register blueprints
app.register_blueprint(voter_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(election_bp)  
app.register_blueprint(candidate_bp)   # ← this has url_prefix='/api/admin'

# Optional root route for testing
@app.route('/')
def index():
    return {"message": "Online Voting System API is running"}

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # creates tables if they don't exist

        # Optional: create default admin (run once, then comment out or remove)
        # from models.admin import Admin
        # if not Admin.query.filter_by(email="admin@example.com").first():
        #     admin = Admin(
        #         name="Super Admin",
        #         admin_id="ADMIN001",
        #         position="System Administrator",
        #         email="admin@example.com",
        #         password="admin123"  # ← hash this in production!
        #     )
        #     db.session.add(admin)
        #     db.session.commit()
        #     print("Default admin created")

    app.run(debug=True, host='0.0.0.0', port=5000)