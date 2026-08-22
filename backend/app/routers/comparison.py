from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
from typing import List

from app.utils.database import get_db
from app.models.policy import Policy
from app.models.scheme import Scheme


router = APIRouter(
    prefix="/compare",
    tags=["Policy Comparison"]
)


class MultiCompareRequest(BaseModel):
    ids: List[int]

    @field_validator("ids")
    @classmethod
    def validate_length(cls, v):
        if len(v) < 2:
            raise ValueError("Select at least 2 items to compare.")
        if len(v) > 4:
            raise ValueError("You can compare at most 4 items at once.")
        if len(set(v)) != len(v):
            raise ValueError("Duplicate items are not allowed in a comparison.")
        return v


def _serialize_policy(policy: Policy) -> dict:
    return {
        "policy_id": policy.policy_id,
        "policy_name": policy.policy_name,
        "category": policy.category,
        "department": policy.department,
        "ministry": policy.ministry,
        "government_level": policy.government_level,
        "state": policy.state,
        "status": policy.status,
        "approval_status": policy.approval_status,
        "publication_date": policy.publication_date,
        "effective_date": policy.effective_date,
        "description": policy.description,
        "document_url": policy.document_url,
    }


def _serialize_scheme(scheme: Scheme) -> dict:
    return {
        "scheme_id": scheme.scheme_id,
        "scheme_name": scheme.scheme_name,
        "category": scheme.category,
        "department": scheme.department,
        "government_level": scheme.government_level,
        "state": scheme.state,
        "benefits": scheme.benefits,
        "eligibility": scheme.eligibility,
        "income_limit": scheme.income_limit,
        "application_process": scheme.application_process,
        "required_documents": scheme.required_documents,
        "processing_time": scheme.processing_time,
        "official_website": scheme.official_website,
        "end_date": scheme.end_date,
        "status": scheme.status,
        "description": scheme.description,
    }


@router.get("/policies/{policy1_id}/{policy2_id}")
def compare_policies(
    policy1_id: int,
    policy2_id: int,
    db: Session = Depends(get_db)
):
    policy1 = db.query(Policy).filter(
        Policy.policy_id == policy1_id
    ).first()

    policy2 = db.query(Policy).filter(
        Policy.policy_id == policy2_id
    ).first()

    if not policy1 or not policy2:
        raise HTTPException(
            status_code=404,
            detail="One or both policies not found"
        )

    return {
        "policy_1": {
            "policy_name": policy1.policy_name,
            "category": policy1.category,
            "department": policy1.department,
            "ministry": policy1.ministry,
            "government_level": policy1.government_level,
            "state": policy1.state,
            "status": policy1.status,
            "approval_status": policy1.approval_status,
            "publication_date": policy1.publication_date,
            "effective_date": policy1.effective_date,
            "description": policy1.description
        },
        "policy_2": {
            "policy_name": policy2.policy_name,
            "category": policy2.category,
            "department": policy2.department,
            "ministry": policy2.ministry,
            "government_level": policy2.government_level,
            "state": policy2.state,
            "status": policy2.status,
            "approval_status": policy2.approval_status,
            "publication_date": policy2.publication_date,
            "effective_date": policy2.effective_date,
            "description": policy2.description
        }
    }


@router.get("/schemes/{scheme1_id}/{scheme2_id}")
def compare_schemes(
    scheme1_id: int,
    scheme2_id: int,
    db: Session = Depends(get_db)
):
    scheme1 = db.query(Scheme).filter(
        Scheme.scheme_id == scheme1_id
    ).first()

    scheme2 = db.query(Scheme).filter(
        Scheme.scheme_id == scheme2_id
    ).first()

    if not scheme1 or not scheme2:
        raise HTTPException(
            status_code=404,
            detail="One or both schemes not found"
        )

    return {
        "scheme_1": {
            "scheme_name": scheme1.scheme_name,
            "category": scheme1.category,
            "department": scheme1.department,
            "government_level": scheme1.government_level,
            "state": scheme1.state,
            "benefits": scheme1.benefits,
            "eligibility": scheme1.eligibility,
            "income_limit": scheme1.income_limit,
            "application_process": scheme1.application_process,
            "required_documents": scheme1.required_documents,
            "processing_time": scheme1.processing_time,
            "official_website": scheme1.official_website,
            "end_date": scheme1.end_date,
            "status": scheme1.status,
            "description": scheme1.description
        },

        "scheme_2": {
            "scheme_name": scheme2.scheme_name,
            "category": scheme2.category,
            "department": scheme2.department,
            "government_level": scheme2.government_level,
            "state": scheme2.state,
            "benefits": scheme2.benefits,
            "eligibility": scheme2.eligibility,
            "income_limit": scheme2.income_limit,
            "application_process": scheme2.application_process,
            "required_documents": scheme2.required_documents,
            "processing_time": scheme2.processing_time,
            "official_website": scheme2.official_website,
            "end_date": scheme2.end_date,
            "status": scheme2.status,
            "description": scheme2.description
        }
    }

@router.post("/policies/multi")
def compare_multiple_policies(
    payload: MultiCompareRequest,
    db: Session = Depends(get_db)
):
    """Compare 2-4 policies at once. Preserves the order the IDs were
    submitted in, so the frontend's column order matches the selection
    order the citizen made."""

    policies = (
        db.query(Policy)
        .filter(Policy.policy_id.in_(payload.ids))
        .all()
    )

    if len(policies) != len(payload.ids):
        raise HTTPException(
            status_code=404,
            detail="One or more policies not found"
        )

    by_id = {p.policy_id: p for p in policies}
    ordered = [by_id[pid] for pid in payload.ids]

    return {
        "policies": [_serialize_policy(p) for p in ordered]
    }


@router.post("/schemes/multi")
def compare_multiple_schemes(
    payload: MultiCompareRequest,
    db: Session = Depends(get_db)
):
    """Compare 2-4 schemes at once. Preserves submission order."""

    schemes = (
        db.query(Scheme)
        .filter(Scheme.scheme_id.in_(payload.ids))
        .all()
    )

    if len(schemes) != len(payload.ids):
        raise HTTPException(
            status_code=404,
            detail="One or more schemes not found"
        )

    by_id = {s.scheme_id: s for s in schemes}
    ordered = [by_id[sid] for sid in payload.ids]

    return {
        "schemes": [_serialize_scheme(s) for s in ordered]
    }