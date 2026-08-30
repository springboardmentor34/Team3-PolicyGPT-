from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.utils.database import get_db
from app.models.notification import Notification
from app.models.scheme import Scheme
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.schemas.notification_schema import NotificationOut, DeadlineReminderOut

router = APIRouter(
    prefix="/notifications",
    tags=["Notification Management"]
)

notifications = []

@router.get("/me")
def get_my_notifications(
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Every notification for the logged-in user, most recent first —
    replaces the original in-memory stub that returned the same global
    list to everyone regardless of who was logged in."""
    query = db.query(Notification).filter(Notification.user_id == current_user.user_id)
    if unread_only:
        query = query.filter(Notification.is_read.is_(False))

    rows = query.order_by(Notification.created_at.desc()).all()
    unread_count = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.user_id, Notification.is_read.is_(False))
        .count()
    )

@router.get("/")
def get_notifications():
    return {
        "message": "Your notifications",
        "count": len(rows),
        "unread_count": unread_count,
        "data": [NotificationOut.model_validate(n) for n in rows]
    }


@router.patch("/{notification_id}/read", response_model=NotificationOut)
def mark_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notification = db.query(Notification).filter(Notification.notification_id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    if notification.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="This notification does not belong to you")

    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


@router.patch("/read-all")
def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    updated = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.user_id, Notification.is_read.is_(False))
        .update({"is_read": True})
    )
    db.commit()
    return {"message": f"{updated} notification(s) marked as read"}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notification = db.query(Notification).filter(Notification.notification_id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    if notification.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="This notification does not belong to you")

    db.delete(notification)
    db.commit()
    return {"message": "Notification deleted"}


@router.get("/deadline-reminders", response_model=list[DeadlineReminderOut])
def get_deadline_reminders(
    days: int = 7,
    db: Session = Depends(get_db)
):
    """
    'Deadline Reminders' (Module 7), computed on demand rather than
    stored — there's no scheduler/cron running in this plain FastAPI
    request-response app (that would need Celery or similar background
    job infrastructure, which isn't part of this stack), so instead of a
    push notification that fires automatically at some point in the
    past, this recomputes "what's closing soon" fresh every time it's
    called, e.g. when the Notifications page loads.

    Deliberately platform-wide (any live scheme closing soon), not
    filtered to one citizen's eligibility — see broadcast_to_citizens()
    in utils/notify.py for the same reasoning on personalization.
    """
    today = date.today()
    cutoff = today + timedelta(days=days)

    schemes = (
        db.query(Scheme)
        .filter(Scheme.status == "Active")
        .filter(Scheme.end_date.isnot(None))
        .filter(Scheme.end_date >= today)
        .filter(Scheme.end_date <= cutoff)
        .order_by(Scheme.end_date.asc())
        .all()
    )

    return [
        DeadlineReminderOut(
            scheme_id=s.scheme_id,
            scheme_name=s.scheme_name,
            category=s.category,
            end_date=s.end_date.isoformat() if s.end_date else None,
            days_remaining=(s.end_date - today).days,
        )
        for s in schemes
    ]
