from sqlalchemy import Column, BigInteger, String, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func

from app.models.user import Base


class AuditLog(Base):
    """
    Backs Milestone 3 Task 6 (Usage Statistics Dashboard). Reuses the
    audit_logs table that already existed in the schema, unused, rather
    than adding yet another new table — same pattern as several other
    features built this session (saved_policies, applications,
    user_notifications all pre-existed unused too).

    Only logs actions for logged-in users, since user_id is NOT NULL on
    this table — anonymous browsing/searching is not tracked here.
    """

    __tablename__ = "audit_logs"

    log_id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id"), nullable=False)
    action = Column(String(100))
    table_name = Column(String(100))
    record_id = Column(BigInteger)
    ip_address = Column(String(50))
    created_at = Column(TIMESTAMP, server_default=func.now())