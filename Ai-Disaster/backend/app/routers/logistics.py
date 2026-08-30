from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.geospatial import DisasterZone
from app.models.inventory import ResourceDepot
from app.services.prediction_engine import demand_predictor
from app.services.optimizer import DisasterLogisticsOptimizer
from app.schemas.optimization import AllocationRequest, OptimizationResult

router = APIRouter(prefix="/optimize", tags=["Logistics Optimization"])

@router.post("/allocation", response_model=OptimizationResult)
def run_allocation(payload: AllocationRequest, db: Session = Depends(get_db)):
    zones_query = db.query(DisasterZone)
    if payload.zone_ids:
        zones_query = zones_query.filter(DisasterZone.id.in_(payload.zone_ids))
    zones_db = zones_query.all()

    depots_query = db.query(ResourceDepot)
    if payload.depot_ids:
        depots_query = depots_query.filter(ResourceDepot.id.in_(payload.depot_ids))
    depots_db = depots_query.all()

    zones_data = []
    for z in zones_db:
        p = demand_predictor.predict(
            population=z.population,
            severity=z.severity_score,
            flood_depth=z.flood_depth_m,
            damage_pct=z.damage_pct,
            isolation_days=z.isolation_days,
            vulnerability_index=z.vulnerability_index
        )
        zones_data.append({
            "id": z.id,
            "severity_score": z.severity_score,
            "latitude": z.latitude,
            "longitude": z.longitude,
            "demands": {
                "food_packets": p["food_packets"]["point_estimate"],
                "water_liters": p["water_liters"]["point_estimate"],
                "medical_kits": p["medical_kits"]["point_estimate"]
            }
        })

    depots_data = [
        {
            "id": d.id,
            "food_packets": d.food_packets,
            "water_liters": d.water_liters,
            "medical_kits": d.medical_kits,
            "latitude": d.latitude,
            "longitude": d.longitude
        }
        for d in depots_db
    ]

    return DisasterLogisticsOptimizer.solve_allocation(
        depots=depots_data,
        zones=zones_data,
        priority_overrides=payload.priority_overrides
    )
