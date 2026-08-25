from sqlalchemy import Column, BigInteger, String, Boolean, Date, DECIMAL, TIMESTAMP
from sqlalchemy.orm import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    user_id = Column(BigInteger, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False)
    mobile = Column(String(15))
    date_of_birth = Column(Date)
    gender = Column(String(10))
    occupation = Column(String(100))
    education = Column(String(100))
    income = Column(DECIMAL(12, 2))
    state = Column(String(100))
    district = Column(String(100))
    social_category = Column(String(30))
    disability_status = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())