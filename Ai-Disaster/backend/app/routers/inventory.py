from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.inventory import ResourceDepot
from app.schemas.disaster import ResourceDepotResponse

router = APIRouter(prefix="/depots", tags=["Inventory & Depots"])

@router.get("", response_model=List[ResourceDepotResponse])
def list_depots(db: Session = Depends(get_db)):
    return db.query(ResourceDepot).all()
