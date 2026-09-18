from fastapi import APIRouter, Depends
from typing import Dict, Any, List
from collections import Counter
from app.database import get_db
from app.routers.complaints import format_complaint_doc
from app.services.auth_service import require_roles, ROLE_OFFICER

router = APIRouter(prefix="/api/analytics", tags=["Municipal Analytics & Dashboard"])

@router.get("", response_model=Dict[str, Any])
@router.get("/", response_model=Dict[str, Any])
def get_analytics_summary(
    current_user: dict = Depends(require_roles([ROLE_OFFICER])),
    db=Depends(get_db)
):
    """
    Get executive analytics summary. Restricted to Municipal Officers.
    """
    col = db["complaints"]
    all_docs = list(col.find({}))
    formatted = [format_complaint_doc(doc, db) for doc in all_docs]
    
    total_complaints = len(formatted)
    if total_complaints == 0:
        return {
            "total_complaints": 0,
            "unresolved_complaints": 0,
            "resolved_complaints": 0,
            "completed_complaints": 0,
            "aging_complaints_count": 0,
            "sla_breached_count": 0,
            "sla_compliance_rate": 100.0,
            "status_distribution": {
                "New": 0, "Assigned": 0, "In Progress": 0, "Completed": 0, "Resolved": 0
            },
            "category_distribution": {},
            "priority_distribution": {
                "Critical": 0, "High": 0, "Medium": 0, "Low": 0
            },
            "sla_distribution": {
                "ON_TIME": 0, "NEAR_BREACH": 0, "BREACHED": 0, "RESOLVED": 0
            },
            "high_priority_locations": [],
            "top_aging_complaints": []
        }
        
    status_counts = Counter(item["status"] for item in formatted)
    category_counts = Counter(item["category"] for item in formatted)
    priority_counts = Counter(item["priority"] for item in formatted)
    sla_counts = Counter(item["sla_status"] for item in formatted)
    
    unresolved = [item for item in formatted if item["status"] != "Resolved"]
    aging_complaints = [item for item in unresolved if item["aging_hours"] >= 24.0]
    sla_breached = [item for item in unresolved if item["sla_status"] == "BREACHED"]
    
    # SLA Compliance %
    active_count = len(unresolved)
    if active_count > 0:
        sla_compliance_rate = round(((active_count - len(sla_breached)) / active_count) * 100.0, 1)
    else:
        sla_compliance_rate = 100.0
        
    # High Priority Hotspot Locations (Count occurrences of keywords in location strings)
    location_list = [item["location"].strip() for item in formatted if item["location"]]
    location_counts = Counter(location_list)
    top_locations = [{"location": loc, "count": count} for loc, count in location_counts.most_common(5)]
    
    # Top aging unresolved complaints sorted by aging hours
    sorted_aging = sorted(unresolved, key=lambda x: x["aging_hours"], reverse=True)[:5]
    top_aging_formatted = [
        {
            "ticket_number": c["ticket_number"],
            "category": c["category"],
            "location": c["location"],
            "priority": c["priority"],
            "status": c["status"],
            "aging_hours": c["aging_hours"],
            "sla_status": c["sla_status"]
        } for c in sorted_aging
    ]
    
    return {
        "total_complaints": total_complaints,
        "unresolved_complaints": len(unresolved),
        "resolved_complaints": status_counts.get("Resolved", 0),
        "completed_complaints": status_counts.get("Completed", 0),
        "aging_complaints_count": len(aging_complaints),
        "sla_breached_count": len(sla_breached),
        "sla_compliance_rate": sla_compliance_rate,
        "status_distribution": {
            "New": status_counts.get("New", 0),
            "Assigned": status_counts.get("Assigned", 0),
            "In Progress": status_counts.get("In Progress", 0),
            "Completed": status_counts.get("Completed", 0),
            "Resolved": status_counts.get("Resolved", 0)
        },
        "category_distribution": dict(category_counts),
        "priority_distribution": {
            "Critical": priority_counts.get("Critical", 0),
            "High": priority_counts.get("High", 0),
            "Medium": priority_counts.get("Medium", 0),
            "Low": priority_counts.get("Low", 0)
        },

        "sla_distribution": {
            "ON_TIME": sla_counts.get("ON_TIME", 0),
            "NEAR_BREACH": sla_counts.get("NEAR_BREACH", 0),
            "BREACHED": sla_counts.get("BREACHED", 0),
            "RESOLVED": sla_counts.get("RESOLVED", 0)
        },
        "high_priority_locations": top_locations,
        "top_aging_complaints": top_aging_formatted
    }
