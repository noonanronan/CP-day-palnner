import os
import logging
from flask import Flask, request
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

from config import ALLOWED_ORIGINS

CORS(
    app,
    resources={r"/*": {"origins": ALLOWED_ORIGINS if "*" not in ALLOWED_ORIGINS else "*"}},
    supports_credentials=False,
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

@app.after_request
def add_cors_headers(resp):
    origin = request.headers.get("Origin")
    allow_all = "*" in ALLOWED_ORIGINS
    if origin and (allow_all or origin in ALLOWED_ORIGINS):
        resp.headers["Access-Control-Allow-Origin"] = origin
        resp.headers["Vary"] = "Origin"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        resp.headers["Access-Control-Max-Age"] = "86400"
    return resp

# Database
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URI")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Keep the connection pool healthy on hosts that close idle conns (not needed for SQLite)
if not os.getenv("DATABASE_URI", "").startswith("sqlite"):
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }

# Logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s %(levelname)s: %(message)s')

from extensions import db
db.init_app(app)

# Register blueprints
from routes.auth import auth_bp
from routes.files import files_bp
from routes.availability import availability_bp
from routes.workers import workers_bp
from routes.schedule import schedule_bp

app.register_blueprint(auth_bp)
app.register_blueprint(files_bp)
app.register_blueprint(availability_bp)
app.register_blueprint(workers_bp)
app.register_blueprint(schedule_bp)

# Create database tables
with app.app_context():
    db.create_all()
    logging.info("Database tables created successfully!")

# Run the app
if __name__ == "__main__":
    logging.info("Starting Flask app...")
    app.run(debug=True, port=5001)
