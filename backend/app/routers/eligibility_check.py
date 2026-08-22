from typing import Optional, List
import datetime as _dt

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.utils.database import get_db
from app.models.eligibility_rule import EligibilityRule
from app.models.scheme import Scheme
from app.auth.dependencies import get_current_user, get_current_user_optional
from app.models.user import User
from app.utils.activity_log import log_activity

router = APIRouter(
    prefix="/eligibility",
    tags=["Eligibility Checker"]
)

# Values that mean "no state restriction" wherever an admin might phrase it.
# Kept in sync with the frontend's ALL_INDIA constant
# (frontend/src/app/shared/constants.ts) and its STATE_WILDCARDS list —
# the admin's eligibility-rule form offers "All India" as a real dropdown
# option, so it must be recognized here or "All India" schemes silently
# stop matching anyone.
STATE_WILDCARDS = {"", "any", "all", "all states", "all india", "national", "pan india", "nationwide"}

CATEGORY_ICONS = {
    "Scholarships": "school",
    "Farmer Welfare": "agriculture",
    "Healthcare": "local_hospital",
    "Housing": "home",
    "Business Support": "storefront",
    "Women Empowerment": "diversity_3",
    "Senior Citizen Welfare": "elderly",
    "Student Schemes": "menu_book",
    "Employment Programs": "work",
    "Social Security": "shield",
}


class EligibilityCheckRequest(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    income: Optional[float] = None
    occupation: Optional[str] = None
    education: Optional[str] = None
    location: Optional[str] = None
    district: Optional[str] = None
    social_category: Optional[str] = None
    disability_status: Optional[bool] = None


def _check_rule(rule: EligibilityRule, req: EligibilityCheckRequest):
    reasons: List[str] = []

    if rule.minimum_age is not None and req.age is not None and req.age < rule.minimum_age:
        reasons.append(f"Minimum age required is {rule.minimum_age}")

    if rule.maximum_age is not None and req.age is not None and req.age > rule.maximum_age:
        reasons.append(f"Maximum age allowed is {rule.maximum_age}")

    if rule.gender and rule.gender.lower() != "any" and req.gender:
        if rule.gender.lower() != req.gender.lower():
            reasons.append(f"Scheme is restricted to {rule.gender}")

    if rule.maximum_income is not None and req.income is not None:
        if req.income > float(rule.maximum_income):
            reasons.append(f"Annual income must be below Rs. {float(rule.maximum_income):,.0f}")

    if rule.occupation and rule.occupation.lower() != "any" and req.occupation:
        if rule.occupation.lower() != req.occupation.lower():
            reasons.append(f"Scheme requires occupation: {rule.occupation}")

    if rule.education and rule.education.lower() != "any" and req.education:
        if rule.education.lower() != req.education.lower():
            reasons.append(f"Scheme requires education level: {rule.education}")

    if rule.state and rule.state.strip().lower() not in STATE_WILDCARDS and req.location:
        if rule.state.strip().lower() != req.location.strip().lower():
            reasons.append(f"Scheme is limited to {rule.state}")
            
    if rule.district and rule.district.lower() != "any" and req.district:
        if rule.district.lower() != req.district.lower():
            reasons.append(f"Scheme is limited to {rule.district} district")

    if rule.social_category and rule.social_category.lower() != "any" and req.social_category:
        if rule.social_category.lower() != req.social_category.lower():
            reasons.append(f"Scheme requires social category: {rule.social_category}")

    if rule.disability_status is True and req.disability_status is False:
        reasons.append("Scheme is reserved for persons with disabilities")

    return (len(reasons) == 0, reasons)


def _build_profile_summary(req: EligibilityCheckRequest) -> str:
    parts = []

    if req.age is not None:
        parts.append(f"{req.age}-year-old")

    if req.gender:
        parts.append(req.gender)

    if req.occupation:
        parts.append(f"working as {req.occupation}")

    if req.education:
        parts.append(f"with {req.education} education")

    location_bits = [b for b in [req.district, req.location] if b]
    if location_bits:
        parts.append(f"from {', '.join(location_bits)}")

    if req.social_category:
        parts.append(f"({req.social_category} category)")

    if req.income is not None:
        parts.append(f"with an annual income of Rs. {req.income:,.0f}")

    if req.disability_status:
        parts.append("and identifies as a person with disability")

    if not parts:
        return "No profile details were provided."

    return "You are " + " ".join(parts) + "."


def _build_application_guidance(scheme: Scheme) -> List[str]:
    steps = []

    if scheme.eligibility:
        steps.append(f"Confirm eligibility: {scheme.eligibility}")

    if scheme.required_documents:
        steps.append(f"Prepare documents: {scheme.required_documents}")

    if scheme.application_process:
        steps.append(f"Apply: {scheme.application_process}")

    if scheme.official_website:
        steps.append(f"Visit the official website: {scheme.official_website}")

    if scheme.processing_time:
        steps.append(f"Expected processing time: {scheme.processing_time}")

    if not steps:
        steps.append("Application guidance is not available for this scheme yet.")

    return steps


def _serialize_scheme(scheme: Scheme, reasons: Optional[List[str]] = None) -> dict:
    data = {
        "scheme_id": scheme.scheme_id,
        "title": scheme.scheme_name,
        "description": scheme.description,
        "category": scheme.category,
        "icon": CATEGORY_ICONS.get(scheme.category, "verified"),
        "benefit": scheme.benefits,
        "deadline": scheme.end_date.isoformat() if scheme.end_date else "No deadline",
        "department": scheme.department,
        "eligibility": scheme.eligibility,
        "application_process": scheme.application_process,
        "official_website": scheme.official_website,
    }

    if reasons is None:
        data["application_guidance"] = _build_application_guidance(scheme)
    else:
        data["reasons_not_eligible"] = reasons

    return data


@router.post("/check")
def check_eligibility(
    req: EligibilityCheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional),
):

    log_activity(
        db,
        user_id=current_user.user_id if current_user else None,
        action="eligibility_check",
    )

    all_schemes = (
        db.query(Scheme)
        .filter(Scheme.status != "Archived")
        .all()
    )

    all_rules = db.query(EligibilityRule).all()

    rules_by_scheme: dict = {}
    for rule in all_rules:
        rules_by_scheme.setdefault(rule.scheme_id, []).append(rule)

    eligible_schemes = []
    ineligible_schemes = []

    for scheme in all_schemes:
        rules = rules_by_scheme.get(scheme.scheme_id, [])

        if not rules:
            eligible_schemes.append(_serialize_scheme(scheme))
            continue

        best_match = False
        best_reasons: List[str] = []

        for rule in rules:
            is_match, reasons = _check_rule(rule, req)
            if is_match:
                best_match = True
                break
            if not best_reasons or len(reasons) < len(best_reasons):
                best_reasons = reasons

        if best_match:
            eligible_schemes.append(_serialize_scheme(scheme))
        else:
            ineligible_schemes.append(_serialize_scheme(scheme, reasons=best_reasons))

    def relevance(item: dict) -> int:
        score = 0
        if req.occupation and item["category"] and req.occupation.lower() in item["category"].lower():
            score += 1
        if req.education and item["category"] and "student" in item["category"].lower() and "student" in (req.education or "").lower():
            score += 1
        return -score

    eligible_schemes.sort(key=relevance)

    matched_categories = sorted({
        s["category"] for s in eligible_schemes if s["category"]
    })

    eligibility_summary = {
        "total_schemes_evaluated": len(all_schemes),
        "eligible_count": len(eligible_schemes),
        "not_eligible_count": len(ineligible_schemes),
        "matched_categories": matched_categories,
    }

    return {
        "message": "Eligibility check complete",
        "profile_summary": _build_profile_summary(req),
        "profile": req.model_dump(),
        "eligibility_summary": eligibility_summary,
        "eligible_count": len(eligible_schemes),
        "eligible_schemes": eligible_schemes,
        "ineligible_schemes": ineligible_schemes,
    }


@router.get("/my-matches")
def my_eligible_schemes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    age = None
    if current_user.date_of_birth:
        today = _dt.date.today()
        dob = current_user.date_of_birth
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    req = EligibilityCheckRequest(
        age=age,
        gender=current_user.gender,
        income=float(current_user.income) if current_user.income is not None else None,
        occupation=current_user.occupation,
        education=current_user.education,
        location=current_user.state,
        district=current_user.district,
        social_category=current_user.social_category,
        disability_status=current_user.disability_status,
    )

    return check_eligibility(req, db, current_user)