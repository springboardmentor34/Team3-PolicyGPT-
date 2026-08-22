from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.audit_log import AuditLog
from app.models.search_history import SearchHistory
from app.models.policy import Policy
from app.models.scheme import Scheme


def most_viewed_policies(db: Session, limit: int = 5) -> list:
    """
    Content-popularity data, not user-account data — deliberately shared
    between the admin-only /admin/usage-stats and the official-accessible
    /analytics/content-usage. "Which policies are people reading" is core
    Scheme/Policy Usage Analytics (Milestone 3, task vi) and the project
    spec explicitly lists Usage Analytics under the Government Dashboard,
    not just Admin's — unlike raw user/account counts, which stay
    admin-only in admin.py.
    """
    rows = (
        db.query(AuditLog.record_id, func.count(AuditLog.log_id).label("views"))
        .filter(AuditLog.action == "view_policy")
        .group_by(AuditLog.record_id)
        .order_by(func.count(AuditLog.log_id).desc())
        .limit(limit)
        .all()
    )

    results = []
    for policy_id, views in rows:
        policy = db.query(Policy).filter(Policy.policy_id == policy_id).first()
        results.append({
            "policy_id": policy_id,
            "name": policy.policy_name if policy else "Unknown Policy",
            "views": views,
        })
    return results


def most_viewed_schemes(db: Session, limit: int = 5) -> list:
    rows = (
        db.query(AuditLog.record_id, func.count(AuditLog.log_id).label("views"))
        .filter(AuditLog.action == "view_scheme")
        .group_by(AuditLog.record_id)
        .order_by(func.count(AuditLog.log_id).desc())
        .limit(limit)
        .all()
    )

    results = []
    for scheme_id, views in rows:
        scheme = db.query(Scheme).filter(Scheme.scheme_id == scheme_id).first()
        results.append({
            "scheme_id": scheme_id,
            "name": scheme.scheme_name if scheme else "Unknown Scheme",
            "views": views,
        })
    return results


def most_searched_terms(db: Session, limit: int = 10) -> list:
    rows = (
        db.query(SearchHistory.search_keyword, func.count(SearchHistory.search_id).label("count"))
        .group_by(SearchHistory.search_keyword)
        .order_by(func.count(SearchHistory.search_id).desc())
        .limit(limit)
        .all()
    )
    return [{"term": term, "count": count} for term, count in rows]