from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
import uuid
from app.database import get_db
from app.models.inventory import ResourceDepot
from app.schemas.disaster import ResourceDepotResponse

router = APIRouter(prefix="/depots", tags=["Inventory & Depots"])

class RestockPayload(BaseModel):
    food_packets_add: int = 0
    water_liters_add: int = 0
    medical_kits_add: int = 0
    shelter_capacity_add: int = 0

@router.get("", response_model=List[ResourceDepotResponse])
def list_depots(db: Session = Depends(get_db)):
    return db.query(ResourceDepot).all()

@router.put("/{depot_id}/restock", response_model=ResourceDepotResponse)
def restock_depot(depot_id: str, payload: RestockPayload, db: Session = Depends(get_db)):
    depot = db.query(ResourceDepot).filter(ResourceDepot.id == depot_id).first()
    if not depot:
        raise HTTPException(status_code=404, detail="Depot not found")
    depot.food_packets = max(0, depot.food_packets + payload.food_packets_add)
    depot.water_liters = max(0, depot.water_liters + payload.water_liters_add)
    depot.medical_kits = max(0, depot.medical_kits + payload.medical_kits_add)
    depot.shelter_capacity = max(0, depot.shelter_capacity + payload.shelter_capacity_add)
    db.commit()
    db.refresh(depot)
    return depot
