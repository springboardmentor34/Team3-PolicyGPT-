from sqlalchemy import Column, BigInteger, ForeignKey, TIMESTAMP, UniqueConstraint
from sqlalchemy.sql import func

from app.models.user import Base


class SavedPolicy(Base):
    __tablename__ = "saved_policies"

    saved_id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id"), nullable=False)
    policy_id = Column(BigInteger, ForeignKey("policies.policy_id"), nullable=False)
    saved_at = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "policy_id", name="uq_saved_policy_per_user"),
    )