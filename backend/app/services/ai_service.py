import re
import json
import os
import urllib.request
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field, field_validator
from app.config import settings

OLLAMA_URL = settings.OLLAMA_URL
OLLAMA_MODEL = settings.OLLAMA_MODEL
ENABLE_OLLAMA = settings.ENABLE_OLLAMA
OLLAMA_TIMEOUT = settings.OLLAMA_TIMEOUT

# Backend Baseline Categories (Strictly Enforced)
VALID_CATEGORIES = [
    "Streetlight",
    "Pothole / Road",
    "Garbage / Sanitation",
    "Water Supply",
    "Sewage / Drainage",
    "Parks & Tree",
    "Other"
]

CATEGORY_ALIASES = {
    "streetlight": "Streetlight",
    "street light": "Streetlight",
    "electrical / streetlight": "Streetlight",
    "lighting": "Streetlight",
    "lamp post": "Streetlight",
    "pothole": "Pothole / Road",
    "pothole / road": "Pothole / Road",
    "road": "Pothole / Road",
    "road damage": "Pothole / Road",
    "pavement": "Pothole / Road",
    "garbage": "Garbage / Sanitation",
    "garbage / sanitation": "Garbage / Sanitation",
    "trash": "Garbage / Sanitation",
    "sanitation": "Garbage / Sanitation",
    "waste": "Garbage / Sanitation",
    "water": "Water Supply",
    "water supply": "Water Supply",
    "water pipe": "Water Supply",
    "pipe leak": "Water Supply",
    "leak": "Water Supply",
    "sewage": "Sewage / Drainage",
    "sewage / drainage": "Sewage / Drainage",
    "drainage": "Sewage / Drainage",
    "drain": "Sewage / Drainage",
    "park": "Parks & Tree",
    "parks & tree": "Parks & Tree",
    "tree": "Parks & Tree"
}

VALID_URGENCIES = ["Low", "Medium", "High", "Critical"]

# Pydantic Schema for AI Output Validation
class AIAnalysisResult(BaseModel):
    category: str
    urgency: str
    issue: str
    location: Optional[str] = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: Any) -> str:
        if not v or not isinstance(v, str):
            return "Other"
        v_clean = v.strip()
        if v_clean in VALID_CATEGORIES:
            return v_clean
        v_lower = v_clean.lower()
        if v_lower in CATEGORY_ALIASES:
            return CATEGORY_ALIASES[v_lower]
        for valid_cat in VALID_CATEGORIES:
            if v_lower in valid_cat.lower() or valid_cat.lower() in v_lower:
                return valid_cat
        return "Other"

    @field_validator("urgency")
    @classmethod
    def validate_urgency(cls, v: Any) -> str:
        if not v or not isinstance(v, str):
            return "Medium"
        v_title = v.strip().capitalize()
        if v_title in VALID_URGENCIES:
            return v_title
        v_upper = v.strip().upper()
        if v_upper == "LOW": return "Low"
        if v_upper in ["MED", "MEDIUM"]: return "Medium"
        if v_upper == "HIGH": return "High"
        if v_upper in ["CRIT", "CRITICAL"]: return "Critical"
        return "Medium"

    @field_validator("location")
    @classmethod
    def validate_location(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        if not isinstance(v, str):
            return None
        v_clean = v.strip()
        if not v_clean:
            return None
        v_lower = v_clean.lower()
        if v_lower in ["null", "none", "n/a", "not mentioned", "unknown", "unspecified", "nil"]:
            return None
        generic_locations = [
            "our apartment", "my apartment", "the apartment", "apartment",
            "the street", "a street", "street", "the road", "a road", "road",
            "nearby", "outside", "here", "city", "my area", "the area",
            "one week", "five days", "two days", "few days"
        ]
        if v_lower in generic_locations:
            return None
        return v_clean

def fallback_nlp_analyze(text: str) -> Dict[str, Any]:
    """
    Built-in CPU-friendly Regex NLP analyzer used when Ollama server is offline or fails.
    Extracts category, urgency, issue summary, and location (or null if not mentioned).
    """
    text_lower = text.lower()
    
    # 1. Category Mapping (specific infrastructure checked before general terms)
    category = "Other"
    if any(k in text_lower for k in ["water pipe", "water leak", "pipe leak", "water supply", "flooding"]):
        category = "Water Supply"
    elif any(k in text_lower for k in ["sewage", "sewer", "manhole", "drainage", "clogged drain", "dirty water"]):
        category = "Sewage / Drainage"
    elif any(k in text_lower for k in ["street light", "streetlight", "lamp", "light pole"]):
        category = "Streetlight"
    elif any(k in text_lower for k in ["garbage", "trash", "waste", "litter", "dump", "bin"]):
        category = "Garbage / Sanitation"
    elif any(k in text_lower for k in ["pothole", "road hole", "crater", "asphalt", "pavement", "road crack"]):
        category = "Pothole / Road"
    elif any(k in text_lower for k in ["tree", "park", "branch", "grass", "fallen tree"]):
        category = "Parks & Tree"
    elif "road" in text_lower:
        category = "Pothole / Road"

    # 2. Urgency Level
    urgency = "Medium"
    if any(k in text_lower for k in ["emergency", "danger", "hazard", "fire", "burst", "severe", "critical"]):
        urgency = "Critical"
    elif any(k in text_lower for k in ["urgent", "dark", "flooding", "week", "blocked", "major", "high", "overflowing"]):
        urgency = "High"
    elif any(k in text_lower for k in ["broken", "non-functional", "repair", "not working", "leak", "pothole"]):
        urgency = "Medium"
    elif any(k in text_lower for k in ["minor", "cosmetic", "slow"]):
        urgency = "Low"

    # 3. Location Extraction (strictly return null if not mentioned or generic)
    location = None
    loc_match = re.search(r"(near|at|on|opposite|behind|by|around|outside)\s+([A-Za-z0-9\s#\-]{3,35}?)(?=\s+for|\s+and|\s+is|\s+gets|\s+has|\.|$)", text, re.IGNORECASE)
    if loc_match:
        extracted = loc_match.group(2).strip()
        # Clean up leading articles
        extracted = re.sub(r"^(the|a|an)\s+", "", extracted, flags=re.IGNORECASE).strip()
        generic_words = ["our apartment", "the street", "the road", "street", "road", "one week", "five days", "the main road"]
        if len(extracted) >= 3 and extracted.lower() not in generic_words:
            location = extracted.title()

    # 4. Issue Summary
    issue_summary = text.strip()
    if len(issue_summary) > 120:
        issue_summary = issue_summary[:117] + "..."

    return {
        "category": category,
        "urgency": urgency,
        "issue": issue_summary,
        "location": location
    }

def analyze_complaint_with_ai(description: str) -> Dict[str, Any]:
    """
    Analyzes a natural language complaint description:
    1. Checks if Ollama is enabled (ENABLE_OLLAMA). If disabled, immediately uses local NLP engine.
    2. Sends prompt to local Ollama instance (qwen2.5:1.5b-instruct).
    3. Validates JSON and schema using Pydantic AIAnalysisResult.
    4. Seamlessly falls back to local NLP engine if Ollama is unreachable, offline, or times out.
    """
    if not description or not description.strip():
        return {
            "category": "Other",
            "urgency": "Medium",
            "issue": "Empty description provided.",
            "location": None
        }

    # Production Safe Guard: If Ollama is disabled via environment variable, use local NLP immediately
    if not ENABLE_OLLAMA:
        fallback_res = fallback_nlp_analyze(description)
        validated = AIAnalysisResult(**fallback_res)
        return validated.model_dump()

    system_prompt = (
        "You are an expert municipal civic issue classifier for a smart city complaint system. "
        "Analyze the citizen's complaint description and extract structured JSON with 4 fields:\n"
        "1. category: Choose EXACTLY ONE from: ['Streetlight', 'Pothole / Road', 'Garbage / Sanitation', 'Water Supply', 'Sewage / Drainage', 'Parks & Tree', 'Other']. Do NOT invent new categories.\n"
        "2. urgency: Choose EXACTLY ONE from: ['Low', 'Medium', 'High', 'Critical'].\n"
        "3. issue: A concise, descriptive 1-sentence summary of the problem.\n"
        "4. location: The specific landmark, street, intersection, or area mentioned, OR null if no specific location is mentioned in the text. Never guess or invent a location.\n\n"
        "Respond ONLY with a valid JSON object matching this schema:\n"
        "{\n"
        '  "category": "CategoryName",\n'
        '  "urgency": "UrgencyLevel",\n'
        '  "issue": "Summary sentence",\n'
        '  "location": "Location or null"\n'
        "}"
    )

    user_prompt = f"Citizen Complaint Description:\n\"{description}\""

    payload = {
        "model": OLLAMA_MODEL,
        "system": system_prompt,
        "prompt": user_prompt,
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.1,
            "num_predict": 128
        }
    }

    try:
        body = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            OLLAMA_URL,
            data=body,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=OLLAMA_TIMEOUT) as resp:
            resp_data = json.loads(resp.read().decode('utf-8'))
            response_text = resp_data.get("response", "").strip()
            
            # Strip potential ```json markdown tags if returned
            if response_text.startswith("```"):
                response_text = re.sub(r"^```(?:json)?\s*", "", response_text)
                response_text = re.sub(r"\s*```$", "", response_text)
                
            parsed_json = json.loads(response_text)
            validated = AIAnalysisResult(**parsed_json)
            return validated.model_dump()
    except Exception:
        # Graceful fallback to local NLP engine if Ollama is unreachable, offline, or times out
        fallback_res = fallback_nlp_analyze(description)
        validated = AIAnalysisResult(**fallback_res)
        return validated.model_dump()

