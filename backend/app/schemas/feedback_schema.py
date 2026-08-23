from pydantic import BaseModel, Field
from typing import Optional


class FeedbackCreate(BaseModel):
    user_id: int
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

    class Config:
        from_attributes = True