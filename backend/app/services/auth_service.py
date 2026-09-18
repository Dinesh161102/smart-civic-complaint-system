import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId

from app.config import settings
from app.database import get_db

# HTTP Bearer security scheme
security_scheme = HTTPBearer(auto_error=False)

# Standard Role Definitions
ROLE_CITIZEN = "Citizen"
ROLE_OFFICER = "Municipal Officer"
ROLE_CREW = "Crew"

VALID_ROLES = [ROLE_CITIZEN, ROLE_OFFICER, ROLE_CREW]

# Map alternative role aliases
ROLE_ALIASES = {
    "CITIZEN": ROLE_CITIZEN,
    "Citizen": ROLE_CITIZEN,
    "OFFICER": ROLE_OFFICER,
    "Municipal Officer": ROLE_OFFICER,
    "MUNICIPAL OFFICER": ROLE_OFFICER,
    "Officer": ROLE_OFFICER,
    "CREW": ROLE_CREW,
    "Crew": ROLE_CREW,
    "FIELD CREW": ROLE_CREW,
    "Field Crew": ROLE_CREW,
    "field_crew": ROLE_CREW,
    "crew": ROLE_CREW
}

def normalize_role(role_input: str) -> str:
    if not role_input:
        return ROLE_CITIZEN
    cleaned = role_input.strip()
    return ROLE_ALIASES.get(cleaned, ROLE_ALIASES.get(cleaned.upper(), ROLE_CITIZEN))

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    pwd_bytes = plain_password.encode('utf-8')[:72]
    hash_bytes = hashed_password.encode('utf-8')
    try:
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode.update({
        "exp": expire,
        "iat": now
    })
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please login again.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"}
        )

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme), db = Depends(get_db)) -> dict:
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing or invalid. Provide a valid Bearer token in the Authorization header.",
            headers={"WWW-Authenticate": "Bearer"}
        )
        
    token = credentials.credentials
    payload = decode_access_token(token)
    
    user_id = payload.get("sub")
    email = payload.get("email")
    
    if not user_id and not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload.",
            headers={"WWW-Authenticate": "Bearer"}
        )
        
    users_col = db["users"]
    user_doc = None
    
    if user_id and ObjectId.is_valid(user_id):
        user_doc = users_col.find_one({"_id": ObjectId(user_id)})
    if not user_doc and email:
        user_doc = users_col.find_one({"email": email.lower()})
        
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user no longer exists in system.",
            headers={"WWW-Authenticate": "Bearer"}
        )
        
    user_doc["id"] = str(user_doc["_id"])
    user_doc["role"] = normalize_role(user_doc.get("role", ROLE_CITIZEN))
    return user_doc

def get_optional_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme), db = Depends(get_db)) -> Optional[dict]:
    if not credentials or not credentials.credentials:
        return None
    try:
        token = credentials.credentials
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        email = payload.get("email")
        users_col = db["users"]
        user_doc = None
        if user_id and ObjectId.is_valid(user_id):
            user_doc = users_col.find_one({"_id": ObjectId(user_id)})
        if not user_doc and email:
            user_doc = users_col.find_one({"email": email.lower()})
        if user_doc:
            user_doc["id"] = str(user_doc["_id"])
            user_doc["role"] = normalize_role(user_doc.get("role", ROLE_CITIZEN))
            return user_doc
    except Exception:
        pass
    return None

def require_roles(allowed_roles: List[str]):
    normalized_allowed = [normalize_role(r) for r in allowed_roles]
    
    def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = normalize_role(current_user.get("role", ROLE_CITIZEN))
        if user_role not in normalized_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: Operation requires one of roles {allowed_roles}. Your current role is '{user_role}'."
            )
        return current_user
        
    return role_checker


