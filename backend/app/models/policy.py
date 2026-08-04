from sqlalchemy import Column, BigInteger, String, Text, Date, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func

from app.models.user import Base


class Policy(Base):
    __tablename__ = "policies"

    policy_id = Column(BigInteger, primary_key=True, index=True)
    policy_name = Column(String(200), nullable=False)
    description = Column(Text)
    category = Column(String(100))
    ministry = Column(String(100))
    department = Column(String(100))
    government_level = Column(String(20))
    state = Column(String(100))
    status = Column(String(20))
    publication_date = Column(Date)
    effective_date = Column(Date)
    document_url = Column(Text)
    uploaded_by_user_id = Column(BigInteger, ForeignKey("users.user_id"), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())