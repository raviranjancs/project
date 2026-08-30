from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class DisasterZone(Base):
    __tablename__ = "disaster_zones"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    disaster_type = Column(String, default="Flood")
    severity_score = Column(Float, default=5.0)
    population = Column(Integer, default=10000)
    flood_depth_m = Column(Float, default=1.0)
    damage_pct = Column(Float, default=0.5)
    isolation_days = Column(Integer, default=2)
    vulnerability_index = Column(Float, default=1.0)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    polygon_geojson = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    missions = relationship("MissionAssignment", back_populates="zone")

class ImpactGrid(Base):
    __tablename__ = "impact_grids"

    id = Column(String, primary_key=True, index=True)
    grid_code = Column(String, nullable=False)
    severity_level = Column(String, default="HIGH")
    geometry_geojson = Column(JSON, nullable=False)
    computed_at = Column(DateTime, default=datetime.utcnow)
