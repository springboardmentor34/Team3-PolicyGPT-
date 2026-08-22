from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.policy_schema import PolicyOut


class SavedPolicyCreate(BaseModel):
    policy_id: int


class SavedPolicyOut(BaseModel):
    saved_id: int
    saved_at: datetime
    policy: PolicyOut

    model_config = ConfigDict(from_attributes=True)