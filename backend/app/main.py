from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from app.config import settings
from app.database import db_manager
from app.routers import auth, complaints, analytics, ai, seed
from app.services.auth_service import hash_password, ROLE_OFFICER, ROLE_CITIZEN, ROLE_CREW
from app.services.ollama_manager import ensure_ollama_running

@asynccontextmanager
async def lifespan(app: FastAPI):
    db_manager.connect()
    
    # Start Ollama automatically if it is not already running, but do not block startup.
    ensure_ollama_running()

    # Auto-seed default test role accounts if not present
    db = db_manager.db
    if db is not None:
        users_col = db["users"]
        now_str = datetime.now().isoformat()
        
        default_users = [
            {"email": "officer@civic.gov", "password": "Officer123!", "full_name": "Municipal Officer Dave", "role": ROLE_OFFICER},
            {"email": "citizen@civic.gov", "password": "Citizen123!", "full_name": "Jane Citizen", "role": ROLE_CITIZEN},
            {"email": "crew@civic.gov", "password": "Crew123!", "full_name": "Arun Kumar (Crew Member)", "role": ROLE_CREW, "assigned_crew_id": "CREW-101", "assigned_team": "Electrical Team - North Zone"}
        ]
        
        for u in default_users:
            if not users_col.find_one({"email": u["email"]}):
                users_col.insert_one({
                    "email": u["email"],
                    "password_hash": hash_password(u["password"]),
                    "full_name": u["full_name"],
                    "role": u["role"],
                    "assigned_crew_id": u.get("assigned_crew_id", ""),
                    "assigned_team": u.get("assigned_team", ""),
                    "created_at": now_str,
                    "updated_at": now_str
                })
                
    print("*" * 65, flush=True)
    print(f" [CIVIC BACKEND]   APPLICATION STARTUP COMPLETE WITH JWT RBAC", flush=True)
    print(f" [SERVER URL]      http://localhost:8000", flush=True)
    print(f" [HEALTH CHECK]    http://localhost:8000/", flush=True)
    print(f" [SWAGGER STATUS]  DISABLED (docs_url=None)", flush=True)
    print("*" * 65 + "\n", flush=True)
    yield

# Disable Swagger UI & OpenAPI docs as explicitly requested
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend REST API for Smart Civic Complaint Management with Secure JWT Role-Based Access Control (RBAC).",
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
    lifespan=lifespan
)

# Enable CORS for frontend and Postman clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router)
app.include_router(complaints.router)
app.include_router(analytics.router)
app.include_router(ai.router)
app.include_router(seed.router)

@app.get("/", tags=["Health Check"])
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "database": "MongoDB (Active)" if not db_manager.is_mock else "Mongomock In-Memory (Active)",
        "rbac_enabled": True,
        "roles_supported": [ROLE_CITIZEN, ROLE_OFFICER, ROLE_CREW],
        "swagger_disabled": True,
        "postman_ready": True
    }
