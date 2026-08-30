from app.database import SessionLocal, Base, engine, init_neon_extensions
from app.models.geospatial import DisasterZone
from app.models.inventory import ResourceDepot

def seed():
    print("[1/3] Initializing Neon PostGIS and Database Tables...")
    init_neon_extensions()
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("[2/3] Checking and seeding sample data...")
        if db.query(DisasterZone).count() == 0:
            sample_zones = [
                DisasterZone(
                    id="Z-01",
                    name="Riverside Sector North",
                    disaster_type="Flood",
                    severity_score=8.8,
                    population=14500,
                    flood_depth_m=2.4,
                    damage_pct=0.75,
                    isolation_days=3,
                    vulnerability_index=1.35,
                    latitude=25.5941,
                    longitude=85.1376
                ),
                DisasterZone(
                    id="Z-02",
                    name="East Bypass Zone",
                    disaster_type="Flood",
                    severity_score=6.4,
                    population=8200,
                    flood_depth_m=1.2,
                    damage_pct=0.40,
                    isolation_days=1,
                    vulnerability_index=1.05,
                    latitude=25.6050,
                    longitude=85.1820
                ),
                DisasterZone(
                    id="Z-03",
                    name="Old Industrial District",
                    disaster_type="Flood",
                    severity_score=9.2,
                    population=19800,
                    flood_depth_m=3.1,
                    damage_pct=0.88,
                    isolation_days=4,
                    vulnerability_index=1.45,
                    latitude=25.6210,
                    longitude=85.1150
                ),
                DisasterZone(
                    id="Z-04",
                    name="South Agricultural Basin",
                    disaster_type="Flood",
                    severity_score=7.1,
                    population=11200,
                    flood_depth_m=1.8,
                    damage_pct=0.60,
                    isolation_days=2,
                    vulnerability_index=1.15,
                    latitude=25.5680,
                    longitude=85.1500
                )
            ]
            db.add_all(sample_zones)
            print(" -> Seeded 4 Disaster Zones.")

        if db.query(ResourceDepot).count() == 0:
            sample_depots = [
                ResourceDepot(
                    id="DEPOT-ALPHA",
                    name="Central Military Logistics Depot",
                    food_packets=35000,
                    water_liters=95000,
                    medical_kits=1800,
                    shelter_capacity=4500,
                    available_vehicles=18,
                    latitude=25.5720,
                    longitude=85.0950,
                    contact_person="Col. V. Sharma"
                ),
                ResourceDepot(
                    id="DEPOT-BETA",
                    name="Eastern Civil Aviation Relief Base",
                    food_packets=22000,
                    water_liters=60000,
                    medical_kits=950,
                    shelter_capacity=2800,
                    available_vehicles=12,
                    latitude=25.6100,
                    longitude=85.2250,
                    contact_person="Director K. Roy"
                )
            ]
            db.add_all(sample_depots)
            print(" -> Seeded 2 Resource Depots.")

        db.commit()
        print("[3/3] Neon PostgreSQL Seed Completed Successfully!")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Database seeding failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
