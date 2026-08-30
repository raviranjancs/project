from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from datetime import datetime
from app.database import Base

class ResourceDepot(Base):
    __tablename__ = "resource_depots"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    food_packets = Column(Integer, default=20000)
    water_liters = Column(Integer, default=60000)
    medical_kits = Column(Integer, default=1000)
    shelter_capacity = Column(Integer, default=3000)
    available_vehicles = Column(Integer, default=10)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    contact_person = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ResourceStock(Base):
    __tablename__ = "resource_stocks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    depot_id = Column(String, index=True, nullable=False)
    item_category = Column(String, nullable=False)
    quantity = Column(Integer, default=0)
    unit = Column(String, default="units")
    last_updated = Column(DateTime, default=datetime.utcnow)
