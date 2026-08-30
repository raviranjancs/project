from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from app.database import Base

class Volunteer(Base):
    __tablename__ = "volunteers"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True, default="+91 9876543210")
    skills = Column(String, nullable=True, default="First Aid, Rescue")
    status = Column(String, nullable=True, default="AVAILABLE")
    assigned_zone_id = Column(String, nullable=True)
    latitude = Column(Float, nullable=True, default=28.6139)
    longitude = Column(Float, nullable=True, default=77.2090)
    created_by_email = Column(String, nullable=True, default="commander@ndma.gov.in")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=True)
