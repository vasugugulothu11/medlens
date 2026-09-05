from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Determine connect args based on DB engine
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Create SQLAlchemy engine
# Production note: In production with PostgreSQL, use pool_size=10, max_overflow=20
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

# Session factory for DB transactions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base model
Base = declarative_base()

def get_db():
    """
    FastAPI dependency that yields a scoped database session and ensures cleanup.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """
    Bootstrap database tables automatically for hackathon convenience.
    In production, replace with Alembic database migrations.
    """
    # Import all models to ensure they are registered with Base metadata
    from app import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
