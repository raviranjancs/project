from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.geospatial import DisasterZone
from app.services.prediction_engine import demand_predictor
from app.schemas.prediction import DemandPredictionResponse

router = APIRouter(prefix="/predict", tags=["AI Demand Prediction"])

@router.get("/demand/{zone_id}", response_model=DemandPredictionResponse)
def get_zone_demand(zone_id: str, db: Session = Depends(get_db)):
    zone = db.query(DisasterZone).filter(DisasterZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    preds = demand_predictor.predict(
        population=zone.population,
        severity=zone.severity_score,
        flood_depth=zone.flood_depth_m,
        damage_pct=zone.damage_pct,
        isolation_days=zone.isolation_days,
        vulnerability_index=zone.vulnerability_index
    )

    return {
        "zone_id": zone.id,
        "zone_name": zone.name,
        "severity_score": zone.severity_score,
        "vulnerability_index": zone.vulnerability_index,
        "predicted_needs": preds
    }
