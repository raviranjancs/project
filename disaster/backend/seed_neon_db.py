from app.database import SessionLocal, Base, engine, init_neon_extensions
from app.models.user import User
from app.models.volunteer import Volunteer
from app.models.geospatial import DisasterZone
from app.models.inventory import ResourceDepot

def seed():
    init_neon_extensions()
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        db.query(Volunteer).delete()
        db.commit()

        db.add_all([
            Volunteer(id="VOL-101", name="Amit Verma (First Responder)", email="amit.verma@relief.org", phone="+91 9876540001", skills="Paramedic, Trauma Care", status="AVAILABLE", latitude=28.6139, longitude=77.2090, created_by_email="commander@ndma.gov.in"),
            Volunteer(id="VOL-102", name="Dr. Ananya Sen (Surgeon)", email="ananya.sen@ndrf.in", phone="+91 9876540002", skills="Emergency Surgeon, Triage", status="DEPLOYED", latitude=25.5941, longitude=85.1376, created_by_email="priya@relief.org"),
            Volunteer(id="VOL-103", name="Kenji Sato (Rescue Tech)", email="kenji.sato@jica.go.jp", phone="+81 9012345678", skills="Structural Engineering, Drone Search", status="AVAILABLE", latitude=35.6762, longitude=139.6503, created_by_email="priya@relief.org")
        ])
        db.commit()
        print("[SUCCESS] Neon DB seeded with sample multi-owner volunteers!")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
