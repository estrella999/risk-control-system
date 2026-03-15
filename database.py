import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# On Vercel, the filesystem is read-only except /tmp
if os.environ.get("VERCEL"):
    _db_path = "/tmp/risk_control.db"
else:
    _db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "risk_control.db")

SQLALCHEMY_DATABASE_URL = f"sqlite:///{_db_path}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
