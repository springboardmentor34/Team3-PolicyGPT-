from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.utils.database import get_db
from app.models.scheme import Scheme
from app.models.user import User
from app.schemas.scheme_schema import SchemeCreate, SchemeUpdate, SchemeOut
from app.auth.dependencies import require_roles, get_current_user_optional
from app.models.search_history import SearchHistory
from app.utils.activity_log import log_activity

router = APIRouter(
    prefix="/schemes",
    tags=["Public Scheme Management"]
)


def _require_owner(scheme: Scheme, current_user: User) -> None:
    """Same ownership rule as policies (see policy.py) — no role
    exemption, including for Admins. Schemes have no approval workflow,
    so this is the only access boundary content editing has."""
    if scheme.uploaded_by_user_id != current_user.user_id:
        raise HTTPException(
            status_code=403,
            detail="You can only edit or archive schemes you created yourself.",
        )


@router.get("/")
def get_all_schemes(
    category: Optional[str] = None,
    state: Optional[str] = None,
    department: Optional[str] = None,
    status: Optional[str] = None,
    keyword: Optional[str] = None,
    include_archived: bool = False,
    mine_only: bool = False,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    query = db.query(Scheme)

    if not include_archived and not status:
        query = query.filter(Scheme.status != "Archived")
    if mine_only:
        if not current_user:
            raise HTTPException(status_code=401, detail="Login required to view your own schemes.")
        query = query.filter(Scheme.uploaded_by_user_id == current_user.user_id)
    if category:
        query = query.filter(Scheme.category == category)
    if state:
        query = query.filter(Scheme.state == state)
    if department:
        query = query.filter(Scheme.department == department)
    if status:
        query = query.filter(Scheme.status == status)
    if keyword:
        search = f"%{keyword}%"
        query = query.filter(
            or_(
                Scheme.scheme_name.ilike(search),
                Scheme.description.ilike(search),
                Scheme.benefits.ilike(search)
            )
        )

    schemes = query.all()

    if keyword and current_user:
        db.add(SearchHistory(user_id=current_user.user_id, search_keyword=keyword))
        db.commit()

    return {
        "message": "List of all schemes",
        "count": len(schemes),
        "data": [SchemeOut.model_validate(s) for s in schemes]
    }


@router.get("/{scheme_id}")
def get_scheme_by_id(
    scheme_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional),
):
    scheme = db.query(Scheme).filter(Scheme.scheme_id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    log_activity(
        db,
        user_id=current_user.user_id if current_user else None,
        action="view_scheme",
        table_name="schemes",
        record_id=scheme_id,
    )

    return {
        "message": "Scheme found",
        "data": SchemeOut.model_validate(scheme)
    }


@router.put("/{scheme_id}", response_model=SchemeOut)
def update_scheme(
    scheme_id: int,
    scheme_update: SchemeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("official", "admin", "administrator")),
):
    scheme = db.query(Scheme).filter(Scheme.scheme_id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    _require_owner(scheme, current_user)

    update_data = scheme_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(scheme, field, value)

    db.commit()
    db.refresh(scheme)
    return scheme


@router.patch("/{scheme_id}/archive", response_model=SchemeOut)
def archive_scheme(
    scheme_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("official", "admin", "administrator")),
):
    scheme = db.query(Scheme).filter(Scheme.scheme_id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    _require_owner(scheme, current_user)

    scheme.status = "Archived"
    db.commit()
    db.refresh(scheme)
    return scheme


@router.patch("/{scheme_id}/unarchive", response_model=SchemeOut)
def unarchive_scheme(
    scheme_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("official", "admin", "administrator")),
):
    scheme = db.query(Scheme).filter(Scheme.scheme_id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    _require_owner(scheme, current_user)

    scheme.status = "Active"
    db.commit()
    db.refresh(scheme)
    return scheme


@router.post("/", response_model=SchemeOut)
def create_scheme(
    scheme: SchemeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("official", "admin", "administrator")),
):
    # uploaded_by_user_id is not trusted from the client — always the
    # actual authenticated creator, since that ID now gates who can edit
    # or archive this scheme later (see _require_owner above).
    scheme_data = scheme.model_dump()
    scheme_data["uploaded_by_user_id"] = current_user.user_id
    new_scheme = Scheme(**scheme_data)
    db.add(new_scheme)
    db.commit()
    db.refresh(new_scheme)
    return new_scheme