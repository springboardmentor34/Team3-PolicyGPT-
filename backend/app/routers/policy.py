from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.utils.database import get_db
from app.models.policy import Policy
from app.models.user import User
from app.schemas.policy_schema import (
    PolicyCreate,
    PolicyUpdate,
    PolicyOut,
    PolicyRejectRequest,
)
from app.auth.dependencies import require_roles, get_current_user_optional
from app.models.search_history import SearchHistory
from app.utils.activity_log import log_activity

router = APIRouter(
    prefix="/policies",
    tags=["Policy Management"]
)


def _require_owner(policy: Policy, current_user: User) -> None:
    """
    Ownership check for editing content — deliberately separate from role
    checks. An Official or Admin can only edit/archive a policy they
    personally created; role only gates *whether you can manage policies
    at all*, not *whose*. Admins are NOT exempt here on purpose — Admin's
    authority over content is the approve/reject workflow (which is about
    reviewing someone else's submission, not editing it directly) and
    User Management, not direct edit access to every official's work.
    """
    if policy.uploaded_by_user_id != current_user.user_id:
        raise HTTPException(
            status_code=403,
            detail="You can only edit or archive policies you created yourself.",
        )


def _status_for_approval(approval_status: str) -> str:
    """The lifecycle `status` shown to the public is derived from the
    approval decision, not editable directly — see PolicyUpdate/PolicyCreate
    for why. Archiving is layered on top via the dedicated archive/unarchive
    endpoints, which call this too so a restored policy comes back to the
    correct state instead of always landing on 'Active'."""
    if approval_status == "Approved":
        return "Active"
    if approval_status == "Rejected":
        return "Rejected"
    return "Pending"


@router.get("/")
def get_all_policies(
    category: Optional[str] = None,
    state: Optional[str] = None,
    department: Optional[str] = None,
    ministry: Optional[str] = None,
    status: Optional[str] = None,
    keyword: Optional[str] = None,
    include_archived: bool = False,
    public_only: bool = False,
    mine_only: bool = False,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    query = db.query(Policy)

    if not include_archived and not status:
        query = query.filter(Policy.status != "Archived")
    # Policy Approval Workflow (Task 4): citizen-facing callers pass
    # public_only=true so Pending/Rejected policies never appear in
    # public search results. Existing callers (e.g. the official's
    # manage-policies-schemes page) don't pass this, so their behavior
    # is unchanged.
    if public_only:
        query = query.filter(Policy.approval_status == "Approved")
    # Manage Policies & Schemes passes mine_only=true — officials (and
    # admins, who get no special exemption here) should only ever see
    # their own submissions in that view, not everyone's. Requires a
    # logged-in user; there's no sensible "mine" for an anonymous caller.
    if mine_only:
        if not current_user:
            raise HTTPException(status_code=401, detail="Login required to view your own policies.")
        query = query.filter(Policy.uploaded_by_user_id == current_user.user_id)
    if category:
        query = query.filter(Policy.category == category)
    if state:
        query = query.filter(Policy.state == state)
    if department:
        query = query.filter(Policy.department == department)
    if ministry:
        query = query.filter(Policy.ministry == ministry)
    if status:
        query = query.filter(Policy.status == status)
    if keyword:
        search = f"%{keyword}%"
        query = query.filter(
            or_(
                Policy.policy_name.ilike(search),
                Policy.description.ilike(search)
            )
        )

    policies = query.all()

    # Real search history (only when someone is actually logged in AND
    # searching by keyword — browsing with filters alone isn't "a search").
    if keyword and current_user:
        db.add(SearchHistory(user_id=current_user.user_id, search_keyword=keyword))
        db.commit()

    return {
        "message": "List of all policies",
        "count": len(policies),
        "data": [PolicyOut.model_validate(p) for p in policies]
    }


@router.get("/pending")
def get_pending_policies(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "administrator")),
):
    """Administrator-only: list policies awaiting approval, oldest first."""
    policies = (
        db.query(Policy)
        .filter(Policy.approval_status == "Pending")
        .order_by(Policy.created_at.asc())
        .all()
    )
    return {
        "message": "List of policies pending approval",
        "count": len(policies),
        "data": [PolicyOut.model_validate(p) for p in policies]
    }


