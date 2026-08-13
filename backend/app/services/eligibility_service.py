def check_scheme_eligibility(profile, scheme):
    """
    Check whether a user profile matches a scheme's eligibility criteria.
    """

    reasons = []

    # ============================================================
    # CATEGORY CHECK
    # ============================================================

    category = getattr(profile, "category", "")

    if category:
        category = category.lower().strip()

        scheme_category = scheme.category.lower().strip()

        category_matches = {
            "student": "education",
            "farmer": "agriculture",
            "women": "women",
            "senior citizen": "senior citizen",
            "business": "business",
            "government employee": "government employee",
            "self employed": "self employed",
            "unemployed": "unemployed"
        }

        expected_category = category_matches.get(category)

        if expected_category is not None:
            if scheme_category != expected_category:
                reasons.append(
                    f"Scheme is for {expected_category}"
                )

    # ============================================================
    # AGE CHECK
    # ============================================================

    if scheme.min_age is not None and profile.age < scheme.min_age:
        reasons.append(
            f"Minimum age is {scheme.min_age}"
        )

    if scheme.max_age is not None and profile.age > scheme.max_age:
        reasons.append(
            f"Maximum age is {scheme.max_age}"
        )

    # ============================================================
    # INCOME CHECK
    # ============================================================

    if scheme.max_income is not None:
        if profile.income > scheme.max_income:
            reasons.append(
                f"Maximum income is {scheme.max_income}"
            )

    # ============================================================
    # STATE CHECK
    # ============================================================

    if scheme.state is not None:
        if scheme.state.lower() != profile.location.lower():
            reasons.append(
                f"Scheme is available in {scheme.state}"
            )

    # ============================================================
    # GENDER CHECK
    # ============================================================

    if scheme.gender is not None:
        if profile.gender.lower() != scheme.gender.lower():
            reasons.append(
                f"Scheme is intended for {scheme.gender}"
            )

    # ============================================================
    # OCCUPATION CHECK
    # ============================================================

    if scheme.occupation is not None:
        if profile.occupation.lower() != scheme.occupation.lower():
            reasons.append(
                f"Occupation must be {scheme.occupation}"
            )

    # ============================================================
    # EDUCATION CHECK
    # ============================================================

    if scheme.education is not None:
        if profile.education.lower() != scheme.education.lower():
            reasons.append(
                f"Education requirement is {scheme.education}"
            )

    # ============================================================
    # SOCIAL CATEGORY CHECK
    # ============================================================

    if scheme.social_category is not None:
        if profile.social_category.lower() != scheme.social_category.lower():
            reasons.append(
                f"Social category must be {scheme.social_category}"
            )

    # ============================================================
    # DISABILITY CHECK
    # ============================================================

    if scheme.disability_required is not None:
        if profile.disability_status != scheme.disability_required:
            reasons.append(
                "Disability eligibility requirement not satisfied"
            )

    # ============================================================
    # FINAL RESULT
    # ============================================================

    return {
        "eligible": len(reasons) == 0,
        "reasons": reasons
    }