from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import datetime

router = APIRouter(prefix="/dispatch", tags=["Emergency Dispatch"])

class SMSBroadcastRequest(BaseModel):
    recipient_group: str
    message: str
    zone_id: Optional[str] = "Z-GLOBAL-03"
    priority: Optional[str] = "CRITICAL_LIFELINE"

@router.post("/broadcast-sms")
def send_emergency_sms(payload: SMSBroadcastRequest):
    return {
        "status": "DISPATCHED",
        "gateway": "Gov-Emergency-SMS-Gateway-v4",
        "recipient_group": payload.recipient_group,
        "message": payload.message,
        "sent_count": 48 if payload.recipient_group == "ALL_UNITS" else 16,
        "delivery_rate": "99.4%",
        "timestamp": datetime.datetime.now().strftime("%H:%M:%S")
    }
