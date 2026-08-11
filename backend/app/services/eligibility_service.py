def check_scheme_eligibility(profile, scheme):
    """
    Check whether a user profile matches a scheme's eligibility criteria.
    """

    reasons = []

    # Age check
    if scheme.min_age is not None and profile.age < scheme.min_age:
        reasons.append(f"Minimum age is {scheme.min_age}")

    if scheme.max_age is not None and profile.age > scheme.max_age:
        reasons.append(f"Maximum age is {scheme.max_age}")

    # Income check
    if scheme.max_income is not None and profile.income > scheme.max_income:
        reasons.append(f"Maximum income is {scheme.max_income}")

        # Location check
    if scheme.state is not None:
        if scheme.state.lower() != profile.location.lower():
            reasons.append(f"Scheme is available in {scheme.state}")

    # Gender check
    if scheme.gender is not None:
        if scheme.gender.lower() != profile.gender.lower():
            reasons.append(f"Scheme is intended for {scheme.gender}")

    # Occupation check
    if scheme.occupation is not None:
        if scheme.occupation.lower() != profile.occupation.lower():
            reasons.append(f"Occupation must be {scheme.occupation}")

    # Education check
    if scheme.education is not None:
        if scheme.education.lower() != profile.education.lower():
            reasons.append(f"Education requirement is {scheme.education}")

    # Social category check
    if scheme.social_category is not None:
        if scheme.social_category.lower() != profile.social_category.lower():
            reasons.append(
                f"Social category must be {scheme.social_category}"
            )

    # Disability check
    if scheme.disability_required is not None:
        if profile.disability_status != scheme.disability_required:
            if scheme.disability_required:
                reasons.append("Disability status is required")

    return {
        "eligible": len(reasons) == 0,
        "reasons": reasons
    }