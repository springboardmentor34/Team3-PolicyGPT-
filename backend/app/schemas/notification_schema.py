from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class NotificationOut(BaseModel):
    notification_id: int
    title: str
    message: str
    notification_type: str
    related_table: Optional[str] = None
    related_id: Optional[int] = None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DeadlineReminderOut(BaseModel):
    """Not a stored Notification row — computed on demand each call from
    schemes whose end_date is coming up soon. See notification.py's
    get_deadline_reminders() docstring for why this isn't a background
    job."""
    scheme_id: int
    scheme_name: str
    category: Optional[str] = None
    end_date: Optional[str] = None
    days_remaining: int