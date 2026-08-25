from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.utils.database import get_db
from app.auth.dependencies import require_roles
from app.models.user import User
from app.models.policy import Policy
from app.models.scheme import Scheme
from app.models.audit_log import AuditLog
from app.models.search_history import SearchHistory

router = APIRouter(
    prefix="/admin",
    tags=["Admin Dashboard"]
)

# Roles an admin is allowed to assign to another user. Matches the
# self-registration enum (citizen/official/researcher/organization) plus
# the elevated roles that can't be picked at registration (admin/
# administrator) — this is currently the only way to promote someone to
# Administrator at all, since the Register form has no option for it.
ASSIGNABLE_ROLES = {
    "citizen", "official", "researcher", "organization",
    "admin", "administrator", "government official",
}


class UpdateUserRoleRequest(BaseModel):
    role: str


@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "administrator"))
):
    """
    Real, live counts for the Admin Dashboard cards. Restricted to admins,
    same as the Policy Approvals workflow.
    """
    total_users = db.query(User).count()
    total_policies = db.query(Policy).count()
    total_schemes = db.query(Scheme).count()

    pending_policies = (
        db.query(Policy).filter(Policy.approval_status == "Pending").count()
    )
    approved_policies = (
        db.query(Policy).filter(Policy.approval_status == "Approved").count()
    )
    rejected_policies = (
        db.query(Policy).filter(Policy.approval_status == "Rejected").count()
    )

    role_counts = db.query(User.role, func.count(User.user_id)).group_by(User.role).all()
    users_by_role = {role or "unknown": count for role, count in role_counts}

    return {
        "total_users": total_users,
        "total_policies": total_policies,
        "total_schemes": total_schemes,
        "pending_policies": pending_policies,
        "approved_policies": approved_policies,
        "rejected_policies": rejected_policies,
        "users_by_role": users_by_role,
    }


@router.get("/users")
def list_users(
    role: Optional[str] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "administrator")),
):
    """
    User Management (Admin Dashboard). Lists every registered account so
    an admin can review roles and active status, change a user's role, or
    deactivate/reactivate an account. No endpoint existed for this before
    — the dashboard only ever showed an aggregate role count.
    """
    query = db.query(User)

    if role:
        query = query.filter(func.lower(User.role) == role.strip().lower())

    if q:
        like = f"%{q.strip()}%"
        query = query.filter(
            (User.full_name.ilike(like)) | (User.email.ilike(like))
        )

    users = query.order_by(User.user_id).all()

    return {
        "data": [
            {
                "user_id": u.user_id,
                "full_name": u.full_name,
                "email": u.email,
                "role": u.role,
                "is_active": u.is_active,
                "mobile": u.mobile,
                "state": u.state,
                "created_at": u.created_at,
            }
            for u in users
        ]
    }


@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    payload: UpdateUserRoleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "administrator")),
):
    new_role = payload.role.strip()
    if new_role.lower() not in ASSIGNABLE_ROLES:
        raise HTTPException(
            status_code=400,
            detail=f"'{new_role}' is not a recognized role.",
        )

    target = db.query(User).filter(User.user_id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    target.role = new_role
    db.commit()
    db.refresh(target)

    return {
        "message": "Role updated successfully",
        "user_id": target.user_id,
        "role": target.role,
    }


@router.patch("/users/{user_id}/deactivate")
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "administrator")),
):
    # Prevents an admin from locking themselves out — there's no recovery
    # path for that short of a direct DB edit.
    if user_id == current_user.user_id:
        raise HTTPException(
            status_code=400,
            detail="You cannot deactivate your own account.",
        )

    target = db.query(User).filter(User.user_id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    target.is_active = False
    db.commit()

    return {"message": "User deactivated", "user_id": target.user_id, "is_active": False}


@router.patch("/users/{user_id}/activate")
def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "administrator")),
):
    target = db.query(User).filter(User.user_id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    target.is_active = True
    db.commit()

    return {"message": "User activated", "user_id": target.user_id, "is_active": True}

@router.get("/usage-stats")
def get_usage_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "administrator", "official")),
):
    """
    Milestone 3, Task 6: Usage Statistics Dashboard.

    Genuinely different from /admin/stats and /analytics/overview —
    those describe what's IN the platform (how many policies exist, by
    category, etc). This describes how people are actually USING the
    platform: who's active, what they're searching for, what they're
    viewing, and how many eligibility checks are being run.

    Honest limitation: activity is only recorded for logged-in users
    (audit_logs.user_id is NOT NULL by design), so anonymous browsing
    isn't reflected here. That's a real, known gap, not an oversight.
    """
    from datetime import datetime, timedelta, timezone

    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)

    total_users = db.query(User).count()

    active_users_7d = (
        db.query(func.count(func.distinct(AuditLog.user_id)))
        .filter(AuditLog.created_at >= seven_days_ago)
        .scalar()
    ) or 0

    total_eligibility_checks = (
        db.query(AuditLog)
        .filter(AuditLog.action == "eligibility_check")
        .count()
    )

    most_viewed_policies_raw = (
        db.query(AuditLog.record_id, func.count(AuditLog.log_id).label("views"))
        .filter(AuditLog.action == "view_policy")
        .group_by(AuditLog.record_id)
        .order_by(func.count(AuditLog.log_id).desc())
        .limit(5)
        .all()
    )
    most_viewed_policies = []
    for policy_id, views in most_viewed_policies_raw:
        policy = db.query(Policy).filter(Policy.policy_id == policy_id).first()
        most_viewed_policies.append({
            "policy_id": policy_id,
            "name": policy.policy_name if policy else "Unknown Policy",
            "views": views,
        })

    most_viewed_schemes_raw = (
        db.query(AuditLog.record_id, func.count(AuditLog.log_id).label("views"))
        .filter(AuditLog.action == "view_scheme")
        .group_by(AuditLog.record_id)
        .order_by(func.count(AuditLog.log_id).desc())
        .limit(5)
        .all()
    )
    most_viewed_schemes = []
    for scheme_id, views in most_viewed_schemes_raw:
        scheme = db.query(Scheme).filter(Scheme.scheme_id == scheme_id).first()
        most_viewed_schemes.append({
            "scheme_id": scheme_id,
            "name": scheme.scheme_name if scheme else "Unknown Scheme",
            "views": views,
        })

    most_searched_terms_raw = (
        db.query(SearchHistory.search_keyword, func.count(SearchHistory.search_id).label("count"))
        .group_by(SearchHistory.search_keyword)
        .order_by(func.count(SearchHistory.search_id).desc())
        .limit(10)
        .all()
    )
    most_searched_terms = [
        {"term": term, "count": count} for term, count in most_searched_terms_raw
    ]

    return {
        "total_users": total_users,
        "active_users_7d": active_users_7d,
        "total_eligibility_checks": total_eligibility_checks,
        "most_viewed_policies": most_viewed_policies,
        "most_viewed_schemes": most_viewed_schemes,
        "most_searched_terms": most_searched_terms,
    }