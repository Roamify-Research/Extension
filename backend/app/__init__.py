from flask import Flask
from dotenv import load_dotenv
import os

def create_app():
  # Load environment variables
  load_dotenv()

  # Initialize the Flask application
  app = Flask(__name__)

  # Load configurations from config.py
  app.config.from_object('app.config')

  # Register Blueprints
  from app.routes.process import process_bp
  app.register_blueprint(process_bp)

  return app
