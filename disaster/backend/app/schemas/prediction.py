from pydantic import BaseModel
from typing import Dict

class ConfidenceInterval(BaseModel):
    point_estimate: int
    ci_lower: int
    ci_upper: int

class DemandPredictionResponse(BaseModel):
    zone_id: str
    zone_name: str
    severity_score: float
    vulnerability_index: float
    predicted_needs: Dict[str, ConfidenceInterval]
