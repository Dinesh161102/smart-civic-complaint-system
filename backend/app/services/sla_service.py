from datetime import datetime, timedelta
from typing import Dict, Any
from app.config import settings

def calculate_sla_status(created_at_str: str, priority: str, status: str) -> Dict[str, Any]:
    """
    Evaluates SLA metrics based on creation time, priority level, and current workflow status.
    """
    sla_hours = settings.SLA_HOURS.get(priority, 48)
    
    try:
        created_at = datetime.fromisoformat(created_at_str)
    except Exception:
        created_at = datetime.now()
        
    deadline = created_at + timedelta(hours=sla_hours)
    now = datetime.now()
    aging_hours = max(0.0, round((now - created_at).total_seconds() / 3600.0, 1))
    
    if status == "Resolved":
        sla_status = "RESOLVED"
    elif aging_hours >= sla_hours:
        sla_status = "BREACHED"
    elif aging_hours >= (sla_hours * 0.75):
        sla_status = "NEAR_BREACH"
    else:
        sla_status = "ON_TIME"
        
    return {
        "sla_hours": sla_hours,
        "sla_deadline": deadline.isoformat(),
        "sla_status": sla_status,
        "aging_hours": aging_hours
    }
