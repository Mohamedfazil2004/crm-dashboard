# app/config.py
import os
from datetime import timedelta
from dotenv import load_dotenv

# Load .env file
load_dotenv(override=True)

class Config:
    # ----------------------------------------
    # DATABASE CONFIGURATION (MySQL Required)
    # ----------------------------------------
    # FORCING SQLITE FOR NOW
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
