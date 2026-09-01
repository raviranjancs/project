from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: str = "COMMANDER"
    agency: Optional[str] = "Disaster Relief Operations"
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    agency: str
    phone: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
