from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.utils.database import get_db
from app.models.policy import Policy
from app.models.scheme import Scheme


router = APIRouter(
    prefix="/compare",
    tags=["Policy Comparison"]
)


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