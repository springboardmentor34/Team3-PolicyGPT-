from datetime import date, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict


class PolicyCategory(str, Enum):
    EDUCATION = "Education"
    HEALTHCARE = "Healthcare"
    AGRICULTURE = "Agriculture"
    EMPLOYMENT = "Employment"
    FINANCE = "Finance"
    WOMEN_CHILD_WELFARE = "Women & Child Welfare"
    HOUSING = "Housing"
    ENVIRONMENT = "Environment"
    DIGITAL_GOVERNANCE = "Digital Governance"
    INFRASTRUCTURE = "Infrastructure"


class PolicyCreate(BaseModel):
    policy_name: str
    description: Optional[str] = None
    category: Optional[PolicyCategory] = None
    ministry: Optional[str] = None
    department: Optional[str] = None
    government_level: Optional[str] = None
    state: Optional[str] = None
    status: Optional[str] = None
    publication_date: Optional[date] = None
    effective_date: Optional[date] = None
    document_url: Optional[str] = None
    uploaded_by_user_id: int

    model_config = ConfigDict(use_enum_values=True)


class PolicyUpdate(BaseModel):
    policy_name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[PolicyCategory] = None
    ministry: Optional[str] = None
    department: Optional[str] = None
    government_level: Optional[str] = None
    state: Optional[str] = None
    status: Optional[str] = None
    publication_date: Optional[date] = None
    effective_date: Optional[date] = None
    document_url: Optional[str] = None

    model_config = ConfigDict(use_enum_values=True)


class PolicyOut(PolicyCreate):
    policy_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)