# app/config.py
import os
from datetime import timedelta
from dotenv import load_dotenv

# Load .env file only if it exists (for local development)
# Do NOT use override=True so that Render's platform variables take precedence
if os.path.exists(".env"):
    load_dotenv()

class Config:
    # ----------------------------------------
    # DATABASE CONFIGURATION
    # ----------------------------------------
    # Priority 1: Direct DATABASE_URL (Used by Render/Railway)
    db_url = os.environ.get("DATABASE_URL")
    
    if db_url:
        # Handle Render's 'postgres://' which must be 'postgresql://' for SQLAlchemy
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        # Ensure 'mysql://' uses 'mysql+pymysql://'
        elif db_url.startswith("mysql://"):
            db_url = db_url.replace("mysql://", "mysql+pymysql://", 1)
        SQLALCHEMY_DATABASE_URI = db_url
    else:
        # Priority 2: Individual MySQL Env Vars
        DB_USER = os.environ.get("DB_USER")
        DB_PASS = os.environ.get("DB_PASSWORD")
        DB_HOST = os.environ.get("DB_HOST", "localhost")
        DB_PORT = os.environ.get("DB_PORT", "3306")
        DB_NAME = os.environ.get("DB_NAME")

        if DB_USER and DB_PASS and DB_NAME:
            SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        else:
            # Priority 3: Local SQLite fallback
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
