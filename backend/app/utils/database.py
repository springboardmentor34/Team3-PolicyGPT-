import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Reads from the DATABASE_URL environment variable if one is set —
# this is what lets Docker Compose point this at the "db" service
# container (postgresql://postgres:1234@db:5432/policygpt) without
# touching this file. If DATABASE_URL isn't set at all (e.g. running
# locally via venv like before, with no Docker involved), it falls
# back to the exact same localhost connection this always used.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:1234@localhost:5432/policygpt"
)

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()