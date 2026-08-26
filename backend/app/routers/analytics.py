from typing import Dict, List, Optional
from collections import OrderedDict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.utils.database import get_db
from app.auth.dependencies import require_roles
from app.models.user import User
from app.models.policy import Policy
from app.models.scheme import Scheme
from app.utils.usage_stats import most_viewed_policies, most_viewed_schemes, most_searched_terms
router = APIRouter(
    prefix="/analytics",
    tags=["Analytics Dashboard"]
)
# Accepts both the role value new registrations get ("official", from the
# UserRole enum in auth_schema.py) and the legacy wording used in seed data
# ("Government Official"), plus admin roles — require_roles() compares
# case-insensitively already.
_ANALYTICS_ROLES = ("admin", "administrator", "official", "government official", "government")
def _scope_owner_id(current_user: User) -> Optional[int]:
    """
    Derives analytics scope from the caller's OWN role — never from a
    client-supplied flag. An Official is always scoped to their own
    submissions; an Admin always gets the unscoped, system-wide view.
    This used to be a `mine_only: bool` query parameter the client set,
    which meant an Official calling this endpoint directly (dev tools,
    Postman, or just a future frontend bug) with the param omitted or
    set to false would see every other official's submission counts,
    approval history, and usage stats — contradicting the ownership
    model this app enforces everywhere else (an official can only ever
    see/manage their own policies and schemes). Deriving scope from the
    JWT-verified role instead means there's no request shape that can
    bypass it.
    """
    role = (current_user.role or "").strip().lower()
    if role in ("admin", "administrator"):
        return None
    return current_user.user_id
def _counts_by(query, column) -> Dict[str, int]:
    """Group-by count helper, e.g. policies by category or department."""
    rows = query.with_entities(column, func.count()).group_by(column).all()
    return {(value or "Uncategorized"): count for value, count in rows}
def _approval_trend(db: Session, owner_user_id: int = None) -> List[dict]:
    """
    'Approval rates over time' — every policy bucketed by the month it
    was SUBMITTED (created_at), split into how many of that month's
    submissions ended up Approved / Pending / Rejected. Built in Python
    rather than a Postgres-specific date_trunc query, since the small
    dataset here makes that simpler to read and test than SQL-side
    date bucketing.
    owner_user_id scopes this to one official's own submission history —
    used by the Government Dashboard so an official only ever sees their
    own approval trend, never a system-wide one revealing other
    officials' activity.
    """
    query = db.query(Policy.created_at, Policy.approval_status).filter(Policy.created_at.isnot(None))
    if owner_user_id is not None:
        query = query.filter(Policy.uploaded_by_user_id == owner_user_id)
    rows = query.all()
    buckets: "OrderedDict[str, dict]" = OrderedDict()
    for created_at, approval_status in sorted(rows, key=lambda r: r[0]):
        month_key = created_at.strftime("%Y-%m")
        if month_key not in buckets:
            buckets[month_key] = {
                "month": month_key,
                "total": 0,
                "approved": 0,
                "pending": 0,
                "rejected": 0,
            }
        buckets[month_key]["total"] += 1
        status = (approval_status or "Pending").lower()
        if status == "approved":
            buckets[month_key]["approved"] += 1
        elif status == "rejected":
            buckets[month_key]["rejected"] += 1
        else:
            buckets[month_key]["pending"] += 1
    return list(buckets.values())
def _scheme_usage_trend(db: Session, owner_user_id: int = None) -> List[dict]:
    """
    Scheme Usage Statistics over time (Milestone 3, task vi) — how many
    schemes were published each month, split by status at query time
    (Active/Draft/Pending/Archived). There's no application/click
    tracking table in this schema, so "usage" here means publication
    volume and how much of what's been published is actually live for
    citizens to use — not per-scheme applicant counts, which aren't
    tracked anywhere yet.
    owner_user_id scopes this to one official's own schemes, same
    reasoning as _approval_trend above.
    """
    query = db.query(Scheme.created_at, Scheme.status).filter(Scheme.created_at.isnot(None))
    if owner_user_id is not None:
        query = query.filter(Scheme.uploaded_by_user_id == owner_user_id)
    rows = query.all()
    buckets: "OrderedDict[str, dict]" = OrderedDict()
    for created_at, status in sorted(rows, key=lambda r: r[0]):
        month_key = created_at.strftime("%Y-%m")
        if month_key not in buckets:
            buckets[month_key] = {
                "month": month_key,
                "total": 0,
                "active": 0,
                "draft": 0,
                "pending": 0,
                "archived": 0,
            }
        buckets[month_key]["total"] += 1
        status_key = (status or "Draft").lower()
        if status_key in ("active", "draft", "pending", "archived"):
            buckets[month_key][status_key] += 1
    return list(buckets.values())
@router.get("/overview")
def get_analytics_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ANALYTICS_ROLES)),
):
    """
    Live Policy Statistics + Scheme Usage Analytics (Milestone 3,
    'Develop Analytics Dashboard').
    Scope is derived from the caller's own role via _scope_owner_id(),
    not a client-supplied flag: an Official (Government Dashboard) always
    sees only policies/schemes THEY personally submitted — never another
    official's activity. Admin (Admin Dashboard) always gets the
    unscoped, system-wide picture, matching the ownership model used
    everywhere else (Admin reviews/approves and can archive anyone's
    work, but doesn't get to rewrite it or masquerade as its author).
    """
    owner_user_id = _scope_owner_id(current_user)
    mine_only = owner_user_id is not None
    live_policies = db.query(Policy).filter(Policy.status != "Archived")
    live_schemes = db.query(Scheme).filter(Scheme.status != "Archived")
    all_policies = db.query(Policy)
    all_schemes = db.query(Scheme)
    if mine_only:
        live_policies = live_policies.filter(Policy.uploaded_by_user_id == owner_user_id)
        live_schemes = live_schemes.filter(Scheme.uploaded_by_user_id == owner_user_id)
        all_policies = all_policies.filter(Policy.uploaded_by_user_id == owner_user_id)
        all_schemes = all_schemes.filter(Scheme.uploaded_by_user_id == owner_user_id)
    total_policies = live_policies.count()
    total_schemes = live_schemes.count()
    return {
        # Lets the frontend label things correctly ("My Policies" vs
        # "All Policies") without re-deriving the role itself.
        "scope": "mine" if mine_only else "all",
        "total_policies": total_policies,
        "total_schemes": total_schemes,
        # Category/department breakdowns describe the same "live" (not
        # archived) set as total_policies/total_schemes above, so these
        # bars always sum to the total card instead of silently including
        # archived rows the total excludes.
        "policies_by_category": _counts_by(live_policies, Policy.category),
        "policies_by_department": _counts_by(live_policies, Policy.department),
        "policies_by_state": _counts_by(live_policies, Policy.state),
        "schemes_by_category": _counts_by(live_schemes, Scheme.category),
        "schemes_by_department": _counts_by(live_schemes, Scheme.department),
        "schemes_by_state": _counts_by(live_schemes, Scheme.state),
        # These two intentionally cover ALL rows (including Archived) since
        # showing every status/approval bucket — Archived included — is the
        # whole point of a status/approval breakdown.
        "policies_by_status": _counts_by(all_policies, Policy.status),
        "policies_by_approval": _counts_by(all_policies, Policy.approval_status),
        "schemes_by_status": _counts_by(all_schemes, Scheme.status),
        # "Approval rates over time" — the one genuinely time-based chart,
        # distinct from every other breakdown above which are all
        # point-in-time snapshots.
        "policy_approval_trend": _approval_trend(db, owner_user_id=owner_user_id),
        # Usage Statistics Dashboard (Milestone 3, task vi) — scheme
        # publication volume + live-vs-not split over time.
        "scheme_usage_trend": _scheme_usage_trend(db, owner_user_id=owner_user_id),
    }
@router.get("/content-usage")
def get_content_usage(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ANALYTICS_ROLES)),
):
    """
    Usage Statistics Dashboard (Milestone 3, task vi) — the content-
    popularity half of it, shared with Officials, unlike /admin/usage-
    stats' account-activity data (active users, total users), which stays
    admin-only.
    Scope is derived from the caller's own role, same as /overview above.
    An Official's Most Viewed Policies/Schemes are scoped to their own
    content only. Most Searched Terms is deliberately omitted for
    Officials — search terms aren't attached to any policy/scheme's
    creator, so there's no honest way to scope them to one official; it
    only ever appears in the Admin (system-wide) response.
    """
    owner_user_id = _scope_owner_id(current_user)
    mine_only = owner_user_id is not None
    response = {
        "scope": "mine" if mine_only else "all",
        "most_viewed_policies": most_viewed_policies(db, limit=5, owner_user_id=owner_user_id),
        "most_viewed_schemes": most_viewed_schemes(db, limit=5, owner_user_id=owner_user_id),
    }
    if not mine_only:
        response["most_searched_terms"] = most_searched_terms(db, limit=10)
    return response


@router.get("/department")
def get_department_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "administrator")),
):
    """
    Milestone 3 - Department Analytics. Groups every scheme (system-wide,
    not scoped to one official) by department and reports how many are
    Active vs everything else (Draft/Pending/Archived/null status), so
    each row's active_schemes + inactive_schemes always sums to
    total_schemes.

    Admin-only, unlike /overview and /content-usage above — this data is
    cross-official by nature (comparing every department against every
    other), so it can't be scoped down to "my own data" the way those
    two can. That makes it exactly the kind of system-wide information
    that should stay behind Admin, not the broader Official+Admin
    _ANALYTICS_ROLES group. Previously this endpoint had NO auth check
    at all — anyone, logged in or not, could call it directly.
    """
    rows = (
        db.query(
            Scheme.department,
            func.count(Scheme.scheme_id).label("total_schemes"),
            func.sum(case((Scheme.status == "Active", 1), else_=0)).label("active_schemes"),
        )
        .group_by(Scheme.department)
        .all()
    )

    data = []
    for department, total_schemes, active_schemes in rows:
        active = int(active_schemes or 0)
        data.append({
            "department": department or "Unspecified",
            "total_schemes": total_schemes,
            "active_schemes": active,
            "inactive_schemes": total_schemes - active,
        })

    return {
        "message": "Scheme counts grouped by department",
        "count": len(data),
        "data": data,
    }


@router.get("/department/policies")
def get_policy_department_analytics(
    db: Session = Depends(get_db),
):
    """
    Policies Department Analytics (Milestone 3 extension) — mirrors
    get_department_analytics above but over the policies table/Policy
    model instead of schemes. Same shape and same Active-vs-everything-
    else (Draft/Pending/Archived/null) rule, so active_policies +
    inactive_policies always sums to total_policies.
    """
    rows = (
        db.query(
            Policy.department,
            func.count(Policy.policy_id).label("total_policies"),
            func.sum(case((Policy.status == "Active", 1), else_=0)).label("active_policies"),
        )
        .group_by(Policy.department)
        .all()
    )

    data = []
    for department, total_policies, active_policies in rows:
        active = int(active_policies or 0)
        data.append({
            "department": department or "Unspecified",
            "total_policies": total_policies,
            "active_policies": active,
            "inactive_policies": total_policies - active,
        })

    return {
        "message": "Policy counts grouped by department",
        "count": len(data),
        "data": data,
    }