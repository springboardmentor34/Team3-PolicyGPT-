from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class FeedbackCreate(BaseModel):
    # user_id is deliberately NOT here — it's derived from the
    # authenticated session server-side (see feedback.py), same fix
    # applied to Policy/Scheme uploaded_by_user_id earlier. Trusting a
    # client-supplied user_id would let anyone submit feedback under
    # someone else's name.
    policy_id: Optional[int] = None
    scheme_id: Optional[int] = None
    rating: int = Field(..., ge=1, le=5)
    comments: Optional[str] = None


class FeedbackOut(BaseModel):
    feedback_id: int
    user_id: int
    policy_id: Optional[int] = None
    scheme_id: Optional[int] = None
    rating: Optional[int] = None
    comments: Optional[str] = None
    created_at: Optional[datetime] = None
    # Populated by the router (admin-only listing), not stored on the
    # model itself — same "who actually did this" pattern used for
    # Policy Approvals' submitted_by_name.
    submitted_by_name: Optional[str] = None

    class Config:
        from_attributes = True