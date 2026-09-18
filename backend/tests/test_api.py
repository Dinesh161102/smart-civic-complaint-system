from fastapi.testclient import TestClient
import pytest
import uuid
from datetime import datetime
from app.main import app
from app.database import get_db
from app.services.auth_service import hash_password, ROLE_OFFICER, ROLE_CITIZEN

@pytest.fixture(autouse=True)
def setup_default_users():
    """
    Ensure standard role test accounts exist in the database before running tests.
    """
    db = get_db()
    users_col = db["users"]
    now_str = datetime.now().isoformat()
    
    default_users = [
        {"email": "officer@civic.gov", "password": "Officer123!", "full_name": "Municipal Officer Dave", "role": ROLE_OFFICER},
        {"email": "citizen@civic.gov", "password": "Citizen123!", "full_name": "Jane Citizen", "role": ROLE_CITIZEN}
    ]
    
    for u in default_users:
        if not users_col.find_one({"email": u["email"]}):
            users_col.insert_one({
                "email": u["email"],
                "password_hash": hash_password(u["password"]),
                "full_name": u["full_name"],
                "role": u["role"],
                "created_at": now_str,
                "updated_at": now_str
            })

client = TestClient(app)


def test_ollama_startup_guard_skips_when_running(monkeypatch):
    from app.services.ollama_manager import ensure_ollama_running

    called = {"popen": False}

    monkeypatch.setattr("app.services.ollama_manager.is_ollama_running", lambda timeout=1.5: True)
    monkeypatch.setattr("app.services.ollama_manager.shutil.which", lambda name: "/usr/bin/ollama")
    monkeypatch.setattr(
        "app.services.ollama_manager.subprocess.Popen",
        lambda *args, **kwargs: (called.__setitem__("popen", True), object())[1]
    )

    ensure_ollama_running()
    assert called["popen"] is False


def test_ollama_startup_guard_starts_when_needed(monkeypatch):
    from app.services.ollama_manager import ensure_ollama_running

    called = {"popen": False}

    monkeypatch.setenv("ENABLE_OLLAMA", "true")
    monkeypatch.setattr("app.services.ollama_manager.is_ollama_running", lambda timeout=1.5: False)
    monkeypatch.setattr("app.services.ollama_manager.find_ollama_executable", lambda: "/usr/bin/ollama")
    monkeypatch.setattr(
        "app.services.ollama_manager.subprocess.Popen",
        lambda *args, **kwargs: (called.__setitem__("popen", True), object())[1]
    )

    ensure_ollama_running(async_mode=False)
    assert called["popen"] is True


def test_ollama_startup_guard_handles_missing_binary(monkeypatch):
    from app.services.ollama_manager import ensure_ollama_running

    monkeypatch.setattr("app.services.ollama_manager.is_ollama_running", lambda timeout=1.5: False)
    monkeypatch.setattr("app.services.ollama_manager.shutil.which", lambda name: None)
    monkeypatch.setattr("app.services.ollama_manager.subprocess.Popen", lambda *args, **kwargs: (_ for _ in ()).throw(RuntimeError("should not start")))

    ensure_ollama_running()


def get_auth_headers(email: str, password: str) -> dict:
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def get_officer_headers() -> dict:
    return get_auth_headers("officer@civic.gov", "Officer123!")

def get_citizen_headers() -> dict:
    return get_auth_headers("citizen@civic.gov", "Citizen123!")

def test_root_health_and_swagger_disabled():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["swagger_disabled"] is True
    assert data["rbac_enabled"] is True
    assert "Citizen" in data["roles_supported"]
    assert "Municipal Officer" in data["roles_supported"]
    assert "Crew" in data["roles_supported"]

    # Confirm Swagger UI & OpenAPI docs endpoints return 404
    assert client.get("/docs").status_code == 404
    assert client.get("/redoc").status_code == 404
    assert client.get("/openapi.json").status_code == 404

