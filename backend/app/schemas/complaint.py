from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class CommentCreate(BaseModel):
    author: str = Field(..., json_schema_extra={"example": "Operator Dave"})
    content: str = Field(..., json_schema_extra={"example": "Dispatched field crew to location."})

class CommentResponse(BaseModel):
    id: str
    author: str
    content: str
    created_at: str

class ComplaintBase(BaseModel):
    category: str = Field(..., json_schema_extra={"example": "Streetlight"}, description="Category of civic issue")
    description: str = Field(..., json_schema_extra={"example": "Streetlight near Gate 3 non-functional for one week."}, description="Detailed issue description")
    location: str = Field(..., json_schema_extra={"example": "Gate 3, Central Park West"}, description="Address, intersection, or landmark")
    latitude: Optional[float] = Field(None, json_schema_extra={"example": 40.785091})
    longitude: Optional[float] = Field(None, json_schema_extra={"example": -73.968285})
    urgency: str = Field("Medium", json_schema_extra={"example": "Medium"}, description="User specified urgency: Low, Medium, High, Critical")
    reporter_name: Optional[str] = Field(None, json_schema_extra={"example": "Jane Doe"})
    reporter_contact: Optional[str] = Field(None, json_schema_extra={"example": "jane@example.com"})
    reporting_method: Optional[str] = Field("Manual", description="Reporting method: 'Manual' or 'AI'")
    is_duplicate: Optional[bool] = Field(False, description="Flag indicating if complaint is a duplicate submission by the same citizen")
    duplicate_of: Optional[str] = Field(None, description="Original ticket number if duplicate")
    duplicate_reason: Optional[str] = Field(None, description="Explanation of duplicate detection")
    image_url: Optional[str] = Field(None, description="Citizen uploaded or captured photo data URL or URL")
    photo_url: Optional[str] = Field(None, description="Citizen uploaded or captured photo data URL or URL")

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintUpdate(BaseModel):
    category: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    urgency: Optional[str] = None
    reporting_method: Optional[str] = None
    image_url: Optional[str] = None
    photo_url: Optional[str] = None

class ComplaintStatusUpdate(BaseModel):
    status: str = Field(..., json_schema_extra={"example": "In Progress"}, description="Allowed: New, Assigned, In Progress, Completed, Resolved")
    assigned_to: Optional[str] = Field(None, json_schema_extra={"example": "Electrical Dept Crew #4"})
    assigned_crew_id: Optional[str] = Field(None, json_schema_extra={"example": "CREW-101"})
    completion_photo: Optional[str] = Field(None, json_schema_extra={"example": "https://example.com/uploads/photo.jpg"})
    completion_note: Optional[str] = Field(None, json_schema_extra={"example": "Work completed by crew."})
    note: Optional[str] = Field(None, json_schema_extra={"example": "Work order generated and assigned."})

class ComplaintAssignmentUpdate(BaseModel):
    assigned_to: Optional[str] = Field(None, json_schema_extra={"example": "Electrical Dept Crew #4"}, description="Staff member or field crew name")
    assigned_crew_id: Optional[str] = Field("CREW-101", json_schema_extra={"example": "CREW-101"})
    assigned_team: Optional[str] = Field(None, json_schema_extra={"example": "Electrical Team - North Zone"})
    assigned_at: Optional[str] = None
    note: Optional[str] = Field(None, json_schema_extra={"example": "Assigned for immediate field repair."})

class StatusHistoryItem(BaseModel):
    status: str
    title: Optional[str] = None
    description: Optional[str] = None
    actor: Optional[str] = None
    note: Optional[str] = None
    timestamp: str

class ComplaintResponse(ComplaintBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    ticket_number: str
    category: str
    description: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    urgency: str
    priority: str
    priority_score: float
    status: str
    reporting_method: Optional[str] = "Manual"
    is_duplicate: Optional[bool] = False
    duplicate_of: Optional[str] = None
    duplicate_reason: Optional[str] = None
    assigned_to: Optional[str] = None
    assigned_crew_id: Optional[str] = None
    assigned_team: Optional[str] = None
    assigned_at: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    completion_photo: Optional[str] = None
    completion_note: Optional[str] = None
    resolved_at: Optional[str] = None
    verified_by: Optional[str] = None
    similar_complaints_count: int
    aging_hours: float
    sla_status: str
    sla_hours: int
    sla_deadline: str
    created_at: str
    updated_at: str
    comments: List[CommentResponse] = []
    status_history: List[StatusHistoryItem] = []


class ComplaintFilter(BaseModel):
    status: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    search: Optional[str] = None
    min_priority_score: Optional[float] = None

