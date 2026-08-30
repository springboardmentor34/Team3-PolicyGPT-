from sqlalchemy import Column, BigInteger, String, Text, Boolean, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func

from app.models.user import Base


class Notification(Base):
    """A single in-app notification for one user. Replaces the original
    stub (an in-memory Python list with no database backing at all,
    despite a `notifications` table already existing in the schema).

    Rows are created internally by other routers when something actually
    happens (a policy gets approved/rejected, a scheme is created or
    updated, an application's status changes) — there's no public
    "create a notification for anyone" endpoint, since that would let
    any logged-in user spam any other user."""
    __tablename__ = "notifications"

    notification_id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    # e.g. 'Policy Approved', 'Policy Rejected', 'New Policy', 'New Scheme',
    # 'Scheme Updated', 'Application Status' — drives which icon/color the
    # frontend shows, and lets /notifications/me be filtered by category.
    notification_type = Column(String(50), nullable=False, default="General")
    # Optional link back to the thing this notification is about, so the
    # frontend can route straight to it (e.g. related_table='schemes',
    # related_id=42 -> /scheme-details/42). Both null for general/system
    # notifications with nothing to link to.
    related_table = Column(String(50), nullable=True)
    related_id = Column(BigInteger, nullable=True)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())