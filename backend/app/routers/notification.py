from typing import Optional
from app.services.notification_service import create_deadline_reminders
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.utils.database import get_db
from app.models.notification import Notification as NotificationModel
from app.models.user import User
from app.schemas.notification_schema import (
    NotificationCreate,
    NotificationUpdate,
    NotificationOut
)
from app.auth.dependencies import get_current_user


router = APIRouter(
    prefix="/notifications",
    tags=["Notification Management"]
)


# Get current user's notifications
@router.get("/", response_model=list[NotificationOut])
def get_notifications(
    is_read: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(NotificationModel).filter(
        NotificationModel.user_id == current_user.user_id
    )

    if is_read is not None:
        query = query.filter(NotificationModel.is_read == is_read)

    return query.order_by(
        NotificationModel.created_at.desc()
    ).all()

@router.post("/deadline-reminders")
def generate_deadline_reminders(
    days: int = 7,
    db: Session = Depends(get_db),
):
    notifications = create_deadline_reminders(
        db=db,
        days=days,
    )

    return {
        "message": "Deadline reminders generated successfully",
        "count": len(notifications),
    }

# Get one notification belonging to current user
@router.get("/{notification_id}", response_model=NotificationOut)
def get_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notification = (
        db.query(NotificationModel)
        .filter(
            NotificationModel.notification_id == notification_id,
            NotificationModel.user_id == current_user.user_id
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    return notification


# Create notification
@router.post(
    "/",
    response_model=NotificationOut,
    status_code=201
)
def create_notification(
    notification: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Normal users can only create notifications for themselves.
    # Admins can create notifications for another user.
    target_user_id = notification.user_id

    if (
        target_user_id != current_user.user_id
        and (current_user.role or "").lower() != "admin"
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only create notifications for yourself"
        )

    new_notification = NotificationModel(
        user_id=target_user_id,
        title=notification.title,
        message=notification.message,
        notification_type=notification.notification_type
    )

    db.add(new_notification)
    db.commit()
    db.refresh(new_notification)

    return new_notification


# Mark notification as read/unread
@router.patch(
    "/{notification_id}",
    response_model=NotificationOut
)
def update_notification(
    notification_id: int,
    notification_update: NotificationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notification = (
        db.query(NotificationModel)
        .filter(
            NotificationModel.notification_id == notification_id,
            NotificationModel.user_id == current_user.user_id
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    update_data = notification_update.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(notification, field, value)

    db.commit()
    db.refresh(notification)

    return notification


# Mark notification as read
@router.patch(
    "/{notification_id}/read",
    response_model=NotificationOut
)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notification = (
        db.query(NotificationModel)
        .filter(
            NotificationModel.notification_id == notification_id,
            NotificationModel.user_id == current_user.user_id
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return notification


# Delete notification
@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notification = (
        db.query(NotificationModel)
        .filter(
            NotificationModel.notification_id == notification_id,
            NotificationModel.user_id == current_user.user_id
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    db.delete(notification)
    db.commit()

    return {
        "message": "Notification deleted successfully"
    }