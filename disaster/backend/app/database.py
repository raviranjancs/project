from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import DATABASE_URL

engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=300, pool_size=10, max_overflow=20)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_neon_extensions():
    try:
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
            conn.execute(text("ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS created_by_email VARCHAR DEFAULT 'commander@ndma.gov.in';"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS agency VARCHAR DEFAULT 'Disaster Relief Force';"))
            conn.commit()
    except Exception as e:
        print(f"Migration: {e}")
