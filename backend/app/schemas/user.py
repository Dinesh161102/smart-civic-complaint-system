from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional

class UserRegister(BaseModel):
    email: EmailStr = Field(..., json_schema_extra={"example": "citizen@example.com"})
    password: str = Field(..., min_length=6, json_schema_extra={"example": "Citizen123!"})
    full_name: str = Field(..., json_schema_extra={"example": "Jane Citizen"})
    phone: Optional[str] = Field(None, json_schema_extra={"example": "+1-555-0199"})
    role: Optional[str] = Field("Citizen", json_schema_extra={"example": "Citizen"}, description="Self-registration role is restricted to Citizen.")

class UserLogin(BaseModel):
    email: EmailStr = Field(..., json_schema_extra={"example": "citizen@example.com"})
    password: str = Field(..., json_schema_extra={"example": "Citizen123!"})

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    email: str
    full_name: str
    role: str
    phone: Optional[str] = None
    assigned_crew_id: Optional[str] = None
    assigned_team: Optional[str] = None
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int
    user: UserResponse
