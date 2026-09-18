from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from datetime import datetime
from bson import ObjectId

from app.database import get_db
from app.schemas.user import UserRegister, UserLogin, UserResponse, TokenResponse
from app.services.auth_service import (
    hash_password, verify_password, create_access_token,
    get_current_user, require_roles, normalize_role,
    ROLE_CITIZEN, ROLE_OFFICER, ROLE_CREW, VALID_ROLES
)

router = APIRouter(prefix="/api/auth", tags=["Authentication & User Management"])

DEFAULT_ACCOUNTS = {
    "crew@civic.gov": {
        "email": "crew@civic.gov",
        "password": "Crew123!",
        "full_name": "Arun Kumar (Crew Member)",
        "role": ROLE_CREW,
        "assigned_crew_id": "CREW-101",
        "assigned_team": "Electrical Team - North Zone",
        "phone": "+1-555-0103"
    },
    "officer@civic.gov": {
        "email": "officer@civic.gov",
        "password": "Officer123!",
        "full_name": "Municipal Officer Dave",
        "role": ROLE_OFFICER,
        "phone": "+1-555-0101"
    },
    "citizen@civic.gov": {
        "email": "citizen@civic.gov",
        "password": "Citizen123!",
        "full_name": "Jane Citizen",
        "role": ROLE_CITIZEN,
        "phone": "+1-555-0102"
    }
}

def format_user_doc(doc: dict) -> dict:
    role = normalize_role(doc.get("role", ROLE_CITIZEN))
    return {
        "id": str(doc["_id"]),
        "email": doc["email"],
        "full_name": doc.get("full_name", ""),
        "role": role,
        "phone": doc.get("phone"),
        "assigned_crew_id": doc.get("assigned_crew_id", "CREW-101" if role == ROLE_CREW else None),
        "assigned_team": doc.get("assigned_team", "Electrical Team - North Zone" if role == ROLE_CREW else None),
        "created_at": doc.get("created_at", datetime.now().isoformat())
    }

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_citizen(payload: UserRegister, db=Depends(get_db)):
    """
    Public self-registration endpoint for Citizens.
    Self-registration is strictly restricted to the 'Citizen' role.
    Municipal Officer and Crew accounts must NOT be allowed to self-register.
    """
    users_col = db["users"]
    email_clean = payload.email.lower().strip()
    
    # Check if user already exists
    if users_col.find_one({"email": email_clean}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An account with email '{payload.email}' already exists."
        )
        
    # Strictly reject any registration payload attempting to specify non-Citizen roles (Officer, Crew, etc.)
    if payload.role:
        requested_role = normalize_role(payload.role)
        if requested_role != ROLE_CITIZEN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Registration restricted: Municipal Officer and Crew accounts cannot be self-registered. Only Citizens can register through the public portal."
            )
        
    now_str = datetime.now().isoformat()
    user_doc = {
        "email": email_clean,
        "password_hash": hash_password(payload.password),
        "full_name": payload.full_name.strip(),
        "phone": payload.phone.strip() if payload.phone else None,
        "role": ROLE_CITIZEN,
        "created_at": now_str,
        "updated_at": now_str
    }

    
    res = users_col.insert_one(user_doc)
    user_doc["_id"] = res.inserted_id
    
    token = create_access_token(data={
        "sub": str(res.inserted_id),
        "email": email_clean,
        "role": ROLE_CITIZEN,
        "full_name": user_doc["full_name"]
    })
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in_minutes": 1440,
        "user": format_user_doc(user_doc)
    }

@router.post("/login", response_model=TokenResponse)
def login_user(payload: UserLogin, db=Depends(get_db)):
    """
    Authenticate user (Citizen, Municipal Officer, or Crew) and return JWT access token.
    """
    users_col = db["users"]
    email_clean = payload.email.lower().strip()
    
    user_doc = users_col.find_one({"email": email_clean})

    # Auto-seed standard accounts if logging in with default credentials for demo convenience
    if not user_doc and email_clean in DEFAULT_ACCOUNTS:
        default_seed = DEFAULT_ACCOUNTS[email_clean]
        now_str = datetime.now().isoformat()
        user_doc = {
            "email": default_seed["email"],
            "password_hash": hash_password(default_seed["password"]),
            "full_name": default_seed["full_name"],
            "role": default_seed["role"],
            "assigned_crew_id": default_seed.get("assigned_crew_id"),
            "assigned_team": default_seed.get("assigned_team"),
            "phone": default_seed.get("phone"),
            "created_at": now_str,
            "updated_at": now_str
        }
        res = users_col.insert_one(user_doc)
        user_doc["_id"] = res.inserted_id

    if not user_doc or not verify_password(payload.password, user_doc.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )
        
    user_role = normalize_role(user_doc.get("role", ROLE_CITIZEN))
    token = create_access_token(data={
        "sub": str(user_doc["_id"]),
        "email": email_clean,
        "role": user_role,
        "full_name": user_doc.get("full_name", "")
    })
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in_minutes": 1440,
        "user": format_user_doc(user_doc)
    }

@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: dict = Depends(get_current_user)):
    """
    Retrieve profile details of the currently authenticated user.
    """
    return format_user_doc(current_user)
