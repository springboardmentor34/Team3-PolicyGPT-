from fastapi import APIRouter
from backend.app.schemas.scheme_schema import Scheme

router = APIRouter(
    prefix="/schemes",
    tags=["Public Scheme Management"]
)


# ============================================================
# DEFAULT SCHEMES
# ============================================================

schemes = [
    Scheme(
        scheme_name="Farmer Support Scheme",
        category="Agriculture",
        eligibility="Farmers with annual income below 500000",
        benefits="₹6,000 financial assistance every year",
        department="Department of Agriculture",
        state="Tamil Nadu",
        min_age=18,
        max_age=60,
        max_income=500000,
        gender=None,
        occupation="Farmer",
        education=None,
        social_category=None,
        disability_required=None,
        application_guidance=(
            "Apply through the designated agriculture department portal."
        )
    )
]


# ============================================================
# GET ALL SCHEMES
# ============================================================

@router.get("/")
def get_all_schemes():
    return {
        "message": "List of all schemes",
        "data": schemes
    }


# ============================================================
# CREATE SCHEME
# ============================================================

@router.post("/")
def create_scheme(scheme: Scheme):
    schemes.append(scheme)

    return {
        "message": "Scheme created successfully",
        "scheme": scheme
    }