import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Smart Civic Complaint & Issue Management System"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "civic_complaints_db")
    
    # JWT Authentication Configuration
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "civic-secret-key-super-secure-jwt-token-2026-xyz!")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 Hours
    
    # SLA thresholds in hours by Priority
    SLA_HOURS = {
        "Critical": 4,
        "High": 24,
        "Medium": 48,
        "Low": 72
    }
    
    # Category baseline weights (1.0 - 5.0)
    CATEGORY_WEIGHTS = {
        "Water Supply": 4.5,
        "Electrical / Streetlight": 3.5,
        "Streetlight": 3.5,
        "Pothole / Road": 3.0,
        "Garbage / Sanitation": 2.5,
        "Sewage / Drainage": 4.0,
        "Parks & Tree": 2.0,
        "Other": 2.0
    }
    
    # AI Engine & Local LLM (Ollama)
    ENABLE_OLLAMA: bool = os.getenv("ENABLE_OLLAMA", "true").lower() in ("true", "1", "yes")
    OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen2.5:1.5b-instruct")
    OLLAMA_TIMEOUT: float = float(os.getenv("OLLAMA_TIMEOUT", "3.0"))

    # CORS Allowed Origins
    ALLOWED_ORIGINS: list = [
        origin.strip()
        for origin in os.getenv(
            "ALLOWED_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
        ).split(",")
        if origin.strip()
    ]

settings = Settings()
