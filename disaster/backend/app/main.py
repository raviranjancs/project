from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import text
from app.database import Base, engine, SessionLocal, init_neon_extensions
from app.routers import auth, volunteers, zones, inventory, predictions, logistics
from app.models.geospatial import DisasterZone
from app.models.inventory import ResourceDepot
from app.models.volunteer import Volunteer
from app.models.user import User

init_neon_extensions()
Base.metadata.create_all(bind=engine)

def auto_seed_if_empty():
    db = SessionLocal()
    try:
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
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
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS volunteers (
                    id VARCHAR PRIMARY KEY,
                    name VARCHAR NOT NULL,
                    email VARCHAR UNIQUE NOT NULL,
                    phone VARCHAR DEFAULT '+91 9876543210',
                    skills VARCHAR DEFAULT 'First Aid, Rescue',
                    status VARCHAR DEFAULT 'AVAILABLE',
                    assigned_zone_id VARCHAR,
                    latitude FLOAT DEFAULT 28.6139,
                    longitude FLOAT DEFAULT 77.2090,
                    created_by_email VARCHAR DEFAULT 'commander@ndma.gov.in',
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
                );
            """))
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS disaster_zones (
                    id VARCHAR PRIMARY KEY,
                    name VARCHAR NOT NULL,
                    disaster_type VARCHAR NOT NULL,
                    severity_score FLOAT NOT NULL,
                    population INTEGER NOT NULL,
                    latitude FLOAT NOT NULL,
                    longitude FLOAT NOT NULL
                );
            """))
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS resource_depots (
                    id VARCHAR PRIMARY KEY,
                    name VARCHAR NOT NULL,
                    food_packets INTEGER DEFAULT 50000,
                    water_liters INTEGER DEFAULT 100000,
                    medical_kits INTEGER DEFAULT 2500,
                    available_vehicles INTEGER DEFAULT 30,
                    latitude FLOAT NOT NULL,
                    longitude FLOAT NOT NULL
                );
            """))
            conn.commit()

        if db.query(DisasterZone).count() == 0:
            print("[AUTO-SEED] Seeding Global Worldwide Disaster Zones...")
            world_zones = [
                DisasterZone(id="Z-GLOBAL-01", name="Tokyo Bay Megalopolis, Japan", disaster_type="Catastrophic 8.2 Earthquake & Tsunami", severity_score=9.6, population=145000, latitude=35.6762, longitude=139.6503),
                DisasterZone(id="Z-GLOBAL-02", name="Kahramanmaraş Fault Zone, Turkey", disaster_type="Major Seismicity & Structural Collapse", severity_score=9.3, population=92000, latitude=37.5753, longitude=36.9228),
                DisasterZone(id="Z-GLOBAL-03", name="Sumatra Trench, Indonesia", disaster_type="Tsunami Surge & Subduction Hazard", severity_score=8.9, population=110000, latitude=-0.5897, longitude=101.3431),
                DisasterZone(id="Z-GLOBAL-04", name="Ganges-Brahmaputra Basin, India", disaster_type="Severe Monsoon Flood Inundation", severity_score=8.6, population=185000, latitude=25.5941, longitude=85.1376),
                DisasterZone(id="Z-GLOBAL-05", name="Sierra Nevada & California Basin, USA", disaster_type="Extreme Wildfire Complex", severity_score=8.1, population=48000, latitude=37.7749, longitude=-122.4194),
                DisasterZone(id="Z-GLOBAL-06", name="Valparaíso Coastal Sector, Chile", disaster_type="Coastal Wildfire & Tsunami Alert", severity_score=7.9, population=42000, latitude=-33.0472, longitude=-71.6127)
            ]
            db.add_all(world_zones)
            db.commit()

        if db.query(ResourceDepot).count() == 0:
            print("[AUTO-SEED] Seeding Strategic Global Aid Hubs...")
            world_depots = [
                ResourceDepot(id="DEPOT-EUROPE", name="European Humanitarian Logistics Base (Geneva, Switzerland)", food_packets=180000, water_liters=450000, medical_kits=12000, available_vehicles=60, latitude=46.2044, longitude=6.1432),
                ResourceDepot(id="DEPOT-ASIA", name="UNHRD Strategic Relief Base (New Delhi, India)", food_packets=250000, water_liters=600000, medical_kits=18500, available_vehicles=85, latitude=28.6139, longitude=77.2090),
                ResourceDepot(id="DEPOT-PACIFIC", name="Asia-Pacific Rapid Deployment Base (Tokyo, Japan)", food_packets=140000, water_liters=380000, medical_kits=9500, available_vehicles=45, latitude=35.5494, longitude=139.7798),
                ResourceDepot(id="DEPOT-AMERICAS", name="Humanitarian Response Depot Americas (Panama City)", food_packets=160000, water_liters=420000, medical_kits=11000, available_vehicles=50, latitude=8.9824, longitude=-79.5199)
            ]
            db.add_all(world_depots)
            db.commit()

        if db.query(Volunteer).count() == 0:
            print("[AUTO-SEED] Seeding International Field Responders...")
            db.add_all([
                Volunteer(id="VOL-101", name="Dr. Kenji Sato (Search & Rescue)", email="kenji.sato@jica.go.jp", phone="+81 9012345678", skills="Earthquake Rescue, Drone Mapping", status="AVAILABLE", latitude=35.6762, longitude=139.6503, created_by_email="commander@ndma.gov.in"),
                Volunteer(id="VOL-102", name="Amit Verma (Trauma Paramedic)", email="amit.verma@relief.org", phone="+91 9876540001", skills="Paramedic, Emergency Triage", status="DEPLOYED", latitude=25.5941, longitude=85.1376, created_by_email="commander@ndma.gov.in"),
                Volunteer(id="VOL-103", name="Elena Rossi (Logistics Lead)", email="elena.rossi@unhrd.org", phone="+41 229171234", skills="Airlift Dispatch, Supply Routing", status="AVAILABLE", latitude=46.2044, longitude=6.1432, created_by_email="commander@ndma.gov.in")
            ])
            db.commit()

        if db.query(User).filter(User.email == 'commander@ndma.gov.in').first() is None:
            db.add(User(name="Col. Raviranjan Kumar", email="commander@ndma.gov.in", password="admin", role="COMMANDER", agency="National Disaster Operations Command", phone="+91 9876543210"))
            db.commit()

    except Exception as e:
        print(f"[AUTO-SEED NOTICE]: {e}")
        db.rollback()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    auto_seed_if_empty()
    yield

app = FastAPI(
    title="RakshaGrid DOCP - National Disaster Operations Command Platform",
    description="Full-stack disaster management system powered by PostgreSQL, PostGIS & Google OR-Tools",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(volunteers.router, prefix="/api/v1")
app.include_router(inventory.router, prefix="/api/v1")
app.include_router(zones.router, prefix="/api/v1")
app.include_router(predictions.router, prefix="/api/v1")
app.include_router(logistics.router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "status": "ONLINE",
        "system": "RakshaGrid DOCP - Disaster Operations Command Platform",
        "database": "Serverless PostgreSQL (PostGIS Enabled)",
        "endpoints": [
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/v1/zones",
            "/api/v1/depots",
            "/api/v1/volunteers",
            "/api/v1/predict/demand/{zone_id}",
            "/api/v1/optimize/allocation"
        ],
        "docs_url": "/docs"
    }
