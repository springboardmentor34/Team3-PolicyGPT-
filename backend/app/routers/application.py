from typing import List
import datetime as _dt

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.utils.database import get_db
from app.models.application import Application
from app.models.scheme import Scheme
from app.models.user import User
from app.models.eligibility_rule import EligibilityRule
from app.auth.dependencies import get_current_user, require_roles
from app.schemas.application_schema import ApplicationCreate, ApplicationStatusUpdate
from app.routers.eligibility_check import EligibilityCheckRequest, _check_rule
from app.services.notification_service import create_in_app_notification

router = APIRouter(
    prefix="/applications",
    tags=["Applications"]
)

_ADMIN_ROLES = {"admin", "administrator"}


def _build_eligibility_request(user: User) -> EligibilityCheckRequest:
    """
    Mirrors eligibility_check.py's my_eligible_schemes() profile
    derivation exactly, so "are you eligible to apply" and "what are you
    eligible for" use the identical logic — not a separate copy that
    could quietly drift out of sync with it.
    """
    age = None
    if user.date_of_birth:
        today = _dt.date.today()
        dob = user.date_of_birth
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    return EligibilityCheckRequest(
        age=age,
        gender=user.gender,
        income=float(user.income) if user.income is not None else None,
        occupation=user.occupation,
        education=user.education,
        location=user.state,
        district=user.district,
        social_category=user.social_category,
        disability_status=user.disability_status,
    )


def _assert_eligible(scheme: Scheme, current_user: User, db: Session) -> None:
    """
    The one gap in an otherwise complete Applications feature: without
    this, ANY logged-in citizen could apply to ANY scheme regardless of
    its eligibility_rules — defeating the entire point of the
    Eligibility Checker, which exists specifically to tell a citizen
    which schemes they actually qualify for before they apply.

    Reuses _check_rule() from eligibility_check.py — the exact same
    rule-matching logic GET /eligibility/my-matches already uses — so
    "can I apply" and "am I eligible" can never silently disagree.
    """
    rules = db.query(EligibilityRule).filter(EligibilityRule.scheme_id == scheme.scheme_id).all()
    if not rules:
        # No rules configured = open to everyone, same convention
        # eligibility_check.py already uses for unrestricted schemes.
        return

    req = _build_eligibility_request(current_user)

    best_reasons: List[str] = []
    for rule in rules:
        is_match, reasons = _check_rule(rule, req)
        if is_match:
            return
        if not best_reasons or len(reasons) < len(best_reasons):
            best_reasons = reasons

    raise HTTPException(
        status_code=403,
        detail={
            "message": "You are not eligible to apply for this scheme.",
            "reasons": best_reasons,
        },
    )


def _serialize(row: Application, scheme: Scheme, applicant: User = None) -> dict:
    data = {
        "application_id": row.application_id,
        "status": row.status,
        "applied_at": row.applied_at,
        "updated_at": row.updated_at,
        "scheme_id": scheme.scheme_id,
        "scheme_name": scheme.scheme_name,
        "category": scheme.category,
        "department": scheme.department,
    }
    if applicant:
        data["applicant_name"] = applicant.full_name
        data["applicant_email"] = applicant.email
    return data


@router.get("/me")
def get_my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns the logged-in citizen's own applications, most recently
    applied first — this is what makes Application Status real instead of
    the hardcoded 4-row list it used to be."""
    rows = (
        db.query(Application)
        .filter(Application.user_id == current_user.user_id)
        .order_by(Application.applied_at.desc())
        .all()
    )

    results = []
    for row in rows:
        scheme = db.query(Scheme).filter(Scheme.scheme_id == row.scheme_id).first()
        if scheme:
            results.append(_serialize(row, scheme))

    return {
        "message": "Your applications",
        "count": len(results),
        "data": results
    }


@router.get("/all")
def get_all_applications(
    current_user: User = Depends(require_roles("official", "admin", "administrator")),
    db: Session = Depends(get_db)
):
    """
    Powers the Government Dashboard's 'Recent Applications' review table
    — previously a hardcoded 3-row list (Ravi Kumar/Priya/Arjun) with
    non-functional View/Review buttons.

    Scoped the same way policies/schemes already are throughout this
    app: an Official only sees applications submitted to SCHEMES THEY
    POSTED, not every official's; Admin sees every application,
    platform-wide, matching Admin's read-all authority everywhere else
    (Manage Policies & Schemes, Policy Approvals).
    """
    role = (current_user.role or "").strip().lower()

    query = db.query(Application, Scheme, User).join(
        Scheme, Scheme.scheme_id == Application.scheme_id
    ).join(
        User, User.user_id == Application.user_id
    )

    if role not in _ADMIN_ROLES:
        query = query.filter(Scheme.uploaded_by_user_id == current_user.user_id)

    rows = query.order_by(Application.applied_at.desc()).all()

    results = [_serialize(application, scheme, applicant) for application, scheme, applicant in rows]

    return {
        "message": "All applications" if role in _ADMIN_ROLES else "Applications for your schemes",
        "count": len(results),
        "data": results
    }


@router.post("/")
def apply_to_scheme(
    payload: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scheme = db.query(Scheme).filter(Scheme.scheme_id == payload.scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail=f"Scheme with id {payload.scheme_id} not found")

    _assert_eligible(scheme, current_user, db)

    existing = (
        db.query(Application)
        .filter(Application.user_id == current_user.user_id, Application.scheme_id == payload.scheme_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="You have already applied to this scheme")

    new_application = Application(
        user_id=current_user.user_id,
        scheme_id=payload.scheme_id,
        status="Submitted",
    )
    db.add(new_application)
    db.commit()
    db.refresh(new_application)

    return {
        "message": "Application submitted successfully",
        "application_id": new_application.application_id,
        "status": new_application.status,
    }


@router.patch("/{application_id}/status")
def update_application_status(
    application_id: int,
    payload: ApplicationStatusUpdate,
    current_user: User = Depends(require_roles("official", "admin", "administrator")),
    db: Session = Depends(get_db)
):
    """
    Officials/Admin move an application through Submitted -> Under Review
    -> Approved/Rejected — this is what the Government Dashboard's
    'Recent Applications' review actions call.

    Ownership-scoped the same way as get_all_applications() above: an
    Official can only update applications submitted to their own
    schemes, not another official's. Admin has no such restriction,
    matching every other admin-vs-official boundary already established
    in this app.
    """
    application = db.query(Application).filter(Application.application_id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    role = (current_user.role or "").strip().lower()
    if role not in _ADMIN_ROLES:
        scheme = db.query(Scheme).filter(Scheme.scheme_id == application.scheme_id).first()
        if not scheme or scheme.uploaded_by_user_id != current_user.user_id:
            raise HTTPException(
                status_code=403,
                detail="You can only manage applications submitted to your own schemes."
            )

    application.status = payload.status.value

    # Notify the citizen about the application status change
    status_messages = {
    "Under Review": (
        "Application Under Review",
        "Your application for this scheme is now under review."
    ),
    "Approved": (
        "Application Approved",
        "Your application for this scheme has been approved."
    ),
    "Rejected": (
        "Application Rejected",
        "Your application for this scheme has been rejected."
    ),
    }

    title, message = status_messages.get(
        application.status,
        (
            "Application Status Updated",
            "Your application status has been updated."
        )
    )

    create_in_app_notification(
        db=db,
        user_id=application.user_id,
        title=title,
        message=message,
        notification_type="application",
    )

    db.commit()
    db.refresh(application)

    return {
        "message": "Application status updated",
        "application_id": application.application_id,
        "status": application.status,
    }