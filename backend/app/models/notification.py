from sqlalchemy import Column, BigInteger, String, Text, Boolean, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func

from app.models.user import Base


class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(30))
    is_read = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())