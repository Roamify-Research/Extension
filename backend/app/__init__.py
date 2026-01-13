from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os


def create_app():
    # Load environment variables
    load_dotenv()

    # Initialize the Flask application
    app = Flask(__name__)
    CORS(app)

    # Load configurations from config.py
    app.config.from_object("app.config.Config")

    # Initialize Extensions
    from app.extensions import db, bcrypt
    db.init_app(app)
    bcrypt.init_app(app)

    # Register Blueprints
    from app.routes.process import process_bp
    from app.routes.auth import auth_bp
    from app.routes.itinerary import itinerary_bp

    app.register_blueprint(process_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(itinerary_bp)

    # Create Database Tables
    with app.app_context():
        db.create_all()

    return app
