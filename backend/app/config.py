import os


class Config:
    DEBUG = os.getenv("FLASK_DEBUG", True)
    TESTING = os.getenv("FLASK_TESTING", True)
    SECRET_KEY = os.getenv("SECRET_KEY", "roamify_key")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///app.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
