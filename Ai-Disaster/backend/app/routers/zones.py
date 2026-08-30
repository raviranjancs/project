from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.geospatial import DisasterZone
from app.schemas.disaster import DisasterZoneResponse, DisasterZoneCreate

router = APIRouter(prefix="/zones", tags=["Disaster Zones"])

@router.get("", response_model=List[DisasterZoneResponse])
def list_zones(db: Session = Depends(get_db)):
    return db.query(DisasterZone).all()

@router.post("", response_model=DisasterZoneResponse)
def create_zone(payload: DisasterZoneCreate, db: Session = Depends(get_db)):
    existing = db.query(DisasterZone).filter(DisasterZone.id == payload.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Zone ID already exists")
    new_zone = DisasterZone(**payload.dict())
    db.add(new_zone)
    db.commit()
    db.refresh(new_zone)
    return new_zone
