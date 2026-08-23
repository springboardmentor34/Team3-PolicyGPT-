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
    Ownership check for editing CONTENT — an Official or Admin can only
    change what a policy actually says (name, description, category,
    etc.) if they personally created it. No role exemption: Admin's
    authority is approve/reject (reviewing someone else's submission) and
    User Management, not rewriting another official's work.
    """
    if policy.uploaded_by_user_id != current_user.user_id:
        raise HTTPException(
            status_code=403,
            detail="You can only edit policies you created yourself.",
        )


def _require_owner_or_admin(policy: Policy, current_user: User) -> None:
    """
    Looser check for ARCHIVE/UNARCHIVE only — this is a moderation/
    lifecycle action (pull something from public view), not a content
    edit, so it's the one place Admin manages policies system-wide
    without needing to have authored them. An Official still can't touch
    another official's policy here; only Admin gets the exemption.
    """
    is_owner = policy.uploaded_by_user_id == current_user.user_id
    is_admin = (current_user.role or "").lower() in ("admin", "administrator")
    if not is_owner and not is_admin:
        raise HTTPException(
            status_code=403,
            detail="You can only archive or restore policies you created yourself.",
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


def _enrich_with_creator(policies: list, db: Session, skip: bool = False) -> list:
    """
    Attaches created_by_name to each policy. Only bothers with the extra
    lookup when it's actually useful — an Official viewing their own
    mine_only list already knows it's theirs, but Admin's system-wide
    view (post archive-exemption, Admin can now see and archive every
    official's policies) needs to show whose is whose, same reasoning as
    the submitted_by_name added to /pending below.
    """
    results = [PolicyOut.model_validate(p).model_dump() for p in policies]
    if skip:
        return results

    creator_ids = {p.uploaded_by_user_id for p in policies if p.uploaded_by_user_id}
    creators = {
        u.user_id: u.full_name
        for u in db.query(User).filter(User.user_id.in_(creator_ids)).all()
    } if creator_ids else {}

    for item in results:
        item["created_by_name"] = creators.get(item.get("uploaded_by_user_id"), "Unknown")
    return results


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
        "data": _enrich_with_creator(policies, db, skip=mine_only),
    }


@router.get("/pending")
def get_pending_policies(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "administrator")),
):
    """
    Administrator-only: list policies awaiting approval, oldest first.

    Each policy now includes who submitted it (submitted_by_name/email) —
    previously only uploaded_by_user_id (a bare number) was returned, so
    an Admin reviewing the queue had no way to tell which official
    submitted which policy without a separate lookup.
    """
    policies = (
        db.query(Policy)
        .filter(Policy.approval_status == "Pending")
        .order_by(Policy.created_at.asc())
        .all()
    )

    data = []
    for p in policies:
        item = PolicyOut.model_validate(p).model_dump()
        submitter = db.query(User).filter(User.user_id == p.uploaded_by_user_id).first()
        item["submitted_by_name"] = submitter.full_name if submitter else "Unknown"
        item["submitted_by_email"] = submitter.email if submitter else None
        data.append(item)

    return {
        "message": "List of policies pending approval",
        "count": len(policies),
        "data": data
    }


@router.get("/approved-by-me")
def get_policies_approved_by_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "administrator")),
):
    """
    An admin's own approval history — with more than one Admin account,
    each admin needs to see specifically what THEY approved (to unapprove
    it if it was a mistake), not a mixed list where it's unclear who
    approved what.

    Registered here, before GET /{policy_id}, on purpose — FastAPI
    matches routes in registration order, so a GET /policies/{policy_id}
    defined earlier would otherwise swallow "approved-by-me" as if it
    were a policy_id and this endpoint would never be reached.
    """
    policies = (
        db.query(Policy)
        .filter(Policy.approval_status == "Approved", Policy.approved_by == current_user.user_id)
        .order_by(Policy.approved_at.desc())
        .all()
    )

    data = []
    for p in policies:
        item = PolicyOut.model_validate(p).model_dump()
        submitter = db.query(User).filter(User.user_id == p.uploaded_by_user_id).first()
        item["submitted_by_name"] = submitter.full_name if submitter else "Unknown"
        data.append(item)

    return {
        "message": "Policies you have approved",
        "count": len(policies),
        "data": data,
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

    _require_owner_or_admin(policy, current_user)

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

    _require_owner_or_admin(policy, current_user)

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


@router.patch("/{policy_id}/unapprove", response_model=PolicyOut)
def unapprove_policy(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "administrator")),
):
    """
    Lets an Admin undo their OWN approval — a quick-correction tool for
    "I clicked Approve by mistake," not a general veto over another
    admin's decision. Deliberately checks approved_by == current_user,
    not just role: with more than one Admin account, Admin A shouldn't
    be able to silently reverse Admin B's approval. Overturning someone
    else's decision should go through Reject (with a reason, visible to
    everyone), not a quiet self-service undo.

    Sends the policy back to Pending — same as a fresh submission —
    rather than to Rejected, since nothing about the policy itself was
    found wrong; the admin just wants to re-review it.
    """
    policy = db.query(Policy).filter(Policy.policy_id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    if policy.approval_status != "Approved":
        raise HTTPException(status_code=400, detail="Only an approved policy can be unapproved")

    if policy.approved_by != current_user.user_id:
        raise HTTPException(
            status_code=403,
            detail="You can only unapprove policies you personally approved.",
        )

    policy.approval_status = "Pending"
    policy.status = _status_for_approval("Pending")
    policy.approved_by = None
    policy.approved_at = None

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