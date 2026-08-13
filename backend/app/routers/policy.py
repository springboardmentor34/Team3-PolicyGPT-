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
from app.auth.dependencies import require_roles

router = APIRouter(
    prefix="/policies",
    tags=["Policy Management"]
)


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
def get_policy_by_id(policy_id: int, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.policy_id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return {
        "message": "Policy found",
        "data": PolicyOut.model_validate(policy)
    }


@router.put("/{policy_id}", response_model=PolicyOut)
def update_policy(policy_id: int, policy_update: PolicyUpdate, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.policy_id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    update_data = policy_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(policy, field, value)

    db.commit()
    db.refresh(policy)
    return policy


@router.patch("/{policy_id}/archive", response_model=PolicyOut)
def archive_policy(policy_id: int, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.policy_id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    policy.status = "Archived"
    db.commit()
    db.refresh(policy)
    return policy


@router.patch("/{policy_id}/unarchive", response_model=PolicyOut)
def unarchive_policy(policy_id: int, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.policy_id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    policy.status = "Active"
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
    # Clear any prior approval fields for the same reason as above.
    policy.approved_by = None
    policy.approved_at = None

    db.commit()
    db.refresh(policy)
    return policy


@router.post("/", response_model=PolicyOut)
def create_policy(policy: PolicyCreate, db: Session = Depends(get_db)):
    # Policy Approval Workflow (Task 4): every newly created policy starts
    # as Pending, regardless of what the client sends — approval_status
    # isn't even part of PolicyCreate, so it can't be set at creation time.
    new_policy = Policy(**policy.model_dump(), approval_status="Pending")
    db.add(new_policy)
    db.commit()
    db.refresh(new_policy)
    return new_policy