from sqlalchemy import Column, BigInteger, String, ForeignKey, TIMESTAMP, UniqueConstraint
from sqlalchemy.sql import func

from app.models.user import Base


class Application(Base):
    """A citizen's application to a scheme — backs the Citizen Dashboard's
    'Applications' card and /applications page. One row per (user, scheme)
    pair; status is then tracked/updated on that same row over time rather
    than by re-applying, so 'Application Status' can actually change
    (Submitted -> Under Review -> Approved/Rejected) instead of being a
    value set once and never revisited."""
    __tablename__ = "applications"

    application_id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id"), nullable=False)
    scheme_id = Column(BigInteger, ForeignKey("schemes.scheme_id"), nullable=False)
    status = Column(String(30), nullable=False, server_default="Submitted")
    applied_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "scheme_id", name="uq_application_per_user_scheme"),
    )
