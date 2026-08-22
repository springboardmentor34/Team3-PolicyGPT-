from typing import Optional
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.utils.database import get_db
from app.models.policy import Policy
from app.models.scheme import Scheme
from app.models.search_history import SearchHistory
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.schemas.policy_schema import PolicyOut
from app.schemas.scheme_schema import SchemeOut


router = APIRouter(
    prefix="/search",
    tags=["Search"]
)


@router.get("/")
def search(
    keyword: Optional[str] = None,
    user_id: Optional[int] = None,
    policy_name: Optional[str] = None,
    scheme_name: Optional[str] = None,
    category: Optional[str] = None,
    department: Optional[str] = None,
    state: Optional[str] = None,
    ministry: Optional[str] = None,
    status: Optional[str] = None,
    publication_date: Optional[date] = None,
    db: Session = Depends(get_db)
):

    # ---------------- POLICY SEARCH ----------------

    policy_query = db.query(Policy)

    if keyword:
        search_text = f"%{keyword}%"

        policy_query = policy_query.filter(
            or_(
                Policy.policy_name.ilike(search_text),
                Policy.description.ilike(search_text),
                Policy.category.ilike(search_text),
                Policy.department.ilike(search_text),
                Policy.ministry.ilike(search_text)
            )
        )

    if policy_name:
        policy_query = policy_query.filter(
            Policy.policy_name.ilike(f"%{policy_name}%")
        )

    if category:
        policy_query = policy_query.filter(
            Policy.category == category
        )

    if department:
        policy_query = policy_query.filter(
            Policy.department == department
        )

    if state:
        policy_query = policy_query.filter(
            Policy.state == state
        )

    if ministry:
        policy_query = policy_query.filter(
            Policy.ministry == ministry
        )

    if status:
        policy_query = policy_query.filter(
            Policy.status == status
        )

    if publication_date:
        policy_query = policy_query.filter(
            Policy.publication_date == publication_date
        )

    policies = policy_query.all()


    # ---------------- SCHEME SEARCH ----------------

    scheme_query = db.query(Scheme)

    if keyword:
        search_text = f"%{keyword}%"

        scheme_query = scheme_query.filter(
            or_(
                Scheme.scheme_name.ilike(search_text),
                Scheme.description.ilike(search_text),
                Scheme.category.ilike(search_text),
                Scheme.department.ilike(search_text),
                Scheme.benefits.ilike(search_text)
            )
        )

    if scheme_name:
        scheme_query = scheme_query.filter(
            Scheme.scheme_name.ilike(f"%{scheme_name}%")
        )

    if category:
        scheme_query = scheme_query.filter(
            Scheme.category == category
        )

    if department:
        scheme_query = scheme_query.filter(
            Scheme.department == department
        )

    if state:
        scheme_query = scheme_query.filter(
            Scheme.state == state
        )

    if status:
        scheme_query = scheme_query.filter(
            Scheme.status == status
        )

    schemes = scheme_query.all()


    # ---------------- SEARCH HISTORY ----------------

    if keyword and user_id:

        print("Saving search history...")
        print("User ID:", user_id)
        print("Keyword:", keyword)

        history = SearchHistory(
            user_id=user_id,
            search_keyword=keyword
        )

        db.add(history)
        db.commit()
        db.refresh(history)

        print("Search history saved:", history.search_id)


    # ---------------- RESPONSE ----------------

    return {
        "message": "Search results",
        "policy_count": len(policies),
        "scheme_count": len(schemes),
        "policies": [
            PolicyOut.model_validate(policy)
            for policy in policies
        ],
        "schemes": [
            SchemeOut.model_validate(scheme)
            for scheme in schemes
        ]
    }


@router.get("/history/me")
def get_my_search_history(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns the logged-in citizen's own most recent searches, newest first."""
    history = (
        db.query(SearchHistory)
        .filter(SearchHistory.user_id == current_user.user_id)
        .order_by(SearchHistory.searched_at.desc())
        .limit(limit)
        .all()
    )
    return {
        "message": "Search history",
        "count": len(history),
        "data": [
            {
                "search_id": h.search_id,
                "keyword": h.search_keyword,
                "searched_at": h.searched_at,
            }
            for h in history
        ]
    }