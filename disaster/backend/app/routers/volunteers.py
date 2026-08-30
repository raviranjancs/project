from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from app.database import get_db
from app.models.volunteer import Volunteer
from app.schemas.volunteer import VolunteerCreate, VolunteerUpdate, VolunteerResponse

router = APIRouter(prefix="/volunteers", tags=["Volunteer CRUD"])

@router.get("", response_model=List[VolunteerResponse])
def get_volunteers(db: Session = Depends(get_db)):
    return db.query(Volunteer).order_by(Volunteer.created_at.desc()).all()

@router.post("", response_model=VolunteerResponse)
def create_volunteer(payload: VolunteerCreate, db: Session = Depends(get_db)):
    vol_id = payload.id or f"VOL-{uuid.uuid4().hex[:6].upper()}"
    clean_email = (payload.email or "").strip().lower()
    if not clean_email:
        raise HTTPException(status_code=400, detail="Email is required.")

    existing = db.query(Volunteer).filter(Volunteer.email == clean_email).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Volunteer with email {clean_email} already exists.")

    new_vol = Volunteer(
        id=vol_id,
        name=(payload.name or "Volunteer").strip(),
        email=clean_email,
        phone=(payload.phone or "+91 9876543210").strip(),
        skills=payload.skills or "First Aid, Search & Rescue",
        status=(payload.status or "AVAILABLE").upper(),
        assigned_zone_id=payload.assigned_zone_id,
        latitude=float(payload.latitude) if payload.latitude is not None else 28.6139,
        longitude=float(payload.longitude) if payload.longitude is not None else 77.2090,
        created_by_email=(payload.created_by_email or "commander@ndma.gov.in").strip().lower()
    )

    try:
        db.add(new_vol)
        db.commit()
        db.refresh(new_vol)
        return new_vol
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database error: {str(e)}")

@router.put("/{vol_id}", response_model=VolunteerResponse)
def update_volunteer(vol_id: str, payload: VolunteerUpdate, requester_email: Optional[str] = Query(None), requester_role: Optional[str] = Query(None), db: Session = Depends(get_db)):
    vol = db.query(Volunteer).filter(Volunteer.id == vol_id).first()
    if not vol:
        raise HTTPException(status_code=404, detail="Volunteer not found.")

    user_email = (payload.requester_email or requester_email or "").strip().lower()
    user_role = (payload.requester_role or requester_role or "").strip().upper()
    owner_email = (vol.created_by_email or "").strip().lower()

    if user_role != "COMMANDER" and user_email != owner_email:
        raise HTTPException(status_code=403, detail=f"Permission Denied: You cannot edit volunteers registered by {vol.created_by_email}.")

    for k, v in payload.dict(exclude_unset=True).items():
        if k not in ["requester_email", "requester_role"] and v is not None:
            setattr(vol, k, v)

    try:
        db.commit()
        db.refresh(vol)
        return vol
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Update failed: {str(e)}")

@router.delete("/{vol_id}")
def delete_volunteer(vol_id: str, requester_email: Optional[str] = Query(None), requester_role: Optional[str] = Query(None), db: Session = Depends(get_db)):
    vol = db.query(Volunteer).filter(Volunteer.id == vol_id).first()
    if not vol:
        raise HTTPException(status_code=404, detail="Volunteer not found.")

    user_email = (requester_email or "").strip().lower()
    user_role = (requester_role or "").strip().upper()
    owner_email = (vol.created_by_email or "").strip().lower()

    if user_role != "COMMANDER" and user_email != owner_email:
        raise HTTPException(status_code=403, detail=f"Permission Denied: You cannot delete volunteers registered by {vol.created_by_email}.")

    try:
        db.delete(vol)
        db.commit()
        return {"status": "DELETED", "id": vol_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Delete failed: {str(e)}")
