from dotenv import load_dotenv
load_dotenv()
print("🔥🔥🔥 THIS IS MY REAL APP.PY 🔥🔥🔥")

import os
from datetime import timedelta
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_login import LoginManager


from extensions import db


from models.voter import Voter
from models.admin import Admin
from models.election import Election
from models.candidate import Candidate
from models.vote import Vote          


from routes.voter_routes import voter_bp
from routes.admin_routes import admin_bp
from routes.election_routes import election_bp
from routes.candidate_routes import candidate_bp
from routes.vote_routes import vote_bp
from routes.results_routes import results_bp 


app = Flask(__name__)

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, 'uploads')
SYMBOLS_DIR = os.path.join(UPLOADS_DIR, 'symbols')
app.config['UPLOAD_FOLDER'] = UPLOADS_DIR

os.makedirs(SYMBOLS_DIR, exist_ok=True)

@app.route('/uploads/symbols/<path:filename>')
def serve_uploaded_symbols(filename):
    return send_from_directory(SYMBOLS_DIR, filename)

CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://voting-orpin-seven.vercel.app"
        ],
        "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})


app.config.from_object('config.Config')


app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY') or 'super-secret-change-this-now'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'voter.voter_login'          

login_manager.login_message = "Please log in to access this page."
login_manager.login_message_category = "info"


@login_manager.user_loader
def load_user(user_id):
    return Voter.query.get(int(user_id))   

jwt = JWTManager(app)
db.init_app(app)

app.register_blueprint(voter_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(election_bp)
app.register_blueprint(candidate_bp)
app.register_blueprint(vote_bp)
app.register_blueprint(results_bp)


@app.route('/')
def index():
    return {"message": "Online Voting System API is running"}

if __name__ == '__main__':
    with app.app_context():
        db.create_all()


    print("\n===== REGISTERED ROUTES =====")
    for rule in app.url_map.iter_rules():
        print(rule)

    app.run(debug=True, host='0.0.0.0', port=5000)
    