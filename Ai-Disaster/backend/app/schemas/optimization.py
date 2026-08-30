from pydantic import BaseModel
from typing import List, Dict, Optional, Any

class AllocationRequest(BaseModel):
    zone_ids: Optional[List[str]] = None
    depot_ids: Optional[List[str]] = None
    priority_overrides: Optional[Dict[str, float]] = None

class RouteGeometry(BaseModel):
    type: str = "LineString"
    coordinates: List[List[float]]

class AllocationItem(BaseModel):
    zone_id: str
    depot_id: str
    allocated_food: int
    allocated_water: int
    allocated_medical: int
    coverage_percentage: float
    route: RouteGeometry

class OptimizationResult(BaseModel):
    status: str
    total_fulfillment_rate: float
    allocations: List[AllocationItem]
