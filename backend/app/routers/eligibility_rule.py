from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.utils.database import get_db
from app.models.eligibility_rule import EligibilityRule
from app.models.scheme import Scheme
from app.models.user import User
from app.schemas.eligibility_rule_schema import (
    EligibilityRuleCreate,
    EligibilityRuleUpdate,
    EligibilityRuleOut,
)
from app.auth.dependencies import require_roles

router = APIRouter(
    prefix="/eligibility-rules",
    tags=["Scheme Eligibility Rules"]
)


@router.get("/")
def get_all_rules(scheme_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(EligibilityRule)
    if scheme_id:
        query = query.filter(EligibilityRule.scheme_id == scheme_id)

    rules = query.all()
    return {
        "message": "List of eligibility rules",
        "count": len(rules),
        "data": [EligibilityRuleOut.model_validate(r) for r in rules]
    }


@router.get("/{rule_id}", response_model=EligibilityRuleOut)
def get_rule_by_id(rule_id: int, db: Session = Depends(get_db)):
    rule = db.query(EligibilityRule).filter(EligibilityRule.rule_id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Eligibility rule not found")
    return rule


@router.post("/", response_model=EligibilityRuleOut)
def create_rule(
    rule: EligibilityRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("official", "admin", "administrator")),
):
    scheme = db.query(Scheme).filter(Scheme.scheme_id == rule.scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail=f"Scheme with id {rule.scheme_id} not found")

    new_rule = EligibilityRule(**rule.model_dump())
    db.add(new_rule)
    db.commit()
    db.refresh(new_rule)
    return new_rule


@router.put("/{rule_id}", response_model=EligibilityRuleOut)
def update_rule(
    rule_id: int,
    rule_update: EligibilityRuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("official", "admin", "administrator")),
):
    rule = db.query(EligibilityRule).filter(EligibilityRule.rule_id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Eligibility rule not found")

    update_data = rule_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)

    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/{rule_id}")
def delete_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("official", "admin", "administrator")),
):
    rule = db.query(EligibilityRule).filter(EligibilityRule.rule_id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Eligibility rule not found")

    db.delete(rule)
    db.commit()
    return {"message": f"Eligibility rule {rule_id} deleted successfully"}