def test_citizen_registration_and_login():
    unique_email = f"test_citizen_{uuid.uuid4().hex[:6]}@example.com"
    reg_payload = {
        "email": unique_email,
        "password": "Password123!",
        "full_name": "Test Citizen User",
        "phone": "+1-555-9999",
        "role": "Citizen"
    }
    
    # 1. Successful citizen self-registration
    reg_res = client.post("/api/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    data = reg_res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "Citizen"
    assert data["user"]["email"] == unique_email

    # 2. Prevent duplicate email registration
    dup_res = client.post("/api/auth/register", json=reg_payload)
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["detail"]

    # 3. Reject non-citizen role in self-registration
    officer_reg_payload = reg_payload.copy()
    officer_reg_payload["email"] = f"fake_officer_{uuid.uuid4().hex[:6]}@example.com"
    officer_reg_payload["role"] = "Municipal Officer"
    fail_reg = client.post("/api/auth/register", json=officer_reg_payload)
    assert fail_reg.status_code == 403
    assert "restricted" in fail_reg.json()["detail"].lower()

    # 4. Login with registered credentials
    login_res = client.post("/api/auth/login", json={"email": unique_email, "password": "Password123!"})
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

def test_user_creation_endpoints_removed():
    officer_headers = get_officer_headers()
    citizen_headers = get_citizen_headers()

    # User creation and user listing endpoints have been removed (404 Not Found)
    assert client.post("/api/auth/users", json={}, headers=citizen_headers).status_code == 404
    assert client.post("/api/auth/users", json={}, headers=officer_headers).status_code == 404
    assert client.get("/api/auth/users", headers=officer_headers).status_code == 404

def test_unauthenticated_requests_blocked():
    # Protected endpoints must return 401 when no token is supplied
    assert client.get("/api/auth/me").status_code == 401
    assert client.post("/api/complaints", json={}).status_code == 401
    assert client.get("/api/complaints").status_code == 401
    assert client.patch("/api/complaints/123/status", json={}).status_code == 401
    assert client.patch("/api/complaints/123/assign", json={}).status_code == 401
    assert client.get("/api/analytics").status_code == 401
    assert client.post("/api/seed").status_code == 401

def test_seed_database_officer_only():
    citizen_headers = get_citizen_headers()
    officer_headers = get_officer_headers()

    # Citizen blocked (403)
    assert client.post("/api/seed", headers=citizen_headers).status_code == 403

    # Officer allowed (201)
    seed_res = client.post("/api/seed", headers=officer_headers)
    assert seed_res.status_code == 201
    data = seed_res.json()
    assert len(data["users"]) > 0
    assert data["tickets"] == []

def test_create_and_list_complaints():
    citizen_headers = get_citizen_headers()
    
    payload = {
        "category": "Pothole / Road",
        "description": "Large dangerous pothole near the intersection.",
        "location": "Main St & 4th Ave",
        "urgency": "High"
    }
    response = client.post("/api/complaints", json=payload, headers=citizen_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["category"] == payload["category"]
    assert data["status"] == "New"
    assert "ticket_number" in data
    assert data["priority_score"] > 0

    # Test list complaints with token
    list_res = client.get("/api/complaints", headers=citizen_headers)
    assert list_res.status_code == 200
    assert isinstance(list_res.json(), list)

def test_rbac_workflow_state_machine():
    citizen_headers = get_citizen_headers()
    officer_headers = get_officer_headers()

    # 1. Citizen creates complaint
    create_res = client.post("/api/complaints", json={
        "category": "Streetlight",
        "description": "Flickering light near park entrance.",
        "location": "Park Entrance",
        "urgency": "Medium"
    }, headers=citizen_headers)
    comp = create_res.json()
    comp_id = comp["id"]

    # 2. Citizen tries to update status -> 403 Forbidden
    cit_patch = client.patch(f"/api/complaints/{comp_id}/status", json={"status": "Assigned"}, headers=citizen_headers)
    assert cit_patch.status_code == 403

    # 3. Officer invalid state jump New -> Resolved -> 400 Bad Request
    off_invalid = client.patch(f"/api/complaints/{comp_id}/status", json={"status": "Resolved"}, headers=officer_headers)
    assert off_invalid.status_code == 400

    # 4. Officer valid step 1: New -> Assigned
    off_step1 = client.patch(f"/api/complaints/{comp_id}/status", json={"status": "Assigned", "assigned_to": "Electrical Crew 1"}, headers=officer_headers)
    assert off_step1.status_code == 200
    assert off_step1.json()["status"] == "Assigned"

    # 5. Officer valid step 2: Assigned -> In Progress
    off_step2 = client.patch(f"/api/complaints/{comp_id}/status", json={"status": "In Progress"}, headers=officer_headers)
    assert off_step2.status_code == 200
    assert off_step2.json()["status"] == "In Progress"

    # 6. Crew/Officer step 3: In Progress -> Completed
    off_step3 = client.patch(f"/api/complaints/{comp_id}/status", json={"status": "Completed"}, headers=officer_headers)
    assert off_step3.status_code == 200
    assert off_step3.json()["status"] == "Completed"

    # 7. Officer step 4: Completed -> Resolved
    off_step4 = client.patch(f"/api/complaints/{comp_id}/status", json={"status": "Resolved"}, headers=officer_headers)
    assert off_step4.status_code == 200
    assert off_step4.json()["status"] == "Resolved"

def test_rbac_complaint_assignment_endpoint():
    citizen_headers = get_citizen_headers()
    officer_headers = get_officer_headers()

    create_res = client.post("/api/complaints", json={
        "category": "Garbage / Sanitation",
        "description": "Trash accumulated on sidewalk.",
        "location": "Elm Street",
        "urgency": "Low"
    }, headers=citizen_headers)
    comp_id = create_res.json()["id"]

    # Citizen blocked from assigning -> 403
    cit_assign = client.patch(f"/api/complaints/{comp_id}/assign", json={"assigned_to": "Sanitation Unit 5"}, headers=citizen_headers)
    assert cit_assign.status_code == 403

    # Officer allowed to assign -> 200
    off_assign = client.patch(f"/api/complaints/{comp_id}/assign", json={"assigned_to": "Sanitation Unit 5", "note": "Priority pickup"}, headers=officer_headers)
    assert off_assign.status_code == 200
    assert off_assign.json()["assigned_to"] == "Sanitation Unit 5"

def test_delete_complaint_endpoint_removed():
    citizen_headers = get_citizen_headers()
    officer_headers = get_officer_headers()

    create_res = client.post("/api/complaints", json={
        "category": "Water Supply",
        "description": "Pipe leaking on sidewalk.",
        "location": "High St",
        "urgency": "Medium"
    }, headers=citizen_headers)
    comp_id = create_res.json()["id"]

    # Delete endpoint has been removed (405 Method Not Allowed)
    assert client.delete(f"/api/complaints/{comp_id}", headers=citizen_headers).status_code == 405
    assert client.delete(f"/api/complaints/{comp_id}", headers=officer_headers).status_code == 405

def test_rbac_analytics_endpoint():
    citizen_headers = get_citizen_headers()
    officer_headers = get_officer_headers()

    # Citizen blocked -> 403
    assert client.get("/api/analytics", headers=citizen_headers).status_code == 403
    # Officer allowed -> 200
    assert client.get("/api/analytics", headers=officer_headers).status_code == 200

def test_ai_classification_endpoint():
    citizen_headers = get_citizen_headers()
    payload = {"text": "There has been no street light near Gate 3 for almost a week and the road gets extremely dark."}
    res = client.post("/api/ai/classify", json=payload, headers=citizen_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["category"] == "Streetlight"
