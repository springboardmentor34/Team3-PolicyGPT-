from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class SchemeCreate(BaseModel):
    scheme_name: str
    description: Optional[str] = None
    category: Optional[str] = None
    department: Optional[str] = None
    government_level: Optional[str] = None
    state: Optional[str] = None
    benefits: Optional[str] = None
    application_process: Optional[str] = None
    required_documents: Optional[str] = None
    official_website: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    uploaded_by_user_id: int


class SchemeOut(SchemeCreate):
    scheme_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)