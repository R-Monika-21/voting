# config.py
import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'change-this-in-production-very-secure-random-string'

    # Try to read database URL from environment variable first
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')

    # If not set in environment → fallback to local SQLite (safe for development)
    if not SQLALCHEMY_DATABASE_URI:
        basedir = os.path.abspath(os.path.dirname(__file__))
        SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'voting.db')

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = os.environ.get('SQL_ECHO', 'False').lower() == 'true'

