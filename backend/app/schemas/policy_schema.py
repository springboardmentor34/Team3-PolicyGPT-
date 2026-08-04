from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class PolicyCreate(BaseModel):
    policy_name: str
    description: Optional[str] = None
    category: Optional[str] = None
    ministry: Optional[str] = None
    department: Optional[str] = None
    government_level: Optional[str] = None
    state: Optional[str] = None
    status: Optional[str] = None
    publication_date: Optional[date] = None
    effective_date: Optional[date] = None
    document_url: Optional[str] = None
    uploaded_by_user_id: int


class PolicyOut(PolicyCreate):
    policy_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)