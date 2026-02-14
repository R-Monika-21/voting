from dotenv import load_dotenv
load_dotenv()

import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager

# extensions
from extensions import db

# models (import so SQLAlchemy knows them)
from models.voter import Voter
from models.admin import Admin
from models.election import Election
from models.candidate import Candidate
# from models.vote import Vote

# blueprints
from routes.voter_routes import voter_bp
from routes.admin_routes import admin_bp
from routes.election_routes import election_bp
from routes.candidate_routes import candidate_bp
from routes.vote_routes import vote_bp
# from routes.vote_routes import vote_bp

app = Flask(__name__)

# ── Upload & static file serving ───────────────────────────────────────
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, 'uploads')
SYMBOLS_DIR = os.path.join(UPLOADS_DIR, 'symbols')
app.config['UPLOAD_FOLDER'] = UPLOADS_DIR

os.makedirs(SYMBOLS_DIR, exist_ok=True)

# Serve candidate symbols
@app.route('/uploads/symbols/<path:filename>')
def serve_uploaded_symbols(filename):
    return send_from_directory(SYMBOLS_DIR, filename)

# ── CORS ────────────────────────────────────────────────────────────────
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5173",   # Vite default
            "http://localhost:4200",   # Angular dev (optional)
        ],
        "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Accept"],
        "supports_credentials": True,
        "max_age": 86400
    }
})

# ── Configuration ───────────────────────────────────────────────────────
app.config.from_object('config.Config')

# JWT settings
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY') or 'super-secret-change-this-now'
# app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)   # optional

jwt = JWTManager(app)
db.init_app(app)

# ── Register blueprints ─────────────────────────────────────────────────
app.register_blueprint(voter_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(election_bp)
app.register_blueprint(candidate_bp)
app.register_blueprint(vote_bp)

@app.route('/')
def index():
    return {"message": "Online Voting System API is running"}

if __name__ == '__main__':
    with app.app_context():
        db.create_all()

        # Optional: seed default admin (comment out after first run)
        # ...

    app.run(debug=True, host='0.0.0.0', port=5000)