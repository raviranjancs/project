from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class MissionAssignment(Base):
    __tablename__ = "mission_assignments"

    id = Column(String, primary_key=True, index=True)
    zone_id = Column(String, ForeignKey("disaster_zones.id"), nullable=False)
    depot_id = Column(String, ForeignKey("resource_depots.id"), nullable=False)
    vehicle_type = Column(String, default="4x4 Rescue Truck")
    allocated_food = Column(Integer, default=0)
    allocated_water = Column(Integer, default=0)
    allocated_medical = Column(Integer, default=0)
    status = Column(String, default="DISPATCHED")
    eta_minutes = Column(Integer, default=30)
    route_geojson = Column(JSON, nullable=True)
    dispatched_at = Column(DateTime, default=datetime.utcnow)

    zone = relationship("DisasterZone", back_populates="missions")

class IncidentReport(Base):
    __tablename__ = "incident_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    zone_id = Column(String, nullable=False)
    reported_by = Column(String, default="Field Team")
    hazard_type = Column(String, default="ROAD_BLOCK")
    description = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
