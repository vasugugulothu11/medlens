from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.routes import patients, reports, summaries, inconsistencies, anatomy

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite/PostgreSQL schema on application startup
    print(f"[MedLens] Initializing database tables at {settings.DATABASE_URL}...")
    init_db()
    print("[MedLens] Database initialized successfully.")
    yield
    print("[MedLens] Shutting down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-ready hackathon backend prototype for MedLens clinical information intelligence.",
    lifespan=lifespan
)

# CORS Configuration: allow all origins for hackathon & local development flexibility
# Production note: restrict allow_origins to exact verified frontend domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(patients.router)
app.include_router(reports.router)
app.include_router(summaries.router)
app.include_router(inconsistencies.router)
app.include_router(anatomy.router)

@app.get("/")
def root():
    return {
        "message": "MedLens API is running",
        "version": settings.VERSION,
        "disclaimer": "MedLens organizes clinical lab data and is NOT a diagnostic tool. Always consult a licensed healthcare professional."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
