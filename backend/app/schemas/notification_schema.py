from pydantic import BaseModel


class Notification(BaseModel):
    title: str
    message: str
    recipient: str
    notification_type: str
    status: str