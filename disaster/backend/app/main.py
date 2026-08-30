from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine, init_neon_extensions
from app.routers import auth, volunteers, zones, inventory, predictions, logistics

init_neon_extensions()
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Disaster Operations API", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router, prefix="/api/v1")
app.include_router(volunteers.router, prefix="/api/v1")
app.include_router(inventory.router, prefix="/api/v1")
app.include_router(zones.router, prefix="/api/v1")
app.include_router(predictions.router, prefix="/api/v1")
app.include_router(logistics.router, prefix="/api/v1")
