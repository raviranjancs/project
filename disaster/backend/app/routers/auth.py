from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db, engine
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin

router = APIRouter(prefix="/auth", tags=["Authentication"])

def ensure_user_table():
    try:
        with engine.connect() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR NOT NULL,
                    email VARCHAR UNIQUE NOT NULL,
                    password VARCHAR NOT NULL,
                    role VARCHAR DEFAULT 'COMMANDER',
                    agency VARCHAR DEFAULT 'National Disaster Response Authority',
                    phone VARCHAR,
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
                );
            """))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS agency VARCHAR DEFAULT 'National Disaster Response Authority';"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR;"))
            conn.commit()
    except Exception as e:
        print(f"[USER MIGRATION]: {e}")

ensure_user_table()

@router.post("/register")
def register(payload: UserRegister, db: Session = Depends(get_db)):
    ensure_user_table()
    email_clean = (payload.email or "").lower().strip()
    if not email_clean:
        raise HTTPException(status_code=400, detail="Email is required.")

    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists. Please login.")

    new_user = User(
        name=(payload.name or "Operations Officer").strip(),
        email=email_clean,
        password=payload.password,
        role=(payload.role or "COMMANDER").upper(),
        agency=payload.agency or "National Disaster Response Authority",
        phone=payload.phone
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {
            "status": "SUCCESS",
            "message": "Account registered successfully! Please login with your password.",
            "user": {
                "id": new_user.id,
                "name": new_user.name,
                "email": new_user.email,
                "role": new_user.role,
                "agency": new_user.agency,
                "phone": new_user.phone
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Registration failed: {str(e)}")

@router.post("/login")
def login(payload: UserLogin, db: Session = Depends(get_db)):
    ensure_user_table()
    email_clean = (payload.email or "").lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user or user.password != payload.password:
        raise HTTPException(status_code=401, detail="Incorrect email address or password.")

    return {
        "status": "SUCCESS",
        "message": "Authenticated successfully",
        "token": f"session-token-{user.id}-persist",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "agency": user.agency,
            "phone": user.phone
        }
    }
