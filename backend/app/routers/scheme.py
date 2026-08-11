from fastapi import APIRouter
from backend.app.schemas.scheme_schema import Scheme

router = APIRouter(
    prefix="/schemes",
    tags=["Public Scheme Management"]
)

schemes = []


@router.get("/")
def get_all_schemes():
    return {
        "message": "List of all schemes",
        "data": schemes
    }


@router.post("/")
def create_scheme(scheme: Scheme):
    schemes.append(scheme)
    return {
        "message": "Scheme created successfully",
        "scheme": scheme
    }