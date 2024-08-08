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
    app.config.from_object("app.config")

    # Register Blueprints
    from app.routes.process import process_bp

    app.register_blueprint(process_bp)

    return app
