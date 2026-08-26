from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class NotificationCreate(BaseModel):
    user_id: int
    title: str
    message: str
    notification_type: Optional[str] = "general"


class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None


class NotificationOut(BaseModel):
    notification_id: int
    user_id: int
    title: str
    message: str
    notification_type: Optional[str] = None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)