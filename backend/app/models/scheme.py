from sqlalchemy import Column, BigInteger, String, Text, Date, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func

from app.models.user import Base


class Scheme(Base):
    __tablename__ = "schemes"

    scheme_id = Column(BigInteger, primary_key=True, index=True)
    scheme_name = Column(String(200), nullable=False)
    description = Column(Text)
    category = Column(String(100))
    department = Column(String(100))
    government_level = Column(String(20))
    state = Column(String(100))
    benefits = Column(Text)

    eligibility = Column(Text)
    income_limit = Column(Text)
    processing_time = Column(Text)

    application_process = Column(Text)
    required_documents = Column(Text)

    official_website = Column(Text)
    start_date = Column(Date)
    end_date = Column(Date)
    status = Column(String(20))

    uploaded_by_user_id = Column(
        BigInteger,
        ForeignKey("users.user_id"),
        nullable=False
    )

    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.now(),
        onupdate=func.now()
    )