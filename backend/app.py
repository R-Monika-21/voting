from dotenv import load_dotenv
load_dotenv()               # load .env file

from flask import Flask
from flask_cors import CORS

# Import shared extensions
from extensions import db

# Import all models so they are registered with SQLAlchemy
from models.voter import Voter
from models.admin import Admin
from models.election import Election
# from models.vote import Vote   # uncomment if needed

# Import blueprints
from routes.voter_routes import voter_bp
from routes.admin_routes import admin_bp
from routes.election_routes import election_bp
# from routes.vote_routes import vote_bp   # if exists

app = Flask(__name__)

# CORS - allow frontend (change "*" to your React URL in production)
CORS(app, resources={
    r"/api/*": {
        "origins": "*",  
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Load configuration
app.config.from_object('config.Config')

# Initialize extensions
db.init_app(app)

# Register all blueprints
app.register_blueprint(voter_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(election_bp)
# app.register_blueprint(vote_bp)   # if exists

@app.route('/')
def index():
    return {"message": "Online Voting System API is running"}

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # creates all tables defined in models

        # Optional: create default admin (run once, then comment out)
        # from models.admin import Admin
        # if not Admin.query.filter_by(email="admin@example.com").first():
        #     admin = Admin(
        #         name="Super Admin",
        #         admin_id="ADMIN001",
        #         position="System Administrator",
        #         email="admin@example.com",
        #         password="admin123"          # ← consider hashing in production
        #     )
        #     db.session.add(admin)
        #     db.session.commit()
        #     print("Default admin created")

    app.run(debug=True, host='0.0.0.0', port=5000)