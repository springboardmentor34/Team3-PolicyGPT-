from typing import Optional
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User

_CITIZEN_ROLES = {"citizen"}


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str = "General",
    related_table: Optional[str] = None,
    related_id: Optional[int] = None,
) -> Notification:
    """
    Single source of truth for creating a notification. Deliberately not
    exposed as a public POST endpoint — every call site here is an
    internal router (policy approval/rejection, scheme create/update,
    application status change) reacting to something that actually just
    happened, not a client claiming "notify user X of Y."
    """
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        related_table=related_table,
        related_id=related_id,
    )
    db.add(notification)
    db.commit()
    return notification


def broadcast_to_citizens(
    db: Session,
    title: str,
    message: str,
    notification_type: str = "General",
    related_table: Optional[str] = None,
    related_id: Optional[int] = None,
) -> int:
    """
    'New Policy Alerts' / 'New Scheme' announcements (Module 7) — there's
    no per-citizen subscription/interest model in this app (no way to
    know which categories or states a given citizen cares about), so a
    platform-wide announcement to every citizen is the honest, achievable
    version of this feature rather than a fabricated personalization.

    Returns the number of citizens notified, mainly for logging/testing.
    """
    citizen_ids = [
        u.user_id for u in
        db.query(User.user_id).filter(User.role.ilike("citizen")).all()
    ]

    for user_id in citizen_ids:
        db.add(Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            related_table=related_table,
            related_id=related_id,
        ))

    if citizen_ids:
        db.commit()

    return len(citizen_ids)


def broadcast_to_admins(
    db: Session,
    title: str,
    message: str,
    notification_type: str = "General",
    related_table: Optional[str] = None,
    related_id: Optional[int] = None,
) -> int:
    """
    Tells every Admin account when something needs their attention — the
    concrete first use is create_policy() calling this so Admins actually
    know a new policy is sitting in the approval queue, instead of only
    finding out by remembering to check Policy Approvals themselves.

    Broadcast to every Admin (not just one) for the same reason
    broadcast_to_citizens() goes to every citizen: with more than one
    Admin account, there's no reliable way to know which specific admin
    should be the one notified, so all of them get it and whoever acts
    on it first, does.
    """
    admin_ids = [
        u.user_id for u in
        db.query(User.user_id).filter(User.role.ilike("admin") | User.role.ilike("administrator")).all()
    ]

    for user_id in admin_ids:
        db.add(Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            related_table=related_table,
            related_id=related_id,
        ))

    if admin_ids:
        db.commit()

    return len(admin_ids)