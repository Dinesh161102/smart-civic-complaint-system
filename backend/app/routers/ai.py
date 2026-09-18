from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
from app.services.ai_service import analyze_complaint_with_ai
from app.services.auth_service import get_optional_current_user

router = APIRouter(tags=["AI Complaint Analysis"])

class AIComplaintAnalysisRequest(BaseModel):
    description: Optional[str] = Field(None, json_schema_extra={"example": "There is a large pothole on the main road near the bus stop."})
    text: Optional[str] = Field(None, json_schema_extra={"example": "There is a large pothole on the main road near the bus stop."})

class AIComplaintAnalysisResponse(BaseModel):
    category: str
    urgency: str
    issue: str
    location: Optional[str] = None

def run_analysis(description_input: str) -> AIComplaintAnalysisResponse:
    if not description_input or not description_input.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Description field cannot be empty. Please provide a complaint description."
        )
    res = analyze_complaint_with_ai(description_input.strip())
    return AIComplaintAnalysisResponse(
        category=res.get("category", "Other"),
        urgency=res.get("urgency", "Medium"),
        issue=res.get("issue", description_input),
        location=res.get("location")
    )

@router.post("/complaints/analyze", response_model=AIComplaintAnalysisResponse)
def analyze_complaint_endpoint(
    payload: AIComplaintAnalysisRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """
    AI-Assisted Complaint Analysis Endpoint.
    Analyzes natural language complaint descriptions using Ollama (qwen2.5:1.5b-instruct) and returns structured JSON:
    category, urgency, issue summary, and location (or null if not mentioned).
    """
    input_text = payload.description or payload.text or ""
    return run_analysis(input_text)

@router.post("/api/ai/classify", response_model=AIComplaintAnalysisResponse)
def classify_complaint_endpoint(
    payload: AIComplaintAnalysisRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """
    Alias endpoint for API backwards compatibility.
    """
    input_text = payload.text or payload.description or ""
    return run_analysis(input_text)

