from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="COMMANDER")
    agency = Column(String, default="National Disaster Response Agency")
    phone = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
