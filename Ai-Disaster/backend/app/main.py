from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine, init_neon_extensions
from app.routers import zones, inventory, predictions, logistics

init_neon_extensions()
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI-Based Disaster Response Management System",
    description="Full-stack disaster management system powered by Neon PostgreSQL & Google OR-Tools",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(zones.router, prefix="/api/v1")
app.include_router(inventory.router, prefix="/api/v1")
app.include_router(predictions.router, prefix="/api/v1")
app.include_router(logistics.router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "status": "ONLINE",
        "system": "Disaster Response AI Command Engine",
        "database": "Neon Serverless PostgreSQL",
        "docs_url": "/docs"
    }
