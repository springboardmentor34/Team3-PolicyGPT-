from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.utils.database import get_db
from app.models.scheme import Scheme
from app.schemas.scheme_schema import SchemeCreate, SchemeOut

router = APIRouter(
    prefix="/schemes",
    tags=["Public Scheme Management"]
)


@router.get("/")
def get_all_schemes(db: Session = Depends(get_db)):
    schemes = db.query(Scheme).all()
    return {
        "message": "List of all schemes",
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


@router.post("/", response_model=SchemeOut)
def create_scheme(scheme: SchemeCreate, db: Session = Depends(get_db)):
    new_scheme = Scheme(**scheme.model_dump())
    db.add(new_scheme)
    db.commit()
    db.refresh(new_scheme)
    return new_scheme