@router.get("/{policy_id}")
def get_policy_by_id(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional),
):
    policy = db.query(Policy).filter(Policy.policy_id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    log_activity(
        db,
        user_id=current_user.user_id if current_user else None,
        action="view_policy",
        table_name="policies",
        record_id=policy_id,
    )

    return {
        "message": "Policy found",
        "data": PolicyOut.model_validate(policy)
    }


@router.put("/{policy_id}", response_model=PolicyOut)
def update_policy(
    policy_id: int,
    policy_update: PolicyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("official", "admin", "administrator")),
):
    policy = db.query(Policy).filter(Policy.policy_id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    _require_owner(policy, current_user)

    update_data = policy_update.model_dump(exclude_unset=True)

    changed = False
    for field, value in update_data.items():
        if getattr(policy, field, None) != value:
            changed = True
        setattr(policy, field, value)

    # Any real content edit sends the policy back for admin review — even
    # an already-Approved policy needs re-review once its content changes,
    # and a Rejected policy that gets fixed needs a way back into the
    # queue. A no-op "open Edit, hit Update without changing anything"
    # leaves the approval decision untouched, so officials aren't
    # penalized just for opening and re-saving the form.
    if changed:
        policy.approval_status = "Pending"
        policy.status = _status_for_approval("Pending")
        policy.rejection_reason = None
        policy.rejected_by = None
        policy.rejected_at = None
        policy.approved_by = None
        policy.approved_at = None

    db.commit()
    db.refresh(policy)
    return policy


@router.patch("/{policy_id}/archive", response_model=PolicyOut)
def archive_policy(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("official", "admin", "administrator")),
):
    policy = db.query(Policy).filter(Policy.policy_id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    _require_owner(policy, current_user)

    policy.status = "Archived"
    db.commit()
    db.refresh(policy)
    return policy


@router.patch("/{policy_id}/unarchive", response_model=PolicyOut)
def unarchive_policy(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("official", "admin", "administrator")),
):
    policy = db.query(Policy).filter(Policy.policy_id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    _require_owner(policy, current_user)

    policy.status = _status_for_approval(policy.approval_status)
    db.commit()
    db.refresh(policy)
    return policy


@router.patch("/{policy_id}/approve", response_model=PolicyOut)
def approve_policy(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "administrator")),
):
    policy = db.query(Policy).filter(Policy.policy_id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    if policy.approval_status == "Approved":
        raise HTTPException(status_code=400, detail="Policy is already approved")

    policy.approval_status = "Approved"
    policy.approved_by = current_user.user_id
    policy.approved_at = datetime.now(timezone.utc)
    policy.status = _status_for_approval("Approved")
    # Clear any prior rejection so the record doesn't show stale reasons
    # if a previously-rejected policy is resubmitted and later approved.
    policy.rejection_reason = None
    policy.rejected_by = None
    policy.rejected_at = None

    db.commit()
    db.refresh(policy)
    return policy


@router.patch("/{policy_id}/reject", response_model=PolicyOut)
def reject_policy(
    policy_id: int,
    payload: PolicyRejectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "administrator")),
):
    policy = db.query(Policy).filter(Policy.policy_id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    if policy.approval_status == "Rejected":
        raise HTTPException(status_code=400, detail="Policy is already rejected")

    policy.approval_status = "Rejected"
    policy.rejection_reason = payload.reason
    policy.rejected_by = current_user.user_id
    policy.rejected_at = datetime.now(timezone.utc)
    policy.status = _status_for_approval("Rejected")
    # Clear any prior approval fields for the same reason as above.
    policy.approved_by = None
    policy.approved_at = None

    db.commit()
    db.refresh(policy)
    return policy


@router.post("/", response_model=PolicyOut)
def create_policy(
    policy: PolicyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("official", "admin", "administrator")),
):
    # Policy Approval Workflow (Task 4): every newly created policy starts
    # as Pending, regardless of what the client sends — approval_status
    # isn't even part of PolicyCreate, so it can't be set at creation time.
    # uploaded_by_user_id is likewise NOT trusted from the client — a
    # policy is always attributed to whoever is actually authenticated,
    # not whatever ID the request body happens to contain, since that ID
    # now determines who's allowed to edit or archive it later.
    policy_data = policy.model_dump()
    policy_data["uploaded_by_user_id"] = current_user.user_id
    new_policy = Policy(**policy_data, approval_status="Pending", status="Pending")
    db.add(new_policy)
    db.commit()
    db.refresh(new_policy)
    return new_policy