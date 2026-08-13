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

    # ========================================================
    # FARMER
    # ========================================================

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
    ),

    # ========================================================
    # STUDENT
    # ========================================================

    Scheme(
        scheme_name="Student Education Support Scheme",
        category="Education",
        eligibility="Students with annual family income below 500000",
        benefits="₹10,000 annual education assistance",
        department="Department of School Education",
        state="Tamil Nadu",
        min_age=5,
        max_age=30,
        max_income=500000,
        gender=None,
        occupation=None,
        education="Undergraduate",
        social_category=None,
        disability_required=None,
        application_guidance=(
            "Apply through the designated education department portal."
        )
    ),

    # ========================================================
    # WOMEN
    # ========================================================

    Scheme(
        scheme_name="Women Empowerment Support Scheme",
        category="Women",
        eligibility="Women citizens with annual income below 500000",
        benefits="₹12,000 annual financial assistance",
        department="Department of Social Welfare",
        state="Tamil Nadu",
        min_age=18,
        max_age=60,
        max_income=500000,
        gender="Female",
        occupation=None,
        education=None,
        social_category=None,
        disability_required=None,
        application_guidance=(
            "Apply through the designated social welfare department portal."
        )
    ),

    # ========================================================
    # SENIOR CITIZEN
    # ========================================================

    Scheme(
        scheme_name="Senior Citizen Welfare Scheme",
        category="Senior Citizen",
        eligibility="Senior citizens aged 60 years and above",
        benefits="₹1,000 monthly welfare assistance",
        department="Department of Social Welfare",
        state="Tamil Nadu",
        min_age=60,
        max_age=None,
        max_income=500000,
        gender=None,
        occupation=None,
        education=None,
        social_category=None,
        disability_required=None,
        application_guidance=(
            "Apply through the designated social welfare department."
        )
    ),

    # ========================================================
    # BUSINESS
    # ========================================================

    Scheme(
        scheme_name="Small Business Support Scheme",
        category="Business",
        eligibility="Small business owners with annual income below 1000000",
        benefits="Financial assistance up to ₹50,000",
        department="Department of Industries",
        state="Tamil Nadu",
        min_age=18,
        max_age=65,
        max_income=1000000,
        gender=None,
        occupation="Self-employed",
        education=None,
        social_category=None,
        disability_required=None,
        application_guidance=(
            "Apply through the designated industries department portal."
        )
    ),

    # ========================================================
    # GOVERNMENT EMPLOYEE
    # ========================================================

    Scheme(
        scheme_name="Government Employee Welfare Scheme",
        category="Government Employee",
        eligibility="Eligible government employees of Tamil Nadu",
        benefits="Employee welfare and financial support benefits",
        department="Government Employee Welfare Department",
        state="Tamil Nadu",
        min_age=18,
        max_age=60,
        max_income=None,
        gender=None,
        occupation="Salaried",
        education=None,
        social_category=None,
        disability_required=None,
        application_guidance=(
            "Apply through the designated government employee welfare portal."
        )
    ),

    # ========================================================
    # SELF EMPLOYED
    # ========================================================

    Scheme(
        scheme_name="Self Employment Assistance Scheme",
        category="Self Employed",
        eligibility="Self-employed citizens with annual income below 750000",
        benefits="Financial assistance for self-employment activities",
        department="Department of Industries",
        state="Tamil Nadu",
        min_age=18,
        max_age=60,
        max_income=750000,
        gender=None,
        occupation="Self-employed",
        education=None,
        social_category=None,
        disability_required=None,
        application_guidance=(
            "Apply through the designated self-employment department portal."
        )
    ),

    # ========================================================
    # UNEMPLOYED
    # ========================================================

    Scheme(
        scheme_name="Unemployment Assistance Scheme",
        category="Unemployed",
        eligibility="Unemployed citizens seeking employment assistance",
        benefits="Monthly employment assistance and skill development support",
        department="Department of Employment",
        state="Tamil Nadu",
        min_age=18,
        max_age=40,
        max_income=500000,
        gender=None,
        occupation="Unemployed",
        education=None,
        social_category=None,
        disability_required=None,
        application_guidance=(
            "Apply through the designated employment department portal."
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