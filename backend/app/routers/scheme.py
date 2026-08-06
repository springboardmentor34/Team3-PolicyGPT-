from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.utils.database import get_db
from app.models.scheme import Scheme
from app.schemas.scheme_schema import SchemeCreate, SchemeUpdate, SchemeOut

router = APIRouter(
    prefix="/schemes",
    tags=["Public Scheme Management"]
)


@router.get("/")
def get_all_schemes(
    category: Optional[str] = None,
    state: Optional[str] = None,
    department: Optional[str] = None,
    status: Optional[str] = None,
    keyword: Optional[str] = None,
    include_archived: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(Scheme)

    if not include_archived and not status:
        query = query.filter(Scheme.status != "Archived")
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
    return {
        "message": "List of all schemes",
        "count": len(schemes),
        "data": [SchemeOut.model_validate(s) for s in schemes]
    }


@router.get("/{scheme_id}")
def get_scheme_by_id(scheme_id: int, db: Session = Depends(get_db)):
    scheme = db.query(Scheme).filter(Scheme.scheme_id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return {
        "message": "Scheme found",
        "data": SchemeOut.model_validate(scheme)
    }


@router.put("/{scheme_id}", response_model=SchemeOut)
def update_scheme(scheme_id: int, scheme_update: SchemeUpdate, db: Session = Depends(get_db)):
    scheme = db.query(Scheme).filter(Scheme.scheme_id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    update_data = scheme_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(scheme, field, value)

    db.commit()
    db.refresh(scheme)
    return scheme


@router.patch("/{scheme_id}/archive", response_model=SchemeOut)
def archive_scheme(scheme_id: int, db: Session = Depends(get_db)):
    scheme = db.query(Scheme).filter(Scheme.scheme_id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    scheme.status = "Archived"
    db.commit()
    db.refresh(scheme)
    return scheme


@router.patch("/{scheme_id}/unarchive", response_model=SchemeOut)
def unarchive_scheme(scheme_id: int, db: Session = Depends(get_db)):
    scheme = db.query(Scheme).filter(Scheme.scheme_id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    scheme.status = "Active"
    db.commit()
    db.refresh(scheme)
    return scheme


@router.post("/", response_model=SchemeOut)
def create_scheme(scheme: SchemeCreate, db: Session = Depends(get_db)):
    new_scheme = Scheme(**scheme.model_dump())
    db.add(new_scheme)
    db.commit()
    db.refresh(new_scheme)
    return new_scheme