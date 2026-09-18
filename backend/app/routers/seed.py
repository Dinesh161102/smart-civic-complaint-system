from fastapi import APIRouter, Depends
from datetime import datetime, timedelta
import uuid
from app.database import get_db
from app.services.auth_service import require_roles, hash_password, ROLE_OFFICER, ROLE_CITIZEN, ROLE_CREW

router = APIRouter(prefix="/api/seed", tags=["Seed Dataset Generator"])

STANDARD_SEED_USERS = [
    {
        "email": "officer@civic.gov",
        "password": "Officer123!",
        "full_name": "Municipal Officer Dave",
        "role": ROLE_OFFICER,
        "phone": "+1-555-0101"
    },
    {
        "email": "citizen@civic.gov",
        "password": "Citizen123!",
        "full_name": "Jane Citizen",
        "role": ROLE_CITIZEN,
        "phone": "+1-555-0102"
    },
    {
        "email": "crew@civic.gov",
        "password": "Crew123!",
        "full_name": "Arun Kumar (Crew Member)",
        "role": ROLE_CREW,
        "assigned_crew_id": "CREW-101",
        "assigned_team": "Electrical Team - North Zone",
        "phone": "+1-555-0103"
    }
]

@router.post("", status_code=201)
@router.post("/", status_code=201)
def seed_dataset(
    current_officer: dict = Depends(require_roles([ROLE_OFFICER])),
    db=Depends(get_db)
):
    """
    Ensures standard pre-configured role test accounts exist in MongoDB without inserting mock complaints.
    Restricted to Municipal Officer role.
    """
    users_col = db["users"]
    now = datetime.now()
    
    seeded_users = []
    for u in STANDARD_SEED_USERS:
        existing = users_col.find_one({"email": u["email"]})
        if not existing:
            users_col.insert_one({
                "email": u["email"],
                "password_hash": hash_password(u["password"]),
                "full_name": u["full_name"],
                "role": u["role"],
                "assigned_crew_id": u.get("assigned_crew_id", ""),
                "assigned_team": u.get("assigned_team", ""),
                "phone": u.get("phone", ""),
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            })
            seeded_users.append(f"{u['email']} ({u['role']})")
        else:
            seeded_users.append(f"{u['email']} (Active)")
            
    return {
        "message": f"Verified and synced {len(seeded_users)} standard role accounts. Complaints database remains clean.",
        "tickets": [],
        "users": seeded_users
    }
