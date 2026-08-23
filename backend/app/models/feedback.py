from sqlalchemy import Column, BigInteger, Integer, Text, TIMESTAMP
from sqlalchemy.sql import func

from app.models.user import Base


class Feedback(Base):
    __tablename__ = "feedback"

    feedback_id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, nullable=False)
    policy_id = Column(BigInteger, nullable=True)
    scheme_id = Column(BigInteger, nullable=True)
    rating = Column(Integer, nullable=True)
    comments = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())