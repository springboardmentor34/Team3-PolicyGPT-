from fastapi import APIRouter
from backend.app.schemas.notification_schema import Notification

router = APIRouter(
    prefix="/notifications",
    tags=["Notification Management"]
)

notifications = []


@router.get("/")
def get_notifications():
    return {
        "message": "List of all notifications",
        "data": notifications
    }


@router.post("/")
def create_notification(notification: Notification):
    notifications.append(notification)
    return {
        "message": "Notification created successfully",
        "notification": notification
    }