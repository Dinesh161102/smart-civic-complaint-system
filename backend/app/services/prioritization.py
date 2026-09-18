from datetime import datetime
from typing import Dict, Any, List
from app.config import settings

def calculate_aging_hours(created_at_str: str) -> float:
    try:
        created_at = datetime.fromisoformat(created_at_str)
        delta = datetime.now() - created_at
        return max(0.0, round(delta.total_seconds() / 3600.0, 1))
    except Exception:
        return 0.0

def normalize_category_key(cat: str) -> str:
    if not cat:
        return "other"
    c = cat.lower()
    if "street" in c or "light" in c or "electric" in c:
        return "streetlight"
    if "pothole" in c or "road" in c:
        return "road"
    if "garb" in c or "sanitat" in c or "waste" in c:
        return "garbage"
    if "water" in c:
        return "water"
    if "sewag" in c or "drain" in c:
        return "drainage"
    if "park" in c or "tree" in c:
        return "parks"
    return c.strip()

def calculate_text_similarity(text1: str, text2: str) -> float:
    """Calculates Jaccard word-token overlap similarity between two text strings."""
    if not text1 or not text2:
        return 0.0
    w1 = set(w.lower() for w in text1.replace(",", " ").replace(".", " ").replace("-", " ").split() if len(w) > 2)
    w2 = set(w.lower() for w in text2.replace(",", " ").replace(".", " ").replace("-", " ").split() if len(w) > 2)
    if not w1 or not w2:
        return 0.0
    intersection = len(w1.intersection(w2))
    union = len(w1.union(w2))
    return intersection / union if union > 0 else 0.0

def detect_citizen_duplicate(db, complaint_doc: dict, current_user: dict = None) -> Dict[str, Any]:
    """
    Detects if the current complaint is a duplicate of an existing complaint 
    SUBMITTED BY THE SAME CITIZEN ONLY through different reporting methods (Manual <-> AI).
    Never flags complaints from different citizens.
    Uses MongoDB data only.
    """
    try:
        col = db["complaints"]
        
        # Identify citizen by logged-in user or complaint document
        user_id = (current_user.get("id") if current_user else None) or complaint_doc.get("reporter_id")
        user_email = (current_user.get("email") if current_user else None) or complaint_doc.get("reporter_contact")
        
        if not user_id and not user_email:
            return {"is_duplicate": False, "duplicate_of": None, "duplicate_reason": None}
            
        # Strictly query only complaints by the SAME CITIZEN
        citizen_conditions = []
        if user_id:
            citizen_conditions.append({"reporter_id": str(user_id)})
        if user_email:
            citizen_conditions.append({"reporter_contact": {"$regex": f"^{user_email}$", "$options": "i"}})
            
        query = {
            "$or": citizen_conditions,
            "status": {"$ne": "Resolved"}
        }
        
        current_doc_id = complaint_doc.get("_id") or complaint_doc.get("id")
        if current_doc_id:
            query["_id"] = {"$ne": current_doc_id}
            
        existing_citizen_complaints = list(col.find(query).sort("created_at", -1))
        if not existing_citizen_complaints:
            return {"is_duplicate": False, "duplicate_of": None, "duplicate_reason": None}
            
        curr_cat_norm = normalize_category_key(complaint_doc.get("category", ""))
        curr_loc = (complaint_doc.get("location") or "").lower()
        curr_desc = (complaint_doc.get("description") or "").lower()
        curr_method = (complaint_doc.get("reporting_method") or "Manual").strip().upper()
        
        loc_keywords = set(w for w in curr_loc.replace(",", " ").replace(".", " ").split() if len(w) > 2)
        
        for prev in existing_citizen_complaints:
            prev_method = (prev.get("reporting_method") or "Manual").strip().upper()
            
            # Condition 1: Must be different methods (Manual <-> AI)
            # e.g., one was reported via AI and one via Manual
            is_diff_method = (
                (curr_method == "AI" and prev_method == "MANUAL") or
                (curr_method == "MANUAL" and prev_method == "AI") or
                (curr_method != prev_method)
            )
            if not is_diff_method:
                continue
                
            # Condition 2: Same/similar category
            prev_cat_norm = normalize_category_key(prev.get("category", ""))
            cat_match = (curr_cat_norm == prev_cat_norm) or (curr_cat_norm in prev_cat_norm) or (prev_cat_norm in curr_cat_norm)
            if not cat_match:
                continue
                
            # Condition 3: Location similarity
            prev_loc = (prev.get("location") or "").lower()
            prev_loc_keywords = set(w for w in prev_loc.replace(",", " ").replace(".", " ").split() if len(w) > 2)
            loc_overlap = loc_keywords.intersection(prev_loc_keywords)
            loc_matched = (curr_loc in prev_loc or prev_loc in curr_loc or len(loc_overlap) > 0)
            
            # Condition 4: Description similarity
            prev_desc = (prev.get("description") or "").lower()
            desc_sim = calculate_text_similarity(curr_desc, prev_desc)
            
            # If same category AND (overlapping location OR description similarity)
            if loc_matched or desc_sim >= 0.20:
                ticket_ref = prev.get("ticket_number") or str(prev.get("_id"))
                prev_method_label = prev.get("reporting_method", "Manual")
                return {
                    "is_duplicate": True,
                    "duplicate_of": ticket_ref,
                    "duplicate_method": prev_method_label,
                    "duplicate_reason": f"Duplicate of #{ticket_ref} ({prev_method_label} report) submitted by you."
                }
                
        return {"is_duplicate": False, "duplicate_of": None, "duplicate_reason": None}
    except Exception as e:
        print(f"Error in detect_citizen_duplicate: {e}")
        return {"is_duplicate": False, "duplicate_of": None, "duplicate_reason": None}

def count_similar_complaints(db, category: str, location: str, current_id: str = None) -> int:
    """
    Finds count of similar complaints in the city based on category and matching location keyword.
    """
    try:
        complaints_col = db["complaints"]
        query = {
            "category": category,
            "status": {"$ne": "Resolved"}
        }
        if current_id:
            query["_id"] = {"$ne": current_id}
            
        all_same_category = list(complaints_col.find(query))
        
        loc_words = set(w.lower() for w in location.replace(",", " ").split() if len(w) > 3)
        if not loc_words:
            return 0
            
        similar_count = 0
        for comp in all_same_category:
            other_loc = comp.get("location", "").lower()
            if any(w in other_loc for w in loc_words):
                similar_count += 1
                
        return similar_count
    except Exception:
        return 0

def calculate_priority(category: str, urgency: str, aging_hours: float, similar_count: int) -> Dict[str, Any]:
    """
    Rule-based prioritization algorithm combining:
    1. Issue Category weight
    2. User Urgency multiplier
    3. Ticket age (aging hours)
    4. Density of similar complaints in location
    """
def get_category_weight(category: str) -> float:
    if not category:
        return 2.5
    if category in settings.CATEGORY_WEIGHTS:
        return settings.CATEGORY_WEIGHTS[category]
    cat_lower = category.lower()
    for k, v in settings.CATEGORY_WEIGHTS.items():
        if cat_lower in k.lower() or k.lower() in cat_lower:
            return v
    return 2.5

def calculate_priority(category: str, urgency: str, aging_hours: float, similar_count: int) -> Dict[str, Any]:
    """
    Rule-based prioritization algorithm combining:
    1. Issue Category weight
    2. User Urgency multiplier
    3. Ticket age (aging hours)
    4. Density of similar complaints in location
    """
    # 1. Base category weight
    base_weight = get_category_weight(category)
    
    # 2. Urgency multiplier
    urgency_multipliers = {
        "Critical": 2.0,
        "High": 1.5,
        "Medium": 1.0,
        "Low": 0.8
    }
    multiplier = urgency_multipliers.get(urgency, 1.0)
    
    # 3. Aging score (+0.25 points per hour)
    aging_score = aging_hours * 0.25
    
    # 4. Similar complaint bonus (+1.5 per similar ticket)
    similar_score = similar_count * 1.5
    
    # Total Score Calculation
    total_score = round((base_weight * multiplier) + aging_score + similar_score, 2)
    
    # Determine Priority Classification Label
    if total_score >= 10.0 or urgency == "Critical":
        priority_label = "Critical"
    elif total_score >= 7.0:
        priority_label = "High"
    elif total_score >= 4.0:
        priority_label = "Medium"
    else:
        priority_label = "Low"
        
    return {
        "score": total_score,
        "priority": priority_label
    }
