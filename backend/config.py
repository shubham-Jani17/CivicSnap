import os
import logging
import sys
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from google import genai
import firebase_admin
from firebase_admin import credentials, firestore, auth

# ─── LOGGING CONFIGURATION ───
# Setting up standard structured logging for production readability
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s (%(filename)s:%(lineno)d) - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("civicsnap-backend")


# ─── ENVIRONMENT SETTINGS ───
class Settings(BaseSettings):
    # App Settings
    app_name: str = "CivicSnap FastAPI Backend"
    environment: str = "production"
    debug: bool = False
    port: int = 3000
    host: str = "0.0.0.0"

    # API Keys & Secrets
    gemini_api_key: Optional[str] = None
    
    # Firebase Credentials
    # In production, Firebase Admin can auto-detect credentials via ADC
    # (Application Default Credentials) or via a path to service account JSON
    firebase_service_account_path: Optional[str] = None
    firebase_project_id: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure we log validation results
logger.info(f"Loaded configurations for: {settings.app_name} (Env: {settings.environment})")


# ─── FIREBASE & GEMINI LAZY CLIENT INITIALIZERS ───
_firebase_app = None
_firestore_db = None
_gemini_client = None

def init_firebase() -> firebase_admin.App:
    """Initializes the Firebase Admin SDK safely."""
    global _firebase_app, _firestore_db
    if _firebase_app is not None:
        return _firebase_app

    try:
        # Check if service account JSON path is specified
        if settings.firebase_service_account_path and Path(settings.firebase_service_account_path).exists():
            logger.info(f"Initializing Firebase with service account from: {settings.firebase_service_account_path}")
            cred = credentials.Certificate(settings.firebase_service_account_path)
            _firebase_app = firebase_admin.initialize_app(cred)
        else:
            # Fall back to application default credentials or project ID environment setting
            logger.info("Initializing Firebase Admin SDK using Application Default Credentials (ADC).")
            if settings.firebase_project_id:
                _firebase_app = firebase_admin.initialize_app(options={
                    "projectId": settings.firebase_project_id
                })
            else:
                _firebase_app = firebase_admin.initialize_app()
        
        logger.info("Firebase Admin SDK successfully initialized.")
        return _firebase_app
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
        logger.warning("Running Firebase services in local-only / mock fallback mode.")
        return None

def get_firestore_client():
    """Gets the initialized Firestore client."""
    global _firestore_db
    if _firestore_db is not None:
        return _firestore_db
    
    init_firebase()
    try:
        # Firestore client requires active app
        _firestore_db = firestore.client()
        return _firestore_db
    except Exception as e:
        logger.error(f"Firestore Client retrieval failed: {e}")
        return None

def get_gemini_client() -> Optional[genai.Client]:
    """Gets or initializes the modern Google GenAI Client."""
    global _gemini_client
    if _gemini_client is not None:
        return _gemini_client

    api_key = settings.gemini_api_key or os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.warning("GEMINI_API_KEY is not configured. AI operations will fall back to demonstration defaults.")
        return None

    try:
        # Initializing the modern Google GenAI SDK Client
        _gemini_client = genai.Client(api_key=api_key)
        logger.info("Google GenAI client successfully initialized.")
        return _gemini_client
    except Exception as e:
        logger.error(f"Failed to initialize Google GenAI Client: {e}")
        return None
