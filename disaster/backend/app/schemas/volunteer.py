from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class VolunteerBase(BaseModel):
    name: str
    email: str
    phone: str
    skills: str = "First Aid, Search & Rescue"
    status: str = "AVAILABLE"
    assigned_zone_id: Optional[str] = None
    latitude: Optional[float] = 25.5941
    longitude: Optional[float] = 85.1376

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

class VolunteerResponse(VolunteerBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True
