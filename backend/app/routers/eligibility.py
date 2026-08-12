from fastapi import APIRouter

from backend.app.schemas.eligibility_schema import EligibilityRequest
from backend.app.services.eligibility_service import check_scheme_eligibility
from backend.app.routers.scheme import schemes


router = APIRouter(
    prefix="/eligibility",
    tags=["Eligibility Checker"]
)


@router.post("/check")
def check_eligibility(profile: EligibilityRequest):

    results = []

    for scheme in schemes:

        result = check_scheme_eligibility(
            profile,
            scheme
        )

        results.append({
            "scheme_name": scheme.scheme_name,
            "category": scheme.category,
            "benefits": scheme.benefits,
            "eligibility": scheme.eligibility,
            "department": scheme.department,
            "state": scheme.state,
            "eligible": result["eligible"],
            "reasons": result["reasons"],
            "application_guidance": (
                scheme.application_guidance
                if result["eligible"]
                else None
            )
        })


    eligible_schemes = [
        result
        for result in results
        if result["eligible"]
    ]


    recommended_schemes = eligible_schemes


    return {
        "message": "Eligibility check completed",

        "profile": profile,

        "total_schemes_checked": len(results),

        "eligible_count": len(eligible_schemes),

        "not_eligible_count": (
            len(results) - len(eligible_schemes)
        ),

        "eligible_schemes": eligible_schemes,

        "recommended_schemes": recommended_schemes,

        "all_results": results
    }