from sqlalchemy import Column, BigInteger, Integer, String, Numeric, Boolean, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func

from app.models.user import Base


class EligibilityRule(Base):
    __tablename__ = "eligibility_rules"

    rule_id = Column(BigInteger, primary_key=True, index=True)
    scheme_id = Column(BigInteger, ForeignKey("schemes.scheme_id"), nullable=False)
    minimum_age = Column(Integer)
    maximum_age = Column(Integer)
    gender = Column(String(20))
    maximum_income = Column(Numeric(12, 2))
    occupation = Column(String(100))
    education = Column(String(100))
    state = Column(String(100))
    district = Column(String(100))
    social_category = Column(String(30))
    disability_status = Column(Boolean)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())