from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.utils.database import get_db
from app.models.policy import Policy
from app.schemas.policy_schema import PolicyCreate, PolicyUpdate, PolicyOut


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
    publication_date: Optional[str] = None,
    keyword: Optional[str] = None,
    include_archived: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(Policy)

    # Exclude archived policies by default
    if not include_archived and not status:
        query = query.filter(
            Policy.status != "Archived"
        )

    # Category filter
    if category:
        query = query.filter(
            Policy.category == category
        )

    # State filter
    if state:
        query = query.filter(
            Policy.state == state
        )

    # Department filter
    if department:
        query = query.filter(
            Policy.department == department
        )

    # Ministry filter
    if ministry:
        query = query.filter(
            Policy.ministry == ministry
        )

    # Status filter
    if status:
        query = query.filter(
            Policy.status == status
        )

    # Publication date filter
    if publication_date:
        query = query.filter(
            Policy.publication_date == publication_date
        )

    # Keyword search
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
        "data": [
            PolicyOut.model_validate(p)
            for p in policies
        ]
    }


@router.get("/{policy_id}")
def get_policy_by_id(
    policy_id: int,
    db: Session = Depends(get_db)
):
    policy = db.query(Policy).filter(
        Policy.policy_id == policy_id
    ).first()

    if not policy:
        raise HTTPException(
            status_code=404,
            detail="Policy not found"
        )

    return {
        "message": "Policy found",
        "data": PolicyOut.model_validate(policy)
    }


@router.put("/{policy_id}", response_model=PolicyOut)
def update_policy(
    policy_id: int,
    policy_update: PolicyUpdate,
    db: Session = Depends(get_db)
):
    policy = db.query(Policy).filter(
        Policy.policy_id == policy_id
    ).first()

    if not policy:
        raise HTTPException(
            status_code=404,
            detail="Policy not found"
        )

    update_data = policy_update.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(policy, field, value)

    db.commit()
    db.refresh(policy)

    return policy


@router.patch("/{policy_id}/archive", response_model=PolicyOut)
def archive_policy(
    policy_id: int,
    db: Session = Depends(get_db)
):
    policy = db.query(Policy).filter(
        Policy.policy_id == policy_id
    ).first()

    if not policy:
        raise HTTPException(
            status_code=404,
            detail="Policy not found"
        )

    policy.status = "Archived"

    db.commit()
    db.refresh(policy)

    return policy


@router.patch("/{policy_id}/unarchive", response_model=PolicyOut)
def unarchive_policy(
    policy_id: int,
    db: Session = Depends(get_db)
):
    policy = db.query(Policy).filter(
        Policy.policy_id == policy_id
    ).first()

    if not policy:
        raise HTTPException(
            status_code=404,
            detail="Policy not found"
        )

    policy.status = "Active"

    db.commit()
    db.refresh(policy)

    return policy


@router.post("/", response_model=PolicyOut)
def create_policy(
    policy: PolicyCreate,
    db: Session = Depends(get_db)
):
    new_policy = Policy(
        **policy.model_dump()
    )

    db.add(new_policy)
    db.commit()
    db.refresh(new_policy)

    return new_policy