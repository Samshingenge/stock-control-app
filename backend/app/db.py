# app/db.py
import os
from typing import Generator, Annotated

from fastapi import Depends, APIRouter
from sqlmodel import SQLModel, Session, create_engine


router = APIRouter(tags=["health"])

@router.get("/health")
def health():
    return {"status": "ok"}


# Use your DB from docker-compose. Adjust if your env differs.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://postgres:postgres@stockctl-db:5432/stockctl",
)

engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,   # avoids stale connections
)

def init_db() -> None:
    """Create tables if they don't exist (optional: call on startup)."""
    SQLModel.metadata.create_all(engine)

def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session

# This is what your routers import
SessionDep = Annotated[Session, Depends(get_session)]

# app/db.py — add at the bottom of the file

def init_db() -> None:
    """
    Create tables if they don't exist. No seeding here,
    just ensure metadata is applied.
    """
    from sqlmodel import SQLModel  # local import to avoid cycles
    # `engine` must already be defined in this module
    SQLModel.metadata.create_all(engine)
