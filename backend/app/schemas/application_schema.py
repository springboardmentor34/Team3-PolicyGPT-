from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict

from app.schemas.scheme_schema import SchemeOut


class ApplicationCreate(BaseModel):
    scheme_id: int


class ApplicationStatus(str, Enum):
    SUBMITTED = "Submitted"
    UNDER_REVIEW = "Under Review"
    APPROVED = "Approved"
    REJECTED = "Rejected"


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus


class ApplicationOut(BaseModel):
    application_id: int
    status: str
    applied_at: datetime
    updated_at: datetime
    scheme: SchemeOut

    model_config = ConfigDict(from_attributes=True)
