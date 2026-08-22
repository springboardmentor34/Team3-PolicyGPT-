from typing import Dict, List
from collections import OrderedDict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

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


def _counts_by(query, column) -> Dict[str, int]:
    """Group-by count helper, e.g. policies by category or department."""
    rows = query.with_entities(column, func.count()).group_by(column).all()
    return {(value or "Uncategorized"): count for value, count in rows}


def _approval_trend(db: Session) -> List[dict]:
    """
    'Approval rates over time' — every policy bucketed by the month it
    was SUBMITTED (created_at), split into how many of that month's
    submissions ended up Approved / Pending / Rejected. Built in Python
    rather than a Postgres-specific date_trunc query, since the small
    dataset here makes that simpler to read and test than SQL-side
    date bucketing.
    """
    rows = (
        db.query(Policy.created_at, Policy.approval_status)
        .filter(Policy.created_at.isnot(None))
        .all()
    )

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


def _scheme_usage_trend(db: Session) -> List[dict]:
    """
    Scheme Usage Statistics over time (Milestone 3, task vi) — how many
    schemes were published each month, split by status at query time
    (Active/Draft/Pending/Archived). There's no application/click
    tracking table in this schema, so "usage" here means publication
    volume and how much of what's been published is actually live for
    citizens to use — not per-scheme applicant counts, which aren't
    tracked anywhere yet.
    """
    rows = (
        db.query(Scheme.created_at, Scheme.status)
        .filter(Scheme.created_at.isnot(None))
        .all()
    )

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
    Live Policy Statistics + Scheme Usage Analytics, shared by the
    Government Dashboard and the Admin Dashboard (Milestone 3,
    'Develop Analytics Dashboard'). Both roles see identical numbers here
    — /admin/stats stays admin-only for the user-account/role breakdown,
    which a Government Official shouldn't see.
    """
    live_policies = db.query(Policy).filter(Policy.status != "Archived")
    live_schemes = db.query(Scheme).filter(Scheme.status != "Archived")

    total_policies = live_policies.count()
    total_schemes = live_schemes.count()

    return {
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
        "policies_by_status": _counts_by(db.query(Policy), Policy.status),
        "policies_by_approval": _counts_by(db.query(Policy), Policy.approval_status),
        "schemes_by_status": _counts_by(db.query(Scheme), Scheme.status),
        # "Approval rates over time" — the one genuinely time-based chart,
        # distinct from every other breakdown above which are all
        # point-in-time snapshots.
        "policy_approval_trend": _approval_trend(db),
        # Usage Statistics Dashboard (Milestone 3, task vi) — scheme
        # publication volume + live-vs-not split over time.
        "scheme_usage_trend": _scheme_usage_trend(db),
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

    The split follows the project spec itself: Module 8 lists "Scheme
    Usage Analytics" as a Government Dashboard requirement, while Audit
    Logs (which is genuinely about user accounts, not content) is listed
    only under Admin Dashboard. Most Viewed Policies/Schemes and Most
    Searched Terms describe what's popular, not who's using the platform
    — so they belong here, not gated behind the admin-only endpoint they
    originally shipped in.
    """
    return {
        "most_viewed_policies": most_viewed_policies(db, limit=5),
        "most_viewed_schemes": most_viewed_schemes(db, limit=5),
        "most_searched_terms": most_searched_terms(db, limit=10),
    }