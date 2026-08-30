from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication & Session"])

@router.post("/register")
def register(payload: UserRegister, db: Session = Depends(get_db)):
    email_clean = payload.email.lower().strip()
    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    new_user = User(
        name=payload.name.strip(),
        email=email_clean,
        password=payload.password,
        role=payload.role.upper(),
        agency=payload.agency or "National Disaster Relief Command",
        phone=payload.phone
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {
        "status": "SUCCESS",
        "token": f"session-token-{new_user.id}-persist",
        "user": { "id": new_user.id, "name": new_user.name, "email": new_user.email, "role": new_user.role, "agency": new_user.agency, "phone": new_user.phone }
    }

@router.post("/login")
def login(payload: UserLogin, db: Session = Depends(get_db)):
    email_clean = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user or user.password != payload.password:
        raise HTTPException(status_code=401, detail="Incorrect email address or password.")
    return {
        "status": "SUCCESS",
        "token": f"session-token-{user.id}-persist",
        "user": { "id": user.id, "name": user.name, "email": user.email, "role": user.role, "agency": user.agency, "phone": user.phone }
    }
