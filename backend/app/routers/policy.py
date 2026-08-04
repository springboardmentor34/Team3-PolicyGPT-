from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.utils.database import get_db
from app.models.policy import Policy
from app.schemas.policy_schema import PolicyCreate, PolicyOut

router = APIRouter(
    prefix="/policies",
    tags=["Policy Management"]
)


@router.get("/")
def get_all_policies(db: Session = Depends(get_db)):
    policies = db.query(Policy).all()
    return {
        "message": "List of all policies",
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


@router.post("/", response_model=PolicyOut)
def create_policy(policy: PolicyCreate, db: Session = Depends(get_db)):
    new_policy = Policy(**policy.model_dump())
    db.add(new_policy)
    db.commit()
    db.refresh(new_policy)
    return new_policy