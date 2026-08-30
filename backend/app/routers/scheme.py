from typing import List, Optional
from datetime import date
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
from app.utils.notify import create_notification, broadcast_to_citizens
from app.models.application import Application
router = APIRouter(
    prefix="/schemes",
    tags=["Public Scheme Management"]
)
def _require_owner(scheme: Scheme, current_user: User) -> None:
    """Ownership check for editing CONTENT — same rule as policies (see
    policy.py). No role exemption, including for Admins."""
    if scheme.uploaded_by_user_id != current_user.user_id:
        raise HTTPException(
            status_code=403,
            detail="You can only edit schemes you created yourself.",
        )
def _require_owner_or_admin(scheme: Scheme, current_user: User) -> None:
    """Looser check for ARCHIVE/UNARCHIVE only — a moderation action, not
    a content edit. Admin gets a system-wide exemption here; Officials
    still don't."""
    is_owner = scheme.uploaded_by_user_id == current_user.user_id
    is_admin = (current_user.role or "").lower() in ("admin", "administrator")
    if not is_owner and not is_admin:
        raise HTTPException(
            status_code=403,
            detail="You can only archive or restore schemes you created yourself.",
        )
def _enrich_with_creator(schemes: list, db: Session, skip: bool = False) -> list:
    """Same reasoning as policy.py's _enrich_with_creator — only worth
    the extra lookup on Admin's system-wide view, not an official's own
    mine_only list."""
    results = [SchemeOut.model_validate(s).model_dump() for s in schemes]
    if skip:
        return results
    creator_ids = {s.uploaded_by_user_id for s in schemes if s.uploaded_by_user_id}
    creators = {
        u.user_id: u.full_name
        for u in db.query(User).filter(User.user_id.in_(creator_ids)).all()
    } if creator_ids else {}
    for item in results:
        item["uploaded_by_name"] = creators.get(item.get("uploaded_by_user_id"), "Unknown")
    return results
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
        "data": _enrich_with_creator(schemes, db, skip=mine_only),
    }
def _is_admin(user: User) -> bool:
    return (user.role or "").lower() in ("admin", "administrator")
@router.get("/upcoming-deadlines")
def get_upcoming_deadlines(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("official", "admin", "administrator", "government official")),
):
    """
    Real data for the Government Dashboard's "Upcoming Deadlines" card,
    replacing what was previously a hardcoded array. Scope is derived
    from the caller's own role, not a client-supplied flag — same fix we
    applied to analytics.py after finding that a client could just claim
    mine_only=false and see everyone's data. An Official only sees
    deadlines for schemes THEY created; Admin sees every scheme's.
    Registered before GET /{scheme_id} on purpose — FastAPI matches path
    params in declaration order, so putting this after would make
    "/upcoming-deadlines" get swallowed as if it were a scheme_id.
    """
    today = date.today()
    query = (
        db.query(Scheme)
        .filter(Scheme.end_date.isnot(None))
        .filter(Scheme.end_date >= today)
        .filter(Scheme.status != "Archived")
    )
    if not _is_admin(current_user):
        query = query.filter(Scheme.uploaded_by_user_id == current_user.user_id)
    schemes = query.order_by(Scheme.end_date.asc()).limit(limit).all()
    return {
        "message": "Upcoming scheme deadlines",
        "count": len(schemes),
        "data": [
            {
                "scheme_id": s.scheme_id,
                "scheme_name": s.scheme_name,
                "end_date": s.end_date,
                "category": s.category,
            }
            for s in schemes
        ],
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
        "data": _enrich_with_creator([scheme], db)[0]
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

    # Notification Module (Task 7): "Scheme Update Notifications" —
    # targeted at citizens who already applied to THIS scheme, since a
    # change to a scheme they've already acted on is directly relevant
    # to them, unlike a platform-wide broadcast.
    applicant_ids = {
        row.user_id for row in
        db.query(Application.user_id).filter(Application.scheme_id == scheme.scheme_id).all()
    }
    for user_id in applicant_ids:
        create_notification(
            db, user_id=user_id,
            title="Scheme Updated",
            message=f"A scheme you applied to, \"{scheme.scheme_name}\", has been updated.",
            notification_type="Scheme Updated",
            related_table="schemes", related_id=scheme.scheme_id,
        )

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
    _require_owner_or_admin(scheme, current_user)
    scheme.status = "Archived"
    db.commit()
    db.refresh(scheme)
    # Only logged when an Admin archives someone else's scheme — an
    # official archiving their own is routine self-service, not an
    # administrative action worth an audit trail entry (same convention
    # as policy.py's archive_policy).
    if (current_user.role or "").strip().lower() in ("admin", "administrator") \
            and scheme.uploaded_by_user_id != current_user.user_id:
        log_activity(
            db, current_user.user_id,
            action="admin_archive_scheme", table_name="schemes", record_id=scheme.scheme_id,
        )
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
    _require_owner_or_admin(scheme, current_user)
    scheme.status = "Active"
    db.commit()
    db.refresh(scheme)
    if (current_user.role or "").strip().lower() in ("admin", "administrator") \
            and scheme.uploaded_by_user_id != current_user.user_id:
        log_activity(
            db, current_user.user_id,
            action="admin_unarchive_scheme", table_name="schemes", record_id=scheme.scheme_id,
        )
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

    # Notification Module (Task 7): "New Scheme" alert — a scheme has no
    # approval workflow (unlike policies), so creation itself is the
    # moment it becomes publicly visible; that's the right trigger point
    # for a broadcast, same reasoning as approve_policy's alert.
    broadcast_to_citizens(
        db,
        title="New Scheme Alert",
        message=f"A new scheme is now available: \"{new_scheme.scheme_name}\".",
        notification_type="New Scheme",
        related_table="schemes", related_id=new_scheme.scheme_id,
    )

    return new_scheme