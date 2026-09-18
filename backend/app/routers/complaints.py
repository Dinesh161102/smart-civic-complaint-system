from fastapi import APIRouter, HTTPException, Query, Depends, status
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import uuid

from app.database import get_db
from app.schemas.complaint import (
    ComplaintCreate, ComplaintUpdate, ComplaintStatusUpdate, ComplaintAssignmentUpdate,
    CommentCreate, CommentResponse, ComplaintResponse
)
from app.services.prioritization import (
    calculate_priority, count_similar_complaints, calculate_aging_hours,
    detect_citizen_duplicate
)
from app.services.sla_service import calculate_sla_status
from app.services.auth_service import (
    get_current_user, require_roles,
    ROLE_CITIZEN, ROLE_OFFICER, ROLE_CREW
)

router = APIRouter(prefix="/api/complaints", tags=["Complaints Queue & Management"])

STATUS_MAP = {
    "NEW": "New", "New": "New",
    "ASSIGNED": "Assigned", "Assigned": "Assigned",
    "IN_PROGRESS": "In Progress", "In Progress": "In Progress", "IN PROGRESS": "In Progress",
    "COMPLETED": "Completed", "Completed": "Completed",
    "RESOLVED": "Resolved", "Resolved": "Resolved"
}

def normalize_status(status_str: Optional[str]) -> Optional[str]:
    if not status_str:
        return None
    s = status_str.strip().upper().replace("_", " ")
    lookup = {
        "NEW": "New",
        "ASSIGNED": "Assigned",
        "IN PROGRESS": "In Progress",
        "COMPLETED": "Completed",
        "RESOLVED": "Resolved",
        "REJECTED": "Rejected"
    }
    return lookup.get(s)

ALLOWED_TRANSITIONS = {
    "New": ["Assigned"],
    "Assigned": ["In Progress", "New"],
    "In Progress": ["Completed", "Assigned"],
    "Completed": ["Resolved", "In Progress", "Rejected"],
    "Rejected": ["In Progress", "Completed", "Assigned"],
    "Resolved": ["In Progress", "Rejected"]
}

VALID_URGENCIES = ["Low", "Medium", "High", "Critical"]

def format_complaint_doc(doc: dict, db) -> dict:
    doc_id = str(doc["_id"])
    created_at = doc.get("created_at", datetime.now().isoformat())
    updated_at = doc.get("updated_at", datetime.now().isoformat())
    status_val = doc.get("status", "New")
    category = doc.get("category", "Other")
    urgency = doc.get("urgency", "Medium")
    location = doc.get("location", "")
    reporting_method = doc.get("reporting_method", "Manual")
    
    # Duplicate status (saved or dynamically verified for same citizen across Manual <-> AI)
    is_duplicate = doc.get("is_duplicate", False)
    duplicate_of = doc.get("duplicate_of")
    duplicate_reason = doc.get("duplicate_reason")
    
    if not is_duplicate:
        dyn_dup = detect_citizen_duplicate(db, doc)
        if dyn_dup.get("is_duplicate"):
            is_duplicate = True
            duplicate_of = dyn_dup.get("duplicate_of")
            duplicate_reason = dyn_dup.get("duplicate_reason")
    
    # Dynamic calculations
    aging_hours = calculate_aging_hours(created_at) if status_val != "Resolved" else doc.get("aging_hours", 0.0)
    similar_count = count_similar_complaints(db, category, location, current_id=doc["_id"])
    priority_res = calculate_priority(category, urgency, aging_hours, similar_count)
    sla_res = calculate_sla_status(created_at, priority_res["priority"], status_val)
    
    return {
        "id": doc_id,
        "ticket_number": doc.get("ticket_number", f"CIVIC-{doc_id[:6].upper()}"),
        "category": category,
        "description": doc.get("description", ""),
        "location": location,
        "latitude": doc.get("latitude"),
        "longitude": doc.get("longitude"),
        "urgency": urgency,
        "reporter_name": doc.get("reporter_name"),
        "reporter_contact": doc.get("reporter_contact"),
        "reporting_method": reporting_method,
        "is_duplicate": is_duplicate,
        "duplicate_of": duplicate_of,
        "duplicate_reason": duplicate_reason,
        "image_url": doc.get("image_url") or doc.get("photo_url"),
        "photo_url": doc.get("photo_url") or doc.get("image_url"),
        "priority": priority_res["priority"],
        "priority_score": priority_res["score"],
        "status": status_val,
        "assigned_to": doc.get("assigned_to"),
        "assigned_crew_id": doc.get("assigned_crew_id", "CREW-101" if doc.get("assigned_to") else None),
        "assigned_team": doc.get("assigned_team") or doc.get("assigned_to"),
        "assigned_at": doc.get("assigned_at"),
        "started_at": doc.get("started_at"),
        "completed_at": doc.get("completed_at"),
        "completion_photo": doc.get("completion_photo"),
        "completion_note": doc.get("completion_note"),
        "resolved_at": doc.get("resolved_at"),
        "verified_by": doc.get("verified_by"),
        "similar_complaints_count": similar_count,
        "aging_hours": aging_hours,
        "sla_status": sla_res["sla_status"],
        "sla_hours": sla_res["sla_hours"],
        "sla_deadline": sla_res["sla_deadline"],
        "created_at": created_at,
        "updated_at": updated_at,
        "comments": doc.get("comments", []),
        "status_history": doc.get("status_history", [])
    }


def find_complaint_or_404(id_or_ticket: str, col):
    doc = None
    if ObjectId.is_valid(id_or_ticket):
        doc = col.find_one({"_id": ObjectId(id_or_ticket)})
    if not doc:
        doc = col.find_one({"ticket_number": id_or_ticket.upper()})
    if not doc:
        doc = col.find_one({"ticket_number": {"$regex": id_or_ticket, "$options": "i"}})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Complaint ticket '{id_or_ticket}' not found.")
    return doc

@router.post("", response_model=ComplaintResponse, status_code=201)
@router.post("/", response_model=ComplaintResponse, status_code=201)
def create_complaint(
    payload: ComplaintCreate,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Register a new complaint. Authenticated for Citizens and Municipal Officers.
    Automatically binds reporter identity to logged-in user if unspecified.
    """
    # Input validation
    if not payload.category or not payload.category.strip():
        raise HTTPException(status_code=400, detail="Category field cannot be empty.")
    if not payload.description or not payload.description.strip():
        raise HTTPException(status_code=400, detail="Description field cannot be empty.")
    if not payload.location or not payload.location.strip():
        raise HTTPException(status_code=400, detail="Location field cannot be empty.")
        
    urgency_norm = payload.urgency.title() if payload.urgency else "Medium"
    if urgency_norm not in VALID_URGENCIES:
        raise HTTPException(status_code=400, detail=f"Invalid urgency level. Must be one of: {VALID_URGENCIES}")
        
    col = db["complaints"]
    now_str = datetime.now().isoformat()
    ticket_num = f"CIVIC-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
    
    reporter_name = payload.reporter_name or current_user.get("full_name") or current_user.get("email")
    reporter_contact = payload.reporter_contact or current_user.get("email")
    
    reporting_method = (payload.reporting_method or "Manual").strip().title()
    if reporting_method.upper() not in ["MANUAL", "AI"]:
        reporting_method = "Manual"

    new_doc = {
        "ticket_number": ticket_num,
        "category": payload.category.strip(),
        "description": payload.description.strip(),
        "location": payload.location.strip(),
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "urgency": urgency_norm,
        "reporter_name": reporter_name,
        "reporter_contact": reporter_contact,
        "reporter_id": current_user.get("id"),
        "reporting_method": reporting_method,
        "image_url": payload.image_url or payload.photo_url,
        "photo_url": payload.photo_url or payload.image_url,
        "status": "New",
        "assigned_to": None,
        "created_at": now_str,
        "updated_at": now_str,
        "comments": [
            {
                "id": uuid.uuid4().hex[:8],
                "author": "System",
                "content": f"Complaint registered via {reporting_method} by {current_user.get('full_name')} ({current_user.get('role')}). Ticket ID: {ticket_num}",
                "created_at": now_str
            }
        ]
    }
    
    # Duplicate Detection ONLY for the same citizen when reported through different methods (Manual <-> AI)
    dup_info = detect_citizen_duplicate(db, new_doc, current_user)
    new_doc["is_duplicate"] = dup_info["is_duplicate"]
    new_doc["duplicate_of"] = dup_info["duplicate_of"]
    new_doc["duplicate_reason"] = dup_info["duplicate_reason"]
    
    if dup_info["is_duplicate"]:
        prev_method = dup_info.get("duplicate_method", "other method")
        new_doc["comments"].append({
            "id": uuid.uuid4().hex[:8],
            "author": "System (Deduplication)",
            "content": f"Notice: This complaint is detected as a duplicate submission of your previous ticket #{dup_info['duplicate_of']} ({prev_method} report).",
            "created_at": now_str
        })
    
    res = col.insert_one(new_doc)
    new_doc["_id"] = res.inserted_id
    
    return format_complaint_doc(new_doc, db)

@router.get("", response_model=List[ComplaintResponse])
@router.get("/", response_model=List[ComplaintResponse])
def list_complaints(
    status: Optional[str] = Query(None, description="Filter by status: New, Assigned, In Progress, Resolved"),
    category: Optional[str] = Query(None, description="Filter by category"),
    priority: Optional[str] = Query(None, description="Filter by calculated priority: Low, Medium, High, Critical"),
    search: Optional[str] = Query(None, description="Search keyword in description or location"),
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    List complaints queue. Accessible to Citizens (own complaints) and Municipal Officers (all complaints).
    """
    col = db["complaints"]
    query = {}
    
    if current_user.get("role") == ROLE_CITIZEN:
        user_id = current_user.get("id")
        user_email = current_user.get("email")
        or_list = []
        if user_id:
            or_list.append({"reporter_id": user_id})
        if user_email:
            or_list.append({"reporter_contact": user_email})
        if or_list:
            query["$or"] = or_list
    
    if status:
        normalized_status = normalize_status(status) or status
        query["status"] = normalized_status
    if category:
        query["category"] = {"$regex": category, "$options": "i"}
    if search:
        search_cond = [
            {"description": {"$regex": search, "$options": "i"}},
            {"location": {"$regex": search, "$options": "i"}},
            {"ticket_number": {"$regex": search, "$options": "i"}}
        ]
        if "$or" in query:
            query = {"$and": [{"$or": query["$or"]}, {"$or": search_cond}]}
        else:
            query["$or"] = search_cond
        
    docs = list(col.find(query).sort("created_at", -1))
    results = [format_complaint_doc(d, db) for d in docs]
    
    if priority:
        results = [r for r in results if r["priority"].lower() == priority.lower()]
        
    return results

@router.get("/{id_or_ticket}", response_model=ComplaintResponse)
def get_complaint(
    id_or_ticket: str,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Retrieve single complaint by Mongo ID or Ticket Number.
    """
    col = db["complaints"]
    doc = find_complaint_or_404(id_or_ticket, col)
    return format_complaint_doc(doc, db)

@router.patch("/{id_or_ticket}", response_model=ComplaintResponse)
@router.put("/{id_or_ticket}", response_model=ComplaintResponse)
def update_complaint_details(
    id_or_ticket: str,
    payload: ComplaintUpdate,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Update complaint details (description, category, location, urgency, photo).
    Accessible to the Citizen who reported it or Municipal Officers.
    """
    col = db["complaints"]
    doc = find_complaint_or_404(id_or_ticket, col)

    # If Citizen, ensure it's their own complaint
    if current_user.get("role") == ROLE_CITIZEN:
        user_id = current_user.get("id")
        user_email = current_user.get("email")
        if doc.get("reporter_id") != user_id and doc.get("reporter_contact") != user_email:
            raise HTTPException(status_code=403, detail="You can only edit your own complaint tickets.")

    # Disallow editing resolved complaints
    if doc.get("status") == "Resolved":
        raise HTTPException(status_code=400, detail="Cannot edit a complaint that has already been resolved.")

    now_str = datetime.now().isoformat()
    update_data = {"updated_at": now_str}

    if payload.category is not None and payload.category.strip():
        update_data["category"] = payload.category.strip()
    if payload.description is not None and payload.description.strip():
        update_data["description"] = payload.description.strip()
    if payload.location is not None and payload.location.strip():
        update_data["location"] = payload.location.strip()
    if payload.latitude is not None:
        update_data["latitude"] = payload.latitude
    if payload.longitude is not None:
        update_data["longitude"] = payload.longitude
    if payload.urgency is not None and payload.urgency.strip():
        urgency_val = payload.urgency.strip().capitalize()
        if urgency_val in VALID_URGENCIES:
            update_data["urgency"] = urgency_val
    if payload.image_url is not None:
        update_data["image_url"] = payload.image_url
        update_data["photo_url"] = payload.image_url
    elif payload.photo_url is not None:
        update_data["image_url"] = payload.photo_url
        update_data["photo_url"] = payload.photo_url

    # Add audit entry in comments
    comments = doc.get("comments", [])
    author_title = f"{current_user.get('full_name')} ({current_user.get('role')})"
    comments.append({
        "id": uuid.uuid4().hex[:8],
        "author": author_title,
        "content": f"Complaint details updated by {current_user.get('full_name')}.",
        "created_at": now_str
    })
    update_data["comments"] = comments

    col.update_one({"_id": doc["_id"]}, {"$set": update_data})
    updated_doc = col.find_one({"_id": doc["_id"]})
    return format_complaint_doc(updated_doc, db)

@router.patch("/{id_or_ticket}/status", response_model=ComplaintResponse)
def update_complaint_status(
    id_or_ticket: str,
    payload: ComplaintStatusUpdate,
    current_user: dict = Depends(require_roles([ROLE_OFFICER, ROLE_CREW])),
    db=Depends(get_db)
):
    """
    Update complaint status enforcing state machine transition.
    Accessible to Municipal Officers and Crew members.
    """
    col = db["complaints"]
    doc = find_complaint_or_404(id_or_ticket, col)
    
    target_status = normalize_status(payload.status)
    if not target_status:
        raise HTTPException(status_code=400, detail=f"Invalid status '{payload.status}'. Allowed values: NEW, ASSIGNED, IN_PROGRESS, COMPLETED, RESOLVED.")
        
    current_status = doc.get("status", "New")
    
    # Enforce workflow state machine transitions
    if current_status != target_status:
        allowed_next = ALLOWED_TRANSITIONS.get(current_status, [])
        if target_status not in allowed_next:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid workflow transition from '{current_status}' to '{target_status}'. Allowed next status from '{current_status}': {allowed_next}. Required workflow sequence: NEW -> ASSIGNED -> IN_PROGRESS -> COMPLETED -> RESOLVED."
            )
            
    now_str = datetime.now().isoformat()
    formatted_time_str = datetime.now().strftime('%d %b %Y • %I:%M %p')
    
    update_data = {
        "status": target_status,
        "updated_at": now_str
    }
    
    if payload.assigned_to is not None:
        update_data["assigned_to"] = payload.assigned_to
    if payload.assigned_crew_id is not None:
        update_data["assigned_crew_id"] = payload.assigned_crew_id
    if payload.completion_photo is not None:
        update_data["completion_photo"] = payload.completion_photo
    if payload.completion_note is not None:
        update_data["completion_note"] = payload.completion_note

    if target_status == "In Progress" and not doc.get("started_at"):
        update_data["started_at"] = formatted_time_str
    elif target_status == "Completed":
        update_data["completed_at"] = formatted_time_str
    elif target_status == "Resolved":
        update_data["resolved_at"] = formatted_time_str
        update_data["verified_by"] = current_user.get("full_name", "Municipal Officer")

    status_history = doc.get("status_history", [])
    history_entry = {
        "status": target_status,
        "title": target_status,
        "description": f"Status updated to {target_status}",
        "actor": f"{current_user.get('full_name')} ({current_user.get('role')})",
        "note": payload.note or payload.completion_note or f"Updated to {target_status}",
        "timestamp": formatted_time_str
    }
    status_history.append(history_entry)
    update_data["status_history"] = status_history

    comments = doc.get("comments", [])
    author_title = f"{current_user.get('full_name')} ({current_user.get('role')})"
    note_text = f"Status updated from '{current_status}' to '{target_status}' by {current_user.get('full_name')}."
    if payload.assigned_to:
        note_text += f" Assigned to: {payload.assigned_to}."
    if payload.note:
        note_text += f" Note: {payload.note}"
    if payload.completion_note:
        note_text += f" Completion note: {payload.completion_note}"
        
    comments.append({
        "id": uuid.uuid4().hex[:8],
        "author": author_title,
        "content": note_text,
        "created_at": now_str
    })
    
    update_data["comments"] = comments
    col.update_one({"_id": doc["_id"]}, {"$set": update_data})
    updated_doc = col.find_one({"_id": doc["_id"]})
    return format_complaint_doc(updated_doc, db)

@router.patch("/{id_or_ticket}/assign", response_model=ComplaintResponse)
def assign_complaint(
    id_or_ticket: str,
    payload: ComplaintAssignmentUpdate,
    current_user: dict = Depends(require_roles([ROLE_OFFICER])),
    db=Depends(get_db)
):
    """
    Assign complaint to field crew or staff member.
    Restricted to Municipal Officers.
    """
    col = db["complaints"]
    doc = find_complaint_or_404(id_or_ticket, col)
    
    assigned_team_val = (payload.assigned_team or payload.assigned_to or "").strip()
    if not assigned_team_val:
        raise HTTPException(status_code=400, detail="assigned_to or assigned_team field cannot be empty.")
        
    assigned_crew_id = (payload.assigned_crew_id or "CREW-101").strip()
    target_status = "Assigned"
        
    now_str = datetime.now().isoformat()
    formatted_time_str = datetime.now().strftime('%d %b %Y • %I:%M %p')
    
    status_history = doc.get("status_history", [])
    history_entry = {
        "status": "Assigned",
        "title": "Assigned",
        "description": f"Assigned to {assigned_team_val}",
        "actor": f"{current_user.get('full_name')} ({current_user.get('role')})",
        "note": payload.note or f"Assigned to {assigned_team_val}",
        "timestamp": formatted_time_str
    }
    status_history.append(history_entry)

    comments = doc.get("comments", [])
    author_title = f"{current_user.get('full_name')} ({current_user.get('role')})"
    note_text = f"Assigned to staff/crew: '{assigned_team_val}' by {current_user.get('full_name')}."
    if payload.note:
        note_text += f" Note: {payload.note}"
        
    comments.append({
        "id": uuid.uuid4().hex[:8],
        "author": author_title,
        "content": note_text,
        "created_at": now_str
    })
    
    update_data = {
        "assigned_to": assigned_team_val,
        "assigned_team": assigned_team_val,
        "assigned_crew_id": assigned_crew_id,
        "assigned_at": formatted_time_str,
        "status": target_status,
        "status_history": status_history,
        "updated_at": now_str,
        "comments": comments
    }
    
    col.update_one({"_id": doc["_id"]}, {"$set": update_data})
    updated_doc = col.find_one({"_id": doc["_id"]})
    return format_complaint_doc(updated_doc, db)


@router.get("/{id_or_ticket}/comments", response_model=List[CommentResponse])
def get_complaint_comments(
    id_or_ticket: str,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Retrieve all audit trail comments for a complaint.
    """
    col = db["complaints"]
    doc = find_complaint_or_404(id_or_ticket, col)
    return doc.get("comments", [])

@router.post("/{id_or_ticket}/comments", response_model=ComplaintResponse)
def add_complaint_comment(
    id_or_ticket: str,
    payload: CommentCreate,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Add a comment/note to a complaint ticket. Accessible by Citizens and Officers.
    """
    col = db["complaints"]
    doc = find_complaint_or_404(id_or_ticket, col)
    
    author_name = payload.author.strip() if payload.author and payload.author.strip() else current_user.get("full_name", "Anonymous")
    if not payload.content or not payload.content.strip():
        raise HTTPException(status_code=400, detail="Comment content cannot be empty.")
        
    now_str = datetime.now().isoformat()
    comments = doc.get("comments", [])
    comments.append({
        "id": uuid.uuid4().hex[:8],
        "author": author_name,
        "content": payload.content.strip(),
        "created_at": now_str
    })
    
    col.update_one({"_id": doc["_id"]}, {"$set": {"comments": comments, "updated_at": now_str}})
    updated_doc = col.find_one({"_id": doc["_id"]})
    return format_complaint_doc(updated_doc, db)
