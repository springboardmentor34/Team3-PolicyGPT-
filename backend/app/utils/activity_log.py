from typing import Optional

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def log_activity(
    db: Session,
    user_id: Optional[int],
    action: str,
    table_name: Optional[str] = None,
    record_id: Optional[int] = None,
) -> None:
    """
    Best-effort usage logging for Milestone 3 Task 6 (Usage Statistics
    Dashboard). Deliberately swallows any error — a broken activity log
    should never be the reason a real user-facing request fails. Also a
    no-op for anonymous requests (user_id is None), since audit_logs.
    user_id is NOT NULL.
    """
    if user_id is None:
        return

    try:
        db.add(AuditLog(
            user_id=user_id,
            action=action,
            table_name=table_name,
            record_id=record_id,
        ))
        db.commit()
    except Exception:
        db.rollback()