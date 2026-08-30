from pydantic import BaseModel
from typing import Optional, Dict, Any, List

class DisasterZoneCreate(BaseModel):
    id: str
    name: str
    disaster_type: str = "Flood"
    severity_score: float = 5.0
    population: int = 10000
    flood_depth_m: float = 1.0
    damage_pct: float = 0.5
    isolation_days: int = 2
    vulnerability_index: float = 1.0
    latitude: float
    longitude: float
    polygon_geojson: Optional[Dict[str, Any]] = None

class DisasterZoneResponse(DisasterZoneCreate):
    class Config:
        from_attributes = True

class ResourceDepotResponse(BaseModel):
    id: str
    name: str
    food_packets: int
    water_liters: int
    medical_kits: int
    shelter_capacity: int
    available_vehicles: int
    latitude: float
    longitude: float

    class Config:
        from_attributes = True
