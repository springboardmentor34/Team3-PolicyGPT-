from datetime import date, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ApprovalStatus(str, Enum):
    """Moderation state for a policy. Separate from the lifecycle `status`
    field (Draft/Active/Archived) — this tracks the approval decision."""
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"


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

    # ---- Policy Approval Workflow (Task 4) -----------------------------
    approval_status: ApprovalStatus
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    rejected_by: Optional[int] = None
    rejected_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True, use_enum_values=True)


class PolicyRejectRequest(BaseModel):
    """Body for PATCH /policies/{id}/reject — a reason is mandatory."""
    reason: str = Field(..., min_length=1, max_length=1000)