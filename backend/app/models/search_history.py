from sqlalchemy import Column, BigInteger, String, TIMESTAMP
from sqlalchemy.sql import func

from app.models.user import Base


class SearchHistory(Base):
    __tablename__ = "search_history"

    search_id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, nullable=False)
    search_keyword = Column(String(255), nullable=False)
    searched_at = Column(TIMESTAMP, server_default=func.now())