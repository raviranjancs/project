from sqlalchemy import text
from app.database import engine, Base

with engine.connect() as conn:
    conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
    conn.execute(text("ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS created_by_email VARCHAR DEFAULT 'commander@ndma.gov.in';"))
    conn.execute(text("ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS phone VARCHAR DEFAULT '+91 9876543210';"))
    conn.execute(text("ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS skills VARCHAR DEFAULT 'First Aid, Rescue';"))
    conn.execute(text("ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'AVAILABLE';"))
    conn.execute(text("ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS assigned_zone_id VARCHAR;"))
    conn.execute(text("ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS latitude FLOAT DEFAULT 28.6139;"))
    conn.execute(text("ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS longitude FLOAT DEFAULT 77.2090;"))
    conn.execute(text("ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW();"))
    conn.commit()
    print("[SUCCESS] Neon DB columns migrated!")

Base.metadata.create_all(bind=engine)
