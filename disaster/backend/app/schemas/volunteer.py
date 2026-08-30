from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class VolunteerBase(BaseModel):
    name: str
    email: str
    phone: Optional[str] = "+91 9876543210"
    skills: Optional[str] = "First Aid, Rescue"
    status: Optional[str] = "AVAILABLE"
    assigned_zone_id: Optional[str] = None
    latitude: Optional[float] = 28.6139
    longitude: Optional[float] = 77.2090
    created_by_email: Optional[str] = "commander@ndma.gov.in"

class VolunteerCreate(VolunteerBase):
    id: Optional[str] = None

class VolunteerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: Optional[str] = None
    status: Optional[str] = None
    assigned_zone_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    requester_email: Optional[str] = None
    requester_role: Optional[str] = None

class VolunteerResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = "+91 9876543210"
    skills: Optional[str] = "First Aid, Rescue"
    status: Optional[str] = "AVAILABLE"
    assigned_zone_id: Optional[str] = None
    latitude: Optional[float] = 28.6139
    longitude: Optional[float] = 77.2090
    created_by_email: Optional[str] = "commander@ndma.gov.in"
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
