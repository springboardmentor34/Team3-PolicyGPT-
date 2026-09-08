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

# Cloud providers like Render or Supabase sometimes set 'postgres://' which SQLAlchemy 2.0 rejects
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

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

def init_db():
    """
    Automatically initializes the database schema and seeds 5 government policies,
    5 public schemes, and demo accounts if the database is newly created.
    Safe and idempotent on cloud deployment (Render, Neon, Supabase, Docker).
    """
    import logging
    import time
    from sqlalchemy import text

    logger = logging.getLogger("database_init")

    for attempt in range(1, 6):
        try:
            with engine.connect() as conn:
                check_query = text(
                    "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users');"
                )
                users_table_exists = conn.execute(check_query).scalar()

                base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                schema_path = os.path.join(base_dir, "database_init", "schema.sql")
                sample_path = os.path.join(base_dir, "database_init", "sample_data.sql")

                raw_conn = engine.raw_connection()
                try:
                    cursor = raw_conn.cursor()
                    if not users_table_exists:
                        logger.info("Fresh database detected. Applying schema.sql...")
                        if os.path.exists(schema_path):
                            with open(schema_path, "r", encoding="utf-8") as f:
                                cursor.execute(f.read())
                            raw_conn.commit()
                            logger.info("Schema applied successfully.")

                    # Check if policies exist
                    policies_count = 0
                    try:
                        cursor.execute("SELECT COUNT(*) FROM policies;")
                        row = cursor.fetchone()
                        policies_count = row[0] if row else 0
                    except Exception:
                        policies_count = 0

                    if policies_count == 0 and os.path.exists(sample_path):
                        logger.info("Policies empty. Seeding 5 government policies and 5 schemes...")
                        with open(sample_path, "r", encoding="utf-8") as f:
                            cursor.execute(f.read())
                        raw_conn.commit()
                        logger.info("Policies, schemes, and demo users seeded successfully.")
                    else:
                        logger.info(f"Database ready with {policies_count} policies.")

                    cursor.close()
                finally:
                    raw_conn.close()
                break
        except Exception as e:
            logger.warning(f"Database init attempt {attempt}/5 failed ({e}). Retrying in 2s...")
            time.sleep(2)