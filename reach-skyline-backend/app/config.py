# app/config.py
import os
from datetime import timedelta
from dotenv import load_dotenv

# Load .env file
load_dotenv(override=True)

class Config:
    # ----------------------------------------
    # DATABASE CONFIGURATION
    # ----------------------------------------
    # Try to build MySQL URI from env vars, fallback to SQLite for local dev
    DB_USER = os.environ.get("DB_USER")
    DB_PASS = os.environ.get("DB_PASSWORD")
    DB_HOST = os.environ.get("DB_HOST", "localhost")
    DB_PORT = os.environ.get("DB_PORT", "3306")
    DB_NAME = os.environ.get("DB_NAME")

    if DB_USER and DB_PASS and DB_NAME:
        # Construct MySQL URI (using pymysql)
        SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    else:
        basedir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
        SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'instance', 'dev.db')

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ----------------------------------------
    # JWT CONFIGURATION
    # ----------------------------------------
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "super-secret-key")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)

    # ----------------------------------------
    # UPLOAD CONFIGURATION
    # ----------------------------------------
    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
