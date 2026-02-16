from dotenv import load_dotenv
load_dotenv()
print("🔥🔥🔥 THIS IS MY REAL APP.PY 🔥🔥🔥")

import os
from datetime import timedelta
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_login import LoginManager

# extensions
from extensions import db

# models (import so SQLAlchemy knows them)
from models.voter import Voter
from models.admin import Admin
from models.election import Election
from models.candidate import Candidate
from models.vote import Vote          # ← uncommented (you need this)

# blueprints
from routes.voter_routes import voter_bp
from routes.admin_routes import admin_bp
from routes.election_routes import election_bp
from routes.candidate_routes import candidate_bp
from routes.vote_routes import vote_bp

app = Flask(__name__)

# ── Upload & static file serving ───────────────────────────────────────
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, 'uploads')
SYMBOLS_DIR = os.path.join(UPLOADS_DIR, 'symbols')
app.config['UPLOAD_FOLDER'] = UPLOADS_DIR

os.makedirs(SYMBOLS_DIR, exist_ok=True)

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

# JWT settings (still keeping it — in case you use it in some routes)
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY') or 'super-secret-change-this-now'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# ── Flask-Login setup (this was missing!) ───────────────────────────────
login_manager = LoginManager()
login_manager.init_app(app)

# Where to redirect when @login_required fails (adjust route name!)
# Examples:
#   - if you have blueprint: 'voter.login'
#   - if plain route:        'login'
login_manager.login_view = 'voter.voter_login'          # ← MOST IMPORTANT LINE – CHANGE TO MATCH YOUR LOGIN ROUTE

login_manager.login_message = "Please log in to access this page."
login_manager.login_message_category = "info"

# Tell Flask-Login how to load a Voter from user_id (session)
@login_manager.user_loader
def load_user(user_id):
    return Voter.query.get(int(user_id))   # Voter is your user model for voters

# Optional: if you also want admins to be loadable (advanced)
# You can later extend it or use different logic
# ────────────────────────────────────────────────────────────────────────

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

        # Optional: seed default admin or test voter (only once)
        # from models.admin import Admin
        # if not Admin.query.first():
        #     admin = Admin(username="admin", email="admin@example.com", password_hash="...")
        #     db.session.add(admin)
        #     db.session.commit()
    print("\n===== REGISTERED ROUTES =====")
    for rule in app.url_map.iter_rules():
        print(rule)


    app.run(debug=True, host='0.0.0.0', port=5000)