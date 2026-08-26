from sqlalchemy.orm import Session
from app.services.sms_service import send_sms
from app.models.notification import Notification
from app.models.user import User
from app.services.email_service import send_email
from datetime import date, timedelta

from app.models.scheme import Scheme


def create_in_app_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str = "general",
):
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
    )

    db.add(notification)
    db.flush()

    # Email notification
    user = db.query(User).filter(User.user_id == user_id).first()

    if user and user.is_active:
        if user.email:
            send_email(
                recipient=user.email,
                subject=title,
                message=message,
            )

        # SMS notification
        if user.mobile:
            send_sms(
                recipient=user.mobile,
                message=message,
            )

    return notification


def notify_users_by_role(
    db: Session,
    role: str,
    title: str,
    message: str,
    notification_type: str = "general",
):
    users = (
        db.query(User)
        .filter(
            User.role.ilike(role),
            User.is_active.is_(True),
        )
        .all()
    )

    notifications = []

    for user in users:
        notification = create_in_app_notification(
            db=db,
            user_id=user.user_id,
            title=title,
            message=message,
            notification_type=notification_type,
        )
        notifications.append(notification)

    return notifications

def create_deadline_reminders(
    db: Session,
    days: int = 7,
):
    today = date.today()
    deadline = today + timedelta(days=days)

    schemes = (
        db.query(Scheme)
        .filter(Scheme.end_date.isnot(None))
        .filter(Scheme.end_date >= today)
        .filter(Scheme.end_date <= deadline)
        .filter(Scheme.status != "Archived")
        .all()
    )

    notifications = []

    for scheme in schemes:
        notification = create_in_app_notification(
            db=db,
            user_id=scheme.uploaded_by_user_id,
            title="Upcoming Scheme Deadline",
            message=(
                f"The deadline for '{scheme.scheme_name}' "
                f"is {scheme.end_date.isoformat()}."
            ),
            notification_type="deadline_reminder",
        )
        notifications.append(notification)

    db.commit()

    return notifications