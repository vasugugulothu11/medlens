import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file if available
load_dotenv()

class Settings:
    """
    Application runtime configuration.
    Reads environment variables for database connections, API keys, and runtime flags.
    """
    PROJECT_NAME: str = "MedLens — AI-Powered Clinical Information Intelligence"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # Database URL: default to SQLite for hackathon prototyping, easily swappable to PostgreSQL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./medlens.db")

    # Gemini API Key (accepts GOOGLE_API_KEY or GEMINI_API_KEY)
    GOOGLE_API_KEY: Optional[str] = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

    # Model preference
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

settings = Settings